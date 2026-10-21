import type { Keyframe, Pose } from '../lib/figure';

/** Body parts drawn in the muscle group's color, to show what's working. */
export type Segment = 'torso' | 'upperArm' | 'forearm' | 'thigh' | 'shin';
export type Prop = 'dumbbell';

export interface FigureAnim {
  frames: Keyframe[];
  focus: Segment[];
  props?: Prop[];
}

// The floor is at y = 134; a standing figure's ankles sit just above it.
const ANKLE: [number, number] = [120, 131];
const STAND: Pose = { hip: [119, 65], torso: 180, arm: { angles: [0, 0] }, leg: { at: ANKLE } };

// A rep goes down, holds a moment, and comes back up.
const rep = (top: Pose, bottom: Pose, down = 1, up = 1): Keyframe[] => [
  { pose: top, move: up, hold: 0.5 },
  { pose: bottom, move: down, hold: 0.25 },
];

export const FIGURES: Record<string, FigureAnim> = {
  'push-up': {
    focus: ['torso', 'upperArm'],
    frames: rep(
      { hip: [116, 98.5], torso: 112, toes: true, arm: { at: [162, 132] }, leg: { at: [54, 123] } },
      { hip: [118.8, 118.8], torso: 94.4, toes: true, arm: { at: [162, 132] }, leg: { at: [54, 123] } },
    ),
  },
  'bodyweight-squat': {
    focus: ['thigh'],
    frames: rep(
      { ...STAND, torso: 176, arm: { angles: [90, 90] } },
      { hip: [98, 100], torso: 140, arm: { angles: [85, 85] }, leg: { at: ANKLE } },
      1.1,
      0.9,
    ),
  },
  'db-curl': {
    focus: ['upperArm'],
    props: ['dumbbell'],
    frames: rep(STAND, { ...STAND, arm: { angles: [8, 150] } }, 0.9, 1.1),
  },
};
