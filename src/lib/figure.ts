// The how-to figure: a side-view stick figure facing right, posed by a few numbers.
// Angles are in degrees, absolute: 0 points down, 90 forward (right), 180 up, -90 back.
// A limb is either placed by where its hand/foot should be (`at`, the elbow or knee
// bends to reach it, so planted feet stay planted) or by its two angles (`angles`).

export type Point = [x: number, y: number];
export type Limb = { at: Point } | { angles: [upper: number, lower: number] };

export interface Pose {
  hip: Point;
  torso: number; // hip → shoulder
  head?: number; // tilt from the torso line
  toes?: boolean; // up on the toes (plank, push-up); otherwise the foot is flat on the floor
  arm: Limb;
  leg: Limb;
}

export interface Keyframe {
  pose: Pose;
  move?: number; // seconds to arrive here from the previous keyframe
  hold?: number; // seconds to stay here
}

export const LENGTHS = { torso: 46, neck: 6, head: 10, upperArm: 27, forearm: 25, thigh: 34, shin: 33, foot: 10 };

/** Elbows bend back, knees bend forward, for a figure facing right. */
const ELBOW_BEND = 1;
const KNEE_BEND = -1;

function dir(angle: number): Point {
  const r = (angle * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
}

function add([x, y]: Point, [dx, dy]: Point, length = 1): Point {
  return [x + dx * length, y + dy * length];
}

export function distance([ax, ay]: Point, [bx, by]: Point) {
  return Math.hypot(bx - ax, by - ay);
}

/**
 * Two-bone reach: from the root, finds the middle joint so the end lands on the target.
 * Targets out of reach get as close as the straight limb allows.
 */
export function solveLimb(root: Point, limb: Limb, l1: number, l2: number, bend: number): [mid: Point, end: Point] {
  if ('angles' in limb) {
    const mid = add(root, dir(limb.angles[0]), l1);
    return [mid, add(mid, dir(limb.angles[1]), l2)];
  }
  const [tx, ty] = limb.at;
  const raw = distance(root, limb.at);
  const d = Math.min(Math.max(raw, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const u: Point = raw > 0 ? [(tx - root[0]) / raw, (ty - root[1]) / raw] : [0, 1];
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const mid = add(add(root, u, a), [-u[1] * bend, u[0] * bend], h);
  return [mid, add(root, u, d)];
}

export interface Joints {
  hip: Point;
  shoulder: Point;
  head: Point;
  elbow: Point;
  hand: Point;
  knee: Point;
  ankle: Point;
  toe: Point;
}

export function joints(pose: Pose): Joints {
  const { hip } = pose;
  const shoulder = add(hip, dir(pose.torso), LENGTHS.torso);
  const head = add(shoulder, dir(pose.torso + (pose.head ?? 0)), LENGTHS.neck + LENGTHS.head);
  const [elbow, hand] = solveLimb(shoulder, pose.arm, LENGTHS.upperArm, LENGTHS.forearm, ELBOW_BEND);
  const [knee, ankle] = solveLimb(hip, pose.leg, LENGTHS.thigh, LENGTHS.shin, KNEE_BEND);
  // Up on the toes, the foot sits square to the shin; otherwise it lies flat, pointing forward.
  const shin = distance(knee, ankle) || 1;
  const footDir: Point = pose.toes ? [(ankle[1] - knee[1]) / shin, -(ankle[0] - knee[0]) / shin] : [1, 0];
  const toe = add(ankle, footDir, LENGTHS.foot);
  return { hip, shoulder, head, elbow, hand, knee, ankle, toe };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPoint = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function lerpLimb(a: Limb, b: Limb, t: number): Limb {
  if ('at' in a && 'at' in b) return { at: lerpPoint(a.at, b.at, t) };
  if ('angles' in a && 'angles' in b) return { angles: [lerp(a.angles[0], b.angles[0], t), lerp(a.angles[1], b.angles[1], t)] };
  return t < 0.5 ? a : b; // mixed kinds snap halfway; figures shouldn't mix them
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerpPoint(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head ?? 0, b.head ?? 0, t),
    toes: a.toes,
    arm: lerpLimb(a.arm, b.arm, t),
    leg: lerpLimb(a.leg, b.leg, t),
  };
}

const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export function loopLength(frames: Keyframe[]) {
  return frames.reduce((sum, f) => sum + (f.move ?? 0) + (f.hold ?? 0), 0);
}

/** The pose at a time in seconds; the loop moves from the last keyframe back to the first. */
export function poseAt(frames: Keyframe[], seconds: number): Pose {
  let t = seconds % loopLength(frames);
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const from = frames[(i - 1 + frames.length) % frames.length].pose;
    const move = frame.move ?? 0;
    if (t < move) return lerpPose(from, frame.pose, easeInOut(t / move));
    t -= move;
    if (t < (frame.hold ?? 0)) return frame.pose;
    t -= frame.hold ?? 0;
  }
  return frames[0].pose;
}
