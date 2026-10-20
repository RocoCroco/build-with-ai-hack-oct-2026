// The time wheel is non-linear: ¼ turn = 15 min, ½ = 45 min, ¾ = 1 h, full turn = 2 h.
// Each quarter maps linearly onto its own range of minutes.
const QUARTERS: [fromMinutes: number, toMinutes: number][] = [
  [0, 15],
  [15, 45],
  [45, 60],
  [60, 120],
];

export const MAX_MINUTES = 120;

/** Clockwise degrees from the top (0–360, clamped) → whole minutes (0–120). */
export function angleToMinutes(angle: number): number {
  const a = Math.min(Math.max(angle, 0), 360);
  const quarter = Math.min(Math.floor(a / 90), 3);
  const [from, to] = QUARTERS[quarter];
  const within = (a - quarter * 90) / 90;
  return Math.round(from + within * (to - from));
}

/** Whole minutes → the angle that shows them, for keyboard steps and restoring a saved value. */
export function minutesToAngle(minutes: number): number {
  const m = Math.min(Math.max(minutes, 0), MAX_MINUTES);
  const quarter = QUARTERS.findIndex(([, to]) => m <= to);
  const [from, to] = QUARTERS[quarter];
  return quarter * 90 + ((m - from) / (to - from)) * 90;
}

/** 45 → "45 min", 63 → "1 h 03". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  return `${h} h ${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Adds a pointer move to the running angle without wrapping: crossing the top
 * keeps counting instead of jumping from 359° to 0°, and it stops at 0 and 360.
 */
export function addTurn(current: number, previousRaw: number, nextRaw: number): number {
  let delta = nextRaw - previousRaw;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return Math.min(Math.max(current + delta, 0), 360);
}

/** Pointer position → clockwise degrees from the top of the dial's center. */
export function pointerAngle(x: number, y: number, centerX: number, centerY: number): number {
  const deg = (Math.atan2(x - centerX, centerY - y) * 180) / Math.PI;
  return (deg + 360) % 360;
}
