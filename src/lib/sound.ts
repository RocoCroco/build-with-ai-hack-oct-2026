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

/** A bright two-note chime when the roll lands. */
export function playLand() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  tone(988, now, 0.5, 0.12, 'triangle');
  tone(1480, now + 0.08, 0.7, 0.1, 'triangle');
}
