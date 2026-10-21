// Drives a real (headless) Chrome over the DevTools Protocol, in real time, and runs a list of
// steps against a page: sample values, tap elements, take screenshots.
//
// Usage:
//   node probe.mjs <url> <steps.json> [--port 9333] [--width 420] [--height 860]
//
// steps.json is an array; each step runs at `at` milliseconds after the page starts loading:
//   { "at": 1500, "eval": "<JS expression returning a JSON-able value>" }  -> prints the value
//   { "at": 2000, "tap": "<CSS selector>" }   -> real mouse press/release at the element's centre
//   { "at": 2500, "shot": "<path.png>" }      -> screenshot of the viewport
//
// Chrome must already be running with --remote-debugging-port (see SKILL.md).

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const [url, stepsPath] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!url || !stepsPath) {
  console.error('Usage: node probe.mjs <url> <steps.json> [--port 9333] [--width 420] [--height 860]');
  process.exit(1);
}
const port = flag('port', 9333);
const steps = JSON.parse(readFileSync(stepsPath, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let nextId = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
const { result: session } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
const sid = session.sessionId;
await send('Emulation.setDeviceMetricsOverride', { width: flag('width', 420), height: flag('height', 860), deviceScaleFactor: 1, mobile: true }, sid);
await send('Page.navigate', { url }, sid);
const start = Date.now();

const evaluate = async (expression) => {
  const { result } = await send('Runtime.evaluate', { expression, returnByValue: true }, sid);
  if (result.exceptionDetails) return `ERROR: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`;
  return result.result.value;
};

for (const step of steps) {
  await sleep(Math.max(0, step.at - (Date.now() - start)));
  if (step.eval) console.log(`${step.at}ms`, JSON.stringify(await evaluate(step.eval)));
  if (step.tap) {
    // A real pointer press/release, so React/Motion handlers see the same events as a finger or mouse.
    // (Scripted element.click() doesn't exist on SVG elements and skips pointer events.)
    const centre = await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(step.tap)}); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`,
    );
    if (!Array.isArray(centre)) {
      console.log(`${step.at}ms tap: no element for ${step.tap}`);
      continue;
    }
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: centre[0], y: centre[1], button: 'left', clickCount: 1 }, sid);
    }
    console.log(`${step.at}ms tap ${step.tap} at`, centre.map(Math.round).join(','));
  }
  if (step.shot) {
    const { result } = await send('Page.captureScreenshot', { format: 'png' }, sid);
    writeFileSync(step.shot, Buffer.from(result.data, 'base64'));
    console.log(`${step.at}ms screenshot`, step.shot);
  }
}

await send('Target.closeTarget', { targetId: target.targetId });
ws.close();
