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

/** A bright two-note chime when the roll lands. */
export function playLand() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  tone(988, now, 0.5, 0.12, 'triangle');
  tone(1480, now + 0.08, 0.7, 0.1, 'triangle');
}
