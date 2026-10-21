// The how-to figure: a stick figure, posed by a few numbers.
// Angles are in degrees, absolute: 0 points down, 90 right, 180 up, -90 left.
//
// Two views:
// - side (default): faces right; lying down, its front turns with the torso. The far arm
//   and leg copy the near ones unless set, and are drawn dimmed behind.
// - front: facing the camera (or its back, for pull-ups); shoulders and hips get width.
//   The "near" limbs are on the right of the screen, and the left side mirrors them
//   unless set.
//
// A limb is placed one of three ways:
// - `at`: where the hand/foot should be; the elbow or knee bends to reach it, so planted
//   hands and feet stay planted. `bend` flips which way the joint folds.
// - `angles`: the two bones' absolute angles.
// - `rel`: the two bones' angles relative to the torso, so arms ride along in a crunch.
// `reach` (angles/rel only) shortens the bones to fake a move toward or away from the
// camera, like the arms opening in a lateral raise; a pair sets each bone separately.

export type Point = [x: number, y: number];
type Reach = number | [upper: number, lower: number];
export type Limb =
  | { at: Point; bend?: 1 | -1 }
  | { angles: [upper: number, lower: number]; reach?: Reach }
  | { rel: [upper: number, lower: number]; reach?: Reach };

/** Flat on the floor (default), up on the toes, or a fixed absolute angle. */
export type Foot = 'flat' | 'toes' | number;

