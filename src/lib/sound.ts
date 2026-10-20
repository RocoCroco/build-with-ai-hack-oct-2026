// Sounds are generated with the Web Audio API, so there are no audio files.
// Browsers only allow audio after a tap; if anything fails, the app stays silent.

let ctx: AudioContext | null = null;

/** Call from a tap handler so later sounds (ticks during a roll) are allowed to play. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, start: number, length: number, volume: number, type: OscillatorType) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length);
}

let lastTick = 0;

/** A short click as an item passes the marker. */
export function playTick() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (now - lastTick < 0.025) return; // at full speed items pass faster than a click can sound
  lastTick = now;
  tone(1900 + Math.random() * 300, now, 0.03, 0.05, 'square');
}

let noise: AudioBuffer | null = null;
let lastDial = 0;

/**
 * A ratchet click for the time wheel: a short burst of filtered noise, like a knob's detent.
 * `amount` (0–1) raises the pitch as the time goes up, so winding it up sounds like it.
 */
export function playDial(amount: number) {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (now - lastDial < 0.02) return;
  lastDial = now;
  if (!noise) {
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400 + amount * 2600;
  filter.Q.value = 6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.03);
}

/** A short low clunk when a slot reel locks on its number. */
export function playReelStop() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  tone(330, now, 0.18, 0.14, 'triangle');
  tone(165, now, 0.12, 0.1, 'square');
}

/** A bright two-note chime when the roll lands. */
export function playLand() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  tone(988, now, 0.5, 0.12, 'triangle');
  tone(1480, now + 0.08, 0.7, 0.1, 'triangle');
}

/** One notch of the slot lever's ratchet; `depth` (0–1) lowers the pitch as it goes down. */
export function playLeverNotch(depth: number, delay = 0) {
  if (!ctx || ctx.state !== 'running') return;
  tone(700 - depth * 240, ctx.currentTime + delay, 0.025, 0.06, 'square');
}

/** The heavy clunk when the slot lever hits the bottom. */
export function playLeverClunk(delay = 0) {
  if (!ctx || ctx.state !== 'running') return;
  const start = ctx.currentTime + delay;
  tone(110, start, 0.22, 0.2, 'triangle');
  tone(220, start, 0.1, 0.08, 'square');
}

/** A whole tapped pull: a quick ratchet down, then the clunk. */
export function playLever() {
  for (let i = 0; i < 5; i++) playLeverNotch(i / 4, i * 0.05);
  playLeverClunk(0.27);
}

/** The neon switch: a chunky two-part click (the toggle snapping over), then the tube's buzz as it lights. */
export function playSwitch() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  tone(2400, now, 0.015, 0.12, 'square');
  tone(140, now, 0.06, 0.18, 'triangle');
  tone(1800, now + 0.035, 0.012, 0.08, 'square');
  // The ballast hum of a neon tube warming up
  tone(120, now + 0.05, 0.35, 0.03, 'sawtooth');
}
