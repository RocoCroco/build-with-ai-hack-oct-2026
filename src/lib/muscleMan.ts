import type { Muscle } from '../data/exercises';

// The Start screen's stickman: a front-facing skeleton posed by a few angles, and the
// timelines that move it (idle, a dance when tapped, and a pose per trained group after
// a workout). Angles are absolute, as in the exercise figures: 0 points down, 90 right,
// 180 up. The arm and leg on the right of the screen are set; the left mirrors them unless set.

export type Point = [number, number];
type Pair = [upper: number, lower: number];

export interface ManPose {
  y: number; // hips moved down (+) or up (-)
  lean: number; // torso tilt, degrees
  head: number; // head tilt, degrees
  arm: Pair;
  leg: Pair;
  farArm?: Pair;
  farLeg?: Pair;
}

export const BONES = { torso: 70, neck: 20, shoulders: 24, hips: 10, upperArm: 40, forearm: 36, thigh: 50, shin: 42, foot: 8 };
const HIP: Point = [80, 112];

const dir = (a: number): Point => [Math.sin((a * Math.PI) / 180), Math.cos((a * Math.PI) / 180)];
const add = ([x, y]: Point, [dx, dy]: Point, k = 1): Point => [x + dx * k, y + dy * k];

export interface Limb {
  root: Point;
  mid: Point;
  end: Point;
}

export interface ManJoints {
  hip: Point;
  neck: Point;
  head: Point;
  across: Point; // unit vector toward the right of the body
  down: Point; // unit vector from neck toward hips
  arms: [right: Limb, left: Limb];
  legs: [right: Limb, left: Limb];
  feet: [Point, Point];
}

function limb(root: Point, [a1, a2]: Pair, l1: number, l2: number): Limb {
  const mid = add(root, dir(a1), l1);
  return { root, mid, end: add(mid, dir(a2), l2) };
}

const mirror = ([a, b]: Pair): Pair => [-a, -b];

export function manJoints(pose: ManPose): ManJoints {
  const hip = add(HIP, [0, 1], pose.y);
  const up = dir(180 + pose.lean);
  const across: Point = [-up[1], up[0]];
  const neck = add(hip, up, BONES.torso);
  const head = add(neck, dir(180 + pose.lean + pose.head), BONES.neck);
  const shoulder = (side: 1 | -1) => add(neck, across, side * BONES.shoulders);
  const hipJoint = (side: 1 | -1) => add(hip, across, side * BONES.hips);
  const legs: [Limb, Limb] = [
    limb(hipJoint(1), pose.leg, BONES.thigh, BONES.shin),
    limb(hipJoint(-1), pose.farLeg ?? mirror(pose.leg), BONES.thigh, BONES.shin),
  ];
  return {
    hip,
    neck,
    head,
    across,
    down: [-up[0], -up[1]],
    arms: [
      limb(shoulder(1), pose.arm, BONES.upperArm, BONES.forearm),
      limb(shoulder(-1), pose.farArm ?? mirror(pose.arm), BONES.upperArm, BONES.forearm),
    ],
    legs,
    feet: [add(legs[0].end, [BONES.foot, 1]), add(legs[1].end, [-BONES.foot, 1])],
  };
}

// ---- Poses ----

const STAND: ManPose = { y: 0, lean: 0, head: 0, arm: [12, 6], leg: [4, 0] };

// Breathing in and out: a small bob, a shift of weight, and the arms swinging a little.
export const IDLE: ManPose[] = [
  { ...STAND, lean: -2, head: -3, arm: [8, 2] },
  { ...STAND, y: 3, lean: 2, head: 4, arm: [22, 16] },
];

/** One pose per muscle group, held while that group lights up and grows. */
export const FLEX: Record<Muscle, ManPose> = {
  chest: { ...STAND, y: 2, lean: 3, arm: [28, -50] }, // most-muscular crunch
  back: { ...STAND, arm: [55, -60], leg: [8, 0] }, // lat spread, hands on hips
  shoulders: { ...STAND, arm: [150, 178] }, // overhead press
  biceps: { ...STAND, arm: [95, 175], leg: [7, 0] }, // front double biceps
  triceps: { ...STAND, arm: [28, 26], leg: [7, 0] }, // straight-arm flex
  abs: { ...STAND, head: -4, arm: [140, -95] }, // hands behind the head
  legs: { ...STAND, y: 19, arm: [45, 90], leg: [50, -12] }, // squat
};

const DANCE_STEPS: ManPose[] = [
  { ...STAND, y: 4, lean: -5, arm: [150, 170], farArm: [-30, -10] },
  { ...STAND, y: 0, lean: 5, arm: [30, 10], farArm: [-150, -170] },
  { ...STAND, y: 4, arm: [100, 160], farArm: [-100, -160], leg: [22, -6], farLeg: [-4, 0] },
  { ...STAND, y: 0, arm: [60, -30], farArm: [-60, 30], leg: [4, 0], farLeg: [-22, 6] },
];

// ---- Timelines ----

export interface Beat {
  pose: ManPose;
  move: number; // seconds to get here
  hold?: number; // seconds to stay
  feature?: Muscle; // the group lit up during this beat
}

export const IDLE_BEATS: Beat[] = IDLE.map((pose) => ({ pose, move: 1.4 }));
export const DANCE_BEATS: Beat[] = [...DANCE_STEPS, ...DANCE_STEPS].map((pose) => ({ pose, move: 0.28, hold: 0.06 }));

export function celebrateBeats(groups: readonly Muscle[]): Beat[] {
  return groups.map((m) => ({ pose: FLEX[m], move: 0.5, hold: 1.4, feature: m }));
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPair = (a: Pair, b: Pair, t: number): Pair => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export function lerpManPose(a: ManPose, b: ManPose, t: number): ManPose {
  return {
    y: lerp(a.y, b.y, t),
    lean: lerp(a.lean, b.lean, t),
    head: lerp(a.head, b.head, t),
    arm: lerpPair(a.arm, b.arm, t),
    leg: lerpPair(a.leg, b.leg, t),
    farArm: lerpPair(a.farArm ?? mirror(a.arm), b.farArm ?? mirror(b.arm), t),
    farLeg: lerpPair(a.farLeg ?? mirror(a.leg), b.farLeg ?? mirror(b.leg), t),
  };
}

const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export const beatsLength = (beats: readonly Beat[]) => beats.reduce((s, b) => s + b.move + (b.hold ?? 0), 0);

/**
 * Where a timeline is after `seconds`, starting from `from`. Returns null once a
 * one-shot timeline has finished; a looping one wraps around.
 */
export function playBeats(beats: readonly Beat[], from: ManPose, seconds: number, loop: boolean): { pose: ManPose; feature?: Muscle } | null {
  const length = beatsLength(beats);
  let t = loop ? seconds % length : seconds;
  if (!loop && t >= length) return null;
  let prev = loop ? beats[beats.length - 1].pose : from;
  for (const beat of beats) {
    if (t < beat.move) return { pose: lerpManPose(prev, beat.pose, ease(t / beat.move)), feature: beat.feature };
    t -= beat.move;
    if (t < (beat.hold ?? 0)) return { pose: beat.pose, feature: beat.feature };
    t -= beat.hold ?? 0;
    prev = beat.pose;
  }
  return { pose: prev };
}
