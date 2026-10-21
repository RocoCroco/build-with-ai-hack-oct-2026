// The how-to figure: a side-view stick figure, posed by a few numbers.
// Angles are in degrees, absolute: 0 points down, 90 right, 180 up, -90 left.
// A standing figure faces right; lying down, its front turns with the torso.
//
// A limb is placed one of three ways:
// - `at`: where the hand/foot should be; the elbow or knee bends to reach it, so planted
//   hands and feet stay planted. `bend` flips which way the joint folds.
// - `angles`: the two bones' absolute angles.
// - `rel`: the two bones' angles relative to the torso, so arms ride along in a crunch.
// `reach` (angles/rel only) shortens the limb to fake a move toward or away from the
// camera, like the arms opening in a lateral raise.

export type Point = [x: number, y: number];
export type Limb =
  | { at: Point; bend?: 1 | -1 }
  | { angles: [upper: number, lower: number]; reach?: number }
  | { rel: [upper: number, lower: number]; reach?: number };

/** Flat on the floor (default), up on the toes, or a fixed absolute angle. */
export type Foot = 'flat' | 'toes' | number;

export interface Pose {
  hip: Point;
  torso: number; // hip → shoulder
  head?: number; // tilt from the torso line
  arm: Limb;
  leg: Limb;
  farArm?: Limb; // the far side copies the near side unless set
  farLeg?: Limb;
  foot?: Foot;
  farFoot?: Foot;
}

export interface Keyframe {
  pose: Pose;
  move?: number; // seconds to arrive here from the previous keyframe
  hold?: number; // seconds to stay here
  /** How the move into this keyframe speeds up: smooth both ends by default; 'in' and 'out'
   *  pair up to pass through a middle pose without stopping; 'linear' for pedalling and circles. */
  ease?: 'in' | 'out' | 'linear';
}

export const LENGTHS = { torso: 46, neck: 6, head: 10, upperArm: 27, forearm: 25, thigh: 34, shin: 33, foot: 10 };

/** Elbows bend back, knees bend forward, for a figure facing right. */
const ELBOW_BEND = 1;
const KNEE_BEND = -1;