export interface Pose {
  view?: 'side' | 'front';
  hip: Point; // front view: the middle of the hips
  torso: number; // hip → shoulder (front view: → neck)
  torsoReach?: number; // front view: shortens the torso when it leans toward/away from the camera
  head?: number; // tilt from the torso line
  arm: Limb;
  leg: Limb;
  farArm?: Limb;
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
/** Front view: half the shoulder and hip widths, and a shorter foot (it points at the camera). */
const FRONT = { shoulders: 14, hips: 8, foot: 6 };

/** Elbows bend back, knees bend forward, for a side-view figure facing right. */
const ELBOW_BEND = 1;
const KNEE_BEND = -1;

export function dir(angle: number): Point {
  const r = (angle * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
}

export function add([x, y]: Point, [dx, dy]: Point, length = 1): Point {
  return [x + dx * length, y + dy * length];
}

export function distance([ax, ay]: Point, [bx, by]: Point) {
  return Math.hypot(bx - ax, by - ay);
}

const pair = (reach: Reach = 1): [number, number] => (typeof reach === 'number' ? [reach, reach] : reach);

/**
 * Two-bone reach: from the root, finds the middle joint so the end lands on the target.
 * Targets out of reach get as close as the straight limb allows.
 */
export function solveLimb(root: Point, limb: Limb, l1: number, l2: number, bend: number, torso = 0): [mid: Point, end: Point] {
  if ('angles' in limb || 'rel' in limb) {
    const [a1, a2] = 'angles' in limb ? limb.angles : [limb.rel[0] + torso, limb.rel[1] + torso];
    const [r1, r2] = pair(limb.reach);
    const mid = add(root, dir(a1), l1 * r1);
    return [mid, add(mid, dir(a2), l2 * r2)];
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

/** The same limb on the other side of a front-view body, mirrored across x = cx. */
function mirrorLimb(limb: Limb, cx: number): Limb {
  if ('at' in limb) return { at: [2 * cx - limb.at[0], limb.at[1]], bend: limb.bend === -1 ? 1 : -1 };
  if ('angles' in limb) return { angles: [-limb.angles[0], -limb.angles[1]], reach: limb.reach };
  return { rel: [-limb.rel[0], -limb.rel[1]], reach: limb.reach };
}

function mirrorFoot(foot: Foot = 'flat'): Foot {
  if (foot === 'toes') return foot;
  return -(foot === 'flat' ? 90 : foot);
}

/** Fills in the far limbs: a copy in side view, a mirror image in front view. */
function withFarSide(pose: Pose): Pose {
  const front = pose.view === 'front';
  const cx = pose.hip[0];
  return {
    ...pose,
    farArm: pose.farArm ?? (front ? mirrorLimb(pose.arm, cx) : pose.arm),
    farLeg: pose.farLeg ?? (front ? mirrorLimb(pose.leg, cx) : pose.leg),
    farFoot: pose.farFoot ?? (front ? mirrorFoot(pose.foot) : pose.foot),
  };
}

export interface Side {
  shoulder: Point; // where the arm starts
  hip: Point; // where the leg starts
  elbow: Point;
  hand: Point;
  knee: Point;
  ankle: Point;
  toe: Point;
}

export interface Joints {
  front: boolean;
  hip: Point;
  shoulder: Point; // front view: the neck
  head: Point;
  near: Side;
  far: Side;
}

function side(pose: Pose, shoulder: Point, hip: Point, arm: Limb, leg: Limb, foot: Foot = 'flat'): Side {
  const { torso } = pose;
  const [elbow, hand] = solveLimb(shoulder, arm, LENGTHS.upperArm, LENGTHS.forearm, ELBOW_BEND, torso);
  const [knee, ankle] = solveLimb(hip, leg, LENGTHS.thigh, LENGTHS.shin, KNEE_BEND, torso);
  // Up on the toes, the foot sits square to the shin; flat, it points forward along the floor.
  const shin = distance(knee, ankle) || 1;
  const footDir: Point =
    foot === 'toes' ? [(ankle[1] - knee[1]) / shin, -(ankle[0] - knee[0]) / shin] : dir(foot === 'flat' ? 90 : foot);
  const toe = add(ankle, footDir, pose.view === 'front' ? FRONT.foot : LENGTHS.foot);
  return { shoulder, hip, elbow, hand, knee, ankle, toe };
}

export function joints(input: Pose): Joints {
  const pose = withFarSide(input);
  const { hip } = pose;
  const up = dir(pose.torso);
  const shoulder = add(hip, up, LENGTHS.torso * (pose.torsoReach ?? 1));
  const head = add(shoulder, dir(pose.torso + (pose.head ?? 0)), LENGTHS.neck + LENGTHS.head);
  if (pose.view !== 'front') {
    return {
      front: false,
      hip,
      shoulder,
      head,
      near: side(pose, shoulder, hip, pose.arm, pose.leg, pose.foot),
      far: side(pose, shoulder, hip, pose.farArm!, pose.farLeg!, pose.farFoot),
    };
  }
  // Across the body, always toward the right of the screen, so "near" limbs stay on the
  // right whether the torso points up (standing) or down (a push-up seen head-on).
  const across: Point = up[1] > 0 ? [up[1], -up[0]] : [-up[1], up[0]];
  return {
    front: true,
    hip,
    shoulder,
    head,
    near: side(pose, add(shoulder, across, FRONT.shoulders), add(hip, across, FRONT.hips), pose.arm, pose.leg, pose.foot),
    far: side(pose, add(shoulder, across, -FRONT.shoulders), add(hip, across, -FRONT.hips), pose.farArm!, pose.farLeg!, pose.farFoot),
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
  const reach = (l: Limb) => pair('reach' in l ? l.reach : 1);
  const r = lerpPoint(reach(a), reach(b), t);
  if ('angles' in a && 'angles' in b) return { angles: lerpPoint(a.angles, b.angles, t), reach: r };
  if ('rel' in a && 'rel' in b) return { rel: lerpPoint(a.rel, b.rel, t), reach: r };
  return t < 0.5 ? a : b; // mixed kinds snap halfway; figures shouldn't mix them
}

function lerpFoot(a: Foot = 'flat', b: Foot = 'flat', t: number): Foot {
  if (a === 'toes' || b === 'toes') return t < 0.5 ? a : b;
  const angle = (f: 'flat' | number) => (f === 'flat' ? 90 : f);
  return lerp(angle(a), angle(b), t);
}

export function lerpPose(from: Pose, to: Pose, t: number): Pose {
  const [a, b] = [withFarSide(from), withFarSide(to)];
  return {
    view: a.view,
    hip: lerpPoint(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    torsoReach: lerp(a.torsoReach ?? 1, b.torsoReach ?? 1, t),
    head: lerp(a.head ?? 0, b.head ?? 0, t),
    arm: lerpLimb(a.arm, b.arm, t),
    leg: lerpLimb(a.leg, b.leg, t),
    farArm: lerpLimb(a.farArm!, b.farArm!, t),
    farLeg: lerpLimb(a.farLeg!, b.farLeg!, t),
    foot: lerpFoot(a.foot, b.foot, t),
    farFoot: lerpFoot(a.farFoot, b.farFoot, t),
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
