---
name: animation-check
description: Use when the user reports that an animation isn't working — it's frozen, doesn't play, never starts, jumps, stutters, or looks wrong (e.g. "I don't see the idle animation", "nothing happens when I tap it", "it just shrinks"). Proves the fix by sampling the animation in a real browser over real time, with real taps and screenshots, before telling the user it works.
---

# Animation Check

The user is the first check: they report an animation that isn't working. This skill makes sure the
next answer is proven, not guessed. **Never tell the user an animation is fixed until it has passed
the "Verified" bar below.**

Why it exists: still screenshots and headless "virtual time" (`--virtual-time-budget`, `--timeout`,
`--dump-dom`) only render a handful of frames. A looping animation can look perfect in a still and be
frozen in reality. In this project the Start-screen stickman looked right in stills while its loop had
stopped after ~5 frames (Motion's `useAnimationFrame` re-subscribing on every render).

## 1. Reproduce before fixing

1. Start the app the way the user runs it (here: `npm run dev`; note the port it prints), and **wait
   until the URL actually answers** (e.g. poll `curl -s -o /dev/null -w "%{http_code}" <url>` until
   `200`) before probing. A probe that starts too early only measures an error page.
2. Start a real headless Chrome with remote debugging, in the background:
   ```
   "<chrome>" --headless=new --disable-gpu --remote-debugging-port=9333 --user-data-dir="<scratch>/cdp-profile" about:blank
   ```
   On Windows Chrome is usually `C:/Program Files/Google/Chrome/Application/chrome.exe`.
3. If the animation needs app state (a finished workout, a saved session), put a throwaway seed page in
   the dev server's public folder that writes `localStorage` and redirects to `/`. Name it `zz-*.html`
   so it is obvious, and **delete it when done**.
4. Write a steps file and run `node scripts/probe.mjs <url> <steps.json>` (path relative to this skill).
   Sample the animated element **at least 4 times, ~0.5–1 s apart, over several seconds**, reading real
   numbers: SVG attributes (`x2`, `cx`, `rx`, `points`), `getBoundingClientRect()`, or computed
   `transform`/`opacity`. Example step: `{ "at": 1500, "eval": "document.querySelector('svg line').getAttribute('x2')" }`.

If the values don't change when they should, the bug is reproduced. Now find the cause.

## 2. Common causes

- **The frame loop dies.** A component that re-renders every frame while using a hook that
  re-subscribes per render (Motion's `useAnimationFrame` with an inline callback). Use one
  `requestAnimationFrame` loop that subscribes once and reads the latest callback from a ref
  (this project: `src/lib/useFrameLoop.ts`).
- **It's switched off on purpose.** A "reduce motion" setting (OS or in-app) gating the animation.
  Check stored preferences in the sampled page (`localStorage`) and the code paths they disable.
- **The motion exists but is too subtle to see.** Numbers change by 1–2 px. Report the size of the
  movement; a few px over seconds reads as "frozen" to a person.
- **It's sized or placed wrong, not stopped.** The element overflows, is clipped, or has zero size
  (e.g. `rx="0"` because a pop-in never started, or a percentage height that never resolves).
- **The tap never reaches it.** Scripted `.click()` doesn't exist on SVG; a draggable parent may
  swallow the press. Always test with a real tap (`"tap"` step).

## 3. Verified means all of these

1. **Positions sampled over real time** in a really running browser change the way the animation should
   (and settle/loop when they should).
2. **Real interactions:** anything started by a tap/click is triggered with a `"tap"` step and sampled
   after it.
3. **Screenshots at the key moments** (`"shot"` steps), looked at. They support the numbers; they never
   prove motion on their own.
4. Re-run the same probe after the fix; the before/after numbers are the evidence.

Also check the layouts the user is likely to use (e.g. `--height 640` for a short phone) when the fix
touches sizing.

## 4. Report back

Show the user the sampled numbers (time → value) and what they mean, and the screenshots you looked at.
Say what you could not check (e.g. a real phone, sound). Then clean up: delete seed pages, stop the dev
server and Chrome you started.