export function dir(angle: number): Point {
  const r = (angle * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
}

/** The absolute angle pointing from a to b. */
export function angleTo([ax, ay]: Point, [bx, by]: Point) {
  return (Math.atan2(bx - ax, by - ay) * 180) / Math.PI;
}

export function add([x, y]: Point, [dx, dy]: Point, length = 1): Point {
  return [x + dx * length, y + dy * length];
}

export function distance([ax, ay]: Point, [bx, by]: Point) {
  return Math.hypot(bx - ax, by - ay);
}

/**
 * Two-bone reach: from the root, finds the middle joint so the end lands on the target.
 * Targets out of reach get as close as the straight limb allows.
 */
export function solveLimb(root: Point, limb: Limb, l1: number, l2: number, bend: number, torso = 0): [mid: Point, end: Point] {
  if ('angles' in limb || 'rel' in limb) {
    const [a1, a2] = 'angles' in limb ? limb.angles : [limb.rel[0] + torso, limb.rel[1] + torso];
    const reach = limb.reach ?? 1;
    const mid = add(root, dir(a1), l1 * reach);
    return [mid, add(mid, dir(a2), l2 * reach)];
  }
  const [tx, ty] = limb.at;
  const raw = distance(root, limb.at);
  const d = Math.min(Math.max(raw, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const u: Point = raw > 0 ? [(tx - root[0]) / raw, (ty - root[1]) / raw] : [0, 1];
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const b = bend * (limb.bend ?? 1);
  const mid = add(add(root, u, a), [-u[1] * b, u[0] * b], h);
  return [mid, add(root, u, d)];
}

export interface Side {
  elbow: Point;
  hand: Point;
  knee: Point;
  ankle: Point;
  toe: Point;
}

export interface Joints {
  hip: Point;
  shoulder: Point;
  head: Point;
  near: Side;
  far: Side;
}

function side(pose: Pose, shoulder: Point, arm: Limb, leg: Limb, foot: Foot = 'flat'): Side {
  const { hip, torso } = pose;
  const [elbow, hand] = solveLimb(shoulder, arm, LENGTHS.upperArm, LENGTHS.forearm, ELBOW_BEND, torso);
  const [knee, ankle] = solveLimb(hip, leg, LENGTHS.thigh, LENGTHS.shin, KNEE_BEND, torso);
  // Up on the toes, the foot sits square to the shin; flat, it points forward along the floor.
  const shin = distance(knee, ankle) || 1;
  const footDir: Point =
    foot === 'toes' ? [(ankle[1] - knee[1]) / shin, -(ankle[0] - knee[0]) / shin] : dir(foot === 'flat' ? 90 : foot);
  return { elbow, hand, knee, ankle, toe: add(ankle, footDir, LENGTHS.foot) };
}

export function joints(pose: Pose): Joints {
  const { hip } = pose;
  const shoulder = add(hip, dir(pose.torso), LENGTHS.torso);
  const head = add(shoulder, dir(pose.torso + (pose.head ?? 0)), LENGTHS.neck + LENGTHS.head);
  return {
    hip,
    shoulder,
    head,
    near: side(pose, shoulder, pose.arm, pose.leg, pose.foot),
    far: side(pose, shoulder, pose.farArm ?? pose.arm, pose.farLeg ?? pose.leg, pose.farFoot ?? pose.foot),
  };
}

/** Hip and torso for a body held in one straight line from the ankle (plank, push-up, lean). */
export function straightFrom(ankle: Point, angle: number): Pick<Pose, 'hip' | 'torso' | 'leg'> {
  return { hip: add(ankle, dir(angle), LENGTHS.thigh + LENGTHS.shin - 0.5), torso: angle, leg: { at: ankle } };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPoint = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function lerpLimb(a: Limb, b: Limb, t: number): Limb {
  if ('at' in a && 'at' in b) return { at: lerpPoint(a.at, b.at, t), bend: a.bend };
  const reach = lerp(('reach' in a && a.reach) || 1, ('reach' in b && b.reach) || 1, t);
  if ('angles' in a && 'angles' in b) return { angles: [lerp(a.angles[0], b.angles[0], t), lerp(a.angles[1], b.angles[1], t)], reach };
  if ('rel' in a && 'rel' in b) return { rel: [lerp(a.rel[0], b.rel[0], t), lerp(a.rel[1], b.rel[1], t)], reach };
  return t < 0.5 ? a : b; // mixed kinds snap halfway; figures shouldn't mix them
}

function lerpFoot(a: Foot = 'flat', b: Foot = 'flat', t: number): Foot {
  if (a === 'toes' || b === 'toes') return t < 0.5 ? a : b;
  const angle = (f: 'flat' | number) => (f === 'flat' ? 90 : f);
  return lerp(angle(a), angle(b), t);
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerpPoint(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head ?? 0, b.head ?? 0, t),
    arm: lerpLimb(a.arm, b.arm, t),
    leg: lerpLimb(a.leg, b.leg, t),
    farArm: lerpLimb(a.farArm ?? a.arm, b.farArm ?? b.arm, t),
    farLeg: lerpLimb(a.farLeg ?? a.leg, b.farLeg ?? b.leg, t),
    foot: lerpFoot(a.foot, b.foot, t),
    farFoot: lerpFoot(a.farFoot ?? a.foot, b.farFoot ?? b.foot, t),
  };
}

const EASE = {
  inOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  in: (t: number) => 1 - Math.cos((Math.PI * t) / 2),
  out: (t: number) => Math.sin((Math.PI * t) / 2),
  linear: (t: number) => t,
};

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
    if (t < move) return lerpPose(from, frame.pose, EASE[frame.ease ?? 'inOut'](t / move));
    t -= move;
    if (t < (frame.hold ?? 0)) return frame.pose;
    t -= frame.hold ?? 0;
  }
  return frames[0].pose;
}
