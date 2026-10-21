import { straightFrom, type Keyframe, type Limb, type Point, type Pose } from '../lib/figure';

/** Body parts drawn in the muscle group's color, to show what's working. */
export type Segment = 'torso' | 'upperArm' | 'forearm' | 'thigh' | 'shin';
export type JointName = 'hand' | 'elbow' | 'knee' | 'ankle' | 'toe' | 'shoulder' | 'hip';

/** Equipment that moves with the body. Hand-held props show on both sides unless `near`. */
export type Prop =
  | { kind: 'dumbbell' | 'barbell' | 'handle' | 'wheel' | 'bag' | 'pad'; at: JointName; near?: boolean; nudge?: Point }
  | { kind: 'dumbbell-across'; at: 'hand'; near?: boolean } // seen along its bar, square to the forearm
  | { kind: 'bar'; at: 'hand' } // a straight bar between both hands (front view)
  | { kind: 'cable' | 'lever'; from: Point; to: JointName; near?: boolean }
  | { kind: 'plate'; at: JointName; angle: number; length: number };

/** Fixed equipment: benches, bars, walls, machine frames. */
export type Shape = { line: [number, number, number, number]; w?: number } | { rect: [number, number, number, number] } | { circle: [number, number, number] };

export interface FigureAnim {
  frames: Keyframe[];
  focus?: Segment[]; // defaults by muscle group
  props?: Prop[];
  scene?: Shape[];
}

// ---- Building blocks ----
// The floor is at y = 134 and the view runs from y = -46 to 142, x = 20 to 220.

const ANKLE: Point = [120, 131];
const STAND: Pose = { hip: [119, 65], torso: 180, arm: { angles: [0, 0] }, leg: { at: ANKLE } };
const SEATED: Pose = { hip: [108, 100], torso: 180, arm: { angles: [0, 0] }, leg: { at: [150, 131] } };
/** Face up on a flat bench, head on the left, feet on the floor. */
const ON_BENCH: Pose = { hip: [140, 100], torso: -90, arm: { angles: [180, 180] }, leg: { at: [178, 131] } };
const INCLINE: Pose = { hip: [132, 100], torso: -135, arm: { angles: [0, 0] }, leg: { at: [172, 131] } };
/** Face up on the floor, head on the left, knees bent. */
const ON_BACK: Pose = { hip: [130, 130], torso: -90, arm: { angles: [90, 90] }, leg: { at: [176, 131] } };

// Facing the camera (or showing the back). Limbs are set for the right of the screen.
const FRONT_STAND: Pose = { view: 'front', hip: [120, 65], torso: 180, arm: { angles: [8, 5] }, leg: { at: [130, 131] } };
const FRONT_SEATED: Pose = { ...FRONT_STAND, hip: [120, 100], leg: { at: [138, 131] } };
const FRONT_SEAT: Shape[] = [{ rect: [104, 44, 32, 60] }, { rect: [94, 104, 52, 7] }, { line: [100, 111, 100, 134], w: 5 }, { line: [140, 111, 140, 134], w: 5 }];

// Arms that ride along with the torso
const TEMPLES: Limb = { rel: [-60, 91] };
const CROSSED: Limb = { rel: [-150, 27] };
const ON_HIPS: Limb = { rel: [-200, -150] };
const BAR_ON_BACK: Limb = { rel: [-210, -30] };

const PUSH_HANDS: Point = [162, 132];
const PUSH_FEET: Point = [54, 123];
const pushTop = (hand = PUSH_HANDS): Pose => ({ ...straightFrom(PUSH_FEET, 111.8), arm: { at: hand }, foot: 'toes' });
const pushBottom = (hand = PUSH_HANDS): Pose => ({ ...straightFrom(PUSH_FEET, 94), arm: { at: hand }, foot: 'toes' });

const bench = (x1: number, x2: number, top = 104): Shape[] => [
  { rect: [x1, top, x2 - x1, 7] },
  { line: [x1 + 8, top + 7, x1 + 8, 134], w: 5 },
  { line: [x2 - 8, top + 7, x2 - 8, 134], w: 5 },
];
const backrest = (x1: number, y1: number, x2: number, y2: number): Shape => ({ line: [x1, y1, x2, y2], w: 7 });
const tower = (x: number): Shape => ({ line: [x, -44, x, 134], w: 6 });
const HIGH_BAR: Shape[] = [{ line: [70, -34, 170, -34], w: 5 }, { line: [74, -34, 74, 134], w: 4 }, { line: [166, -34, 166, 134], w: 4 }];
const DIP_BARS: Shape[] = [{ line: [100, 40, 150, 40], w: 5 }, { line: [104, 40, 104, 134], w: 4 }, { line: [146, 40, 146, 134], w: 4 }];

const DUMBBELLS: Prop[] = [{ kind: 'dumbbell', at: 'hand' }];
const BARBELL: Prop[] = [{ kind: 'barbell', at: 'hand' }];
const cable = (from: Point): Prop[] => [{ kind: 'cable', from, to: 'hand' }, { kind: 'handle', at: 'hand' }];

/** One rep: from the start, move to the end, pause, and come back. */
const rep = (start: Pose, end: Pose, there = 1, back = 1): Keyframe[] => [
  { pose: start, move: back, hold: 0.5 },
  { pose: end, move: there, hold: 0.3 },
];

/** A rep that passes through a middle pose, so a carried bar keeps a straight path. */
const repVia = (start: Pose, mid: Pose, end: Pose, half: number): Keyframe[] => [
  { pose: start, move: half, hold: 0.5, ease: 'out' },
  { pose: mid, move: half, ease: 'in' },
  { pose: end, move: half, hold: 0.3, ease: 'out' },
  { pose: mid, move: half, ease: 'in' },
];

/** A held position that only breathes. */
const hold = (a: Pose, b: Pose): Keyframe[] => [
  { pose: a, move: 1.4, hold: 0.4 },
  { pose: b, move: 1.4, hold: 0.4 },
];

/** Steady repeating motion through several poses (pedalling, circles, running). */
const cycle = (poses: Pose[], step: number): Keyframe[] => poses.map((pose) => ({ pose, move: step, ease: 'linear' }));

// ---- Exercises ----

const squatTop: Pose = { ...STAND, torso: 176, arm: { angles: [90, 90] } };
const squatBottom: Pose = { hip: [98, 100], torso: 140, arm: { angles: [85, 85] }, leg: { at: ANKLE } };

const curlDown: Pose = STAND;
const curlUp: Pose = { ...STAND, arm: { angles: [8, 150] } };

const dipTop = (torso: number, hip: Point): Pose => ({ hip, torso, arm: { at: [125, 40] }, leg: { angles: [15, -75] }, foot: 'toes' });

const pullDown: Pose = { hip: [120, 63], torso: 180, arm: { at: [124, -34] }, leg: { angles: [12, -25] }, foot: 'toes' };
const pullUp: Pose = { ...pullDown, hip: [120, 32] };

const benchTop: Pose = { ...ON_BENCH, arm: { at: [96, 48] } };
const benchBottom: Pose = { ...ON_BENCH, arm: { at: [100, 86] } };

const plankHip = straightFrom([44, 124], 100.6);
const plank: Pose = { ...plankHip, arm: { angles: [0, 90] }, foot: 'toes' };

const lungeStand: Pose = { hip: [124, 65], torso: 180, arm: ON_HIPS, leg: { at: [126, 131] }, farLeg: { at: [122, 131] } };
const lungeStep: Pose = { ...lungeStand, hip: [118, 72], farLeg: { at: [98, 118] } };
const lungeBottom: Pose = { ...lungeStand, hip: [112, 98], farLeg: { at: [72, 123] }, farFoot: 'toes' };

const hipThrust = (hip: Point, torso: number, hand: Point): Pose => ({ hip, torso, arm: { at: hand, bend: -1 }, leg: { at: [150, 131] } });

export const FIGURES: Record<string, FigureAnim> = {
  // Chest
  'bench-press': { frames: rep(benchTop, benchBottom), props: BARBELL, scene: bench(62, 158) },
  'incline-db-press': {
    frames: rep({ ...INCLINE, arm: { at: [108, 17] } }, { ...INCLINE, arm: { at: [110, 56] } }),
    props: DUMBBELLS,
    scene: [...bench(112, 156), backrest(125, 107, 87, 69)],
  },
  'db-flye': {
    frames: rep(ON_BENCH, { ...ON_BENCH, arm: { angles: [180, 170], reach: 0.28 } }, 1.2, 1.1),
    props: DUMBBELLS,
    scene: bench(62, 158),
  },
  'cable-crossover': {
    frames: rep(
      { ...FRONT_STAND, arm: { angles: [115, 110] }, leg: { at: [134, 131] } },
      // The hands meet in front of the body without crossing over.
      { ...FRONT_STAND, arm: { angles: [-20, 0] }, leg: { at: [134, 131] } },
    ),
    props: cable([196, -36]),
    scene: [tower(40), tower(200)],
  },
  'chest-press-machine': {
    frames: rep({ ...SEATED, arm: { at: [126, 58] } }, { ...SEATED, arm: { at: [158, 56] } }),
    props: [{ kind: 'lever', from: [100, -36], to: 'hand' }, { kind: 'handle', at: 'hand' }],
    scene: [...bench(86, 130), backrest(101, 104, 101, 40)],
  },
  'pec-deck': {
    frames: rep({ ...SEATED, arm: { angles: [90, 100], reach: 0.3 } }, { ...SEATED, arm: { angles: [90, 95], reach: 0.95 } }),
    props: [{ kind: 'pad', at: 'hand' }],
    scene: [...bench(86, 130), backrest(101, 104, 101, 40)],
  },
  'decline-bench': {
    frames: rep(
      { hip: [150, 90], torso: -80, arm: { at: [108, 47] }, leg: { at: [176, 104] } },
      { hip: [150, 90], torso: -80, arm: { at: [112, 86] }, leg: { at: [176, 104] } },
    ),
    props: BARBELL,
    scene: [{ line: [100, 106, 158, 96], w: 8 }, { line: [110, 106, 110, 134], w: 5 }, { line: [150, 98, 150, 134], w: 5 }, { circle: [180, 97, 6] }],
  },
  'dips-chest': { frames: rep(dipTop(160, [106.3, 32.2]), dipTop(148, [105.6, 61])), scene: DIP_BARS },
  'push-up': { frames: rep(pushTop(), pushBottom()) },
  'wide-push-up': { frames: rep(pushTop([166, 132]), pushBottom([166, 132])) },
  'decline-push-up': {
    frames: rep(
      { ...straightFrom([52, 95], 97.4), arm: { at: [164, 132] }, foot: 'toes' },
      { ...straightFrom([52, 95], 80.3), arm: { at: [164, 132] }, foot: 'toes' },
    ),
    scene: [{ rect: [30, 100, 44, 34] }],
  },

  // Back
  'deadlift': {
    frames: repVia(
      { hip: [94, 95], torso: 125, arm: { at: [127, 120] }, leg: { at: ANKLE } },
      { hip: [104, 82], torso: 150, arm: { at: [124, 93] }, leg: { at: ANKLE } },
      { hip: [118, 66], torso: 180, arm: { at: [121, 71] }, leg: { at: ANKLE } },
      0.55,
    ),
    props: BARBELL,
  },
  'lat-pulldown': {
    // Seen from behind, so the back is what you watch.
    frames: rep({ ...FRONT_SEATED, arm: { at: [158, 8] } }, { ...FRONT_SEATED, arm: { at: [154, 44] } }),
    props: [{ kind: 'cable', from: [120, -42], to: 'hand' }, { kind: 'bar', at: 'hand' }],
    scene: [...FRONT_SEAT.slice(1), { circle: [120, -42, 4] }, { line: [120, -46, 120, -42], w: 4 }],
  },
  'barbell-row': {
    frames: rep(
      { hip: [100, 74], torso: 115, arm: { at: [143, 106] }, leg: { at: ANKLE } },
      { hip: [100, 74], torso: 115, arm: { at: [124, 82] }, leg: { at: ANKLE } },
    ),
    props: BARBELL,
  },
  'seated-cable-row': {
    frames: rep(
      { hip: [90, 110], torso: 165, arm: { at: [148, 74] }, leg: { at: [150, 112] }, foot: 'toes' },
      { hip: [90, 110], torso: 190, arm: { at: [100, 80] }, leg: { at: [150, 112] }, foot: 'toes' },
    ),
    props: cable([178, 112]),
    scene: [{ rect: [60, 114, 60, 6] }, { line: [158, 98, 158, 126], w: 5 }, { line: [178, 60, 178, 134], w: 6 }],
  },
  'one-arm-db-row': {
    frames: rep(
      { hip: [88, 78], torso: 95, arm: { at: [136, 124] }, farArm: { at: [150, 104] }, leg: { at: [106, 131] }, farLeg: { angles: [40, -90] }, farFoot: -90 },
      { hip: [88, 78], torso: 95, arm: { at: [118, 94] }, farArm: { at: [150, 104] }, leg: { at: [106, 131] }, farLeg: { angles: [40, -90] }, farFoot: -90 },
    ),
    props: [{ kind: 'dumbbell', at: 'hand', near: true }],
    scene: bench(56, 166, 108),
  },
  't-bar-row': {
    frames: rep(
      { hip: [100, 74], torso: 115, arm: { at: [143, 106] }, leg: { at: ANKLE } },
      { hip: [100, 74], torso: 115, arm: { at: [126, 84] }, leg: { at: ANKLE } },
    ),
    props: [{ kind: 'lever', from: [30, 130], to: 'hand', near: true }, { kind: 'barbell', at: 'hand' }],
  },
  'straight-arm-pulldown': {
    frames: rep(
      { hip: [115, 66], torso: 165, arm: { angles: [125, 125] }, leg: { at: ANKLE } },
      { hip: [115, 66], torso: 165, arm: { angles: [12, 12] }, leg: { at: ANKLE } },
    ),
    props: cable([182, -40]),
    scene: [tower(184)],
  },
  // Seen from behind: wide grip, elbows driving down.
  'pull-up': {
    frames: rep(
      { ...FRONT_STAND, hip: [120, 58], arm: { at: [156, -34] }, leg: { at: [126, 124] } },
      { ...FRONT_STAND, hip: [120, 28], arm: { at: [156, -34] }, leg: { at: [126, 94] } },
      1.1,
    ),
    scene: [{ line: [60, -34, 180, -34], w: 5 }, { line: [64, -34, 64, 134], w: 4 }, { line: [176, -34, 176, 134], w: 4 }],
  },
  'superman': {
    frames: hold(
      { hip: [100, 130], torso: 90, arm: { angles: [90, 90] }, leg: { angles: [-90, -90] }, foot: -90 },
      { hip: [100, 130], torso: 100, arm: { angles: [103, 103] }, leg: { angles: [-100, -100] }, foot: -100 },
    ),
  },
  'table-row': {
    frames: rep(
      { ...straightFrom([200, 128], -95.2), arm: { at: [88, 66], bend: -1 }, foot: 180 },
      { ...straightFrom([200, 128], -110), arm: { at: [88, 66], bend: -1 }, foot: 180 },
    ),
    scene: [{ line: [40, 64, 150, 64], w: 6 }, { line: [46, 64, 46, 134], w: 4 }, { line: [144, 64, 144, 134], w: 4 }],
  },
  'reverse-snow-angel': {
    frames: (() => {
      const lying = (arm: Limb): Pose => ({ hip: [100, 130], torso: 95, arm, leg: { angles: [-90, -90] }, foot: -90 });
      return [
        { pose: lying({ angles: [-102, -102] }), move: 0.7, hold: 0.3 },
        { pose: lying({ angles: [-180, -180], reach: 0.25 }), move: 0.7 },
        { pose: lying({ angles: [-258, -258] }), move: 0.7, hold: 0.3 },
        { pose: lying({ angles: [-180, -180], reach: 0.25 }), move: 0.7 },
      ];
    })(),
  },

  // Shoulders
  'ohp': { frames: rep({ ...STAND, arm: { at: [130, 20] } }, { ...STAND, arm: { at: [121, -32] } }), props: BARBELL },
  'db-shoulder-press': {
    frames: rep({ ...FRONT_SEATED, arm: { angles: [90, 180] } }, { ...FRONT_SEATED, arm: { angles: [160, 178] } }),
    props: [{ kind: 'dumbbell-across', at: 'hand' }],
    scene: FRONT_SEAT,
  },
  'lateral-raise': {
    frames: rep({ ...FRONT_STAND, arm: { angles: [8, 5] } }, { ...FRONT_STAND, arm: { angles: [88, 86] } }),
    props: DUMBBELLS,
  },
  'cable-lateral': {
    // The cable comes from the low pulley on the other side, across the body.
    frames: rep({ ...FRONT_STAND, arm: { angles: [8, 5] } }, { ...FRONT_STAND, arm: { angles: [88, 86] } }),
    props: cable([104, 128]),
  },
  'rear-delt-flye': {
    frames: rep(
      { hip: [100, 72], torso: 110, arm: { angles: [0, 0] }, leg: { at: ANKLE } },
      { hip: [100, 72], torso: 110, arm: { angles: [-20, -15], reach: 0.3 }, leg: { at: ANKLE } },
    ),
    props: DUMBBELLS,
  },
  'face-pull': {
    frames: rep(
      { hip: [118, 65], torso: 185, arm: { at: [164, 10], bend: -1 }, leg: { at: ANKLE } },
      { hip: [118, 65], torso: 185, arm: { at: [122, 4], bend: -1 }, leg: { at: ANKLE } },
    ),
    props: cable([190, 6]),
    scene: [tower(192)],
  },
  'arnold-press': {
    // Starts like the top of a curl, elbows in front; they open out to the sides, then press.
    frames: [
      { pose: { ...FRONT_SEATED, arm: { angles: [-10, 190], reach: [0.5, 1] } }, move: 0.6, hold: 0.4 },
      { pose: { ...FRONT_SEATED, arm: { angles: [90, 180] } }, move: 0.6 },
      { pose: { ...FRONT_SEATED, arm: { angles: [160, 178] } }, move: 0.6, hold: 0.3 },
      { pose: { ...FRONT_SEATED, arm: { angles: [90, 180] } }, move: 0.6 },
    ],
    props: [{ kind: 'dumbbell-across', at: 'hand' }],
    scene: FRONT_SEAT,
  },
  'pike-push-up': {
    frames: rep(
      { hip: [109, 64], torso: 58, arm: { at: [150, 132] }, leg: { at: [82, 124] }, foot: 'toes' },
      { hip: [109, 64], torso: 30, arm: { at: [150, 132] }, leg: { at: [82, 124] }, foot: 'toes' },
    ),
  },
  'wall-handstand': {
    frames: hold(
      { hip: [170, 34], torso: 0, arm: { at: [170, 132] }, leg: { at: [190, -28] } },
      { hip: [169, 35], torso: 1, arm: { at: [170, 132] }, leg: { at: [190, -28] } },
    ),
    scene: [{ line: [202, -46, 202, 134], w: 6 }],
  },
  'plank-shoulder-tap': {
    frames: [
      { pose: pushTop(), move: 0.4, hold: 0.2 },
      { pose: { ...pushTop(), arm: { at: [152, 86] }, farArm: { at: PUSH_HANDS } }, move: 0.4, hold: 0.2 },
      { pose: pushTop(), move: 0.4, hold: 0.2 },
      { pose: { ...pushTop(), farArm: { at: [152, 86] } }, move: 0.4, hold: 0.2 },
    ],
  },

  // Biceps
  'barbell-curl': { frames: rep(curlDown, curlUp, 0.9, 1.1), props: BARBELL },
  'db-curl': { frames: rep(curlDown, curlUp, 0.9, 1.1), props: DUMBBELLS },
  'hammer-curl': {
    frames: rep(curlDown, { ...STAND, arm: { angles: [5, 145] } }, 0.9, 1.1),
    props: [{ kind: 'dumbbell-across', at: 'hand' }],
  },
  'preacher-curl': {
    frames: rep(
      { hip: [104, 96], torso: 172, arm: { angles: [45, 40] }, leg: { at: [140, 131] } },
      { hip: [104, 96], torso: 172, arm: { angles: [45, 165] }, leg: { at: [140, 131] } },
      0.9,
      1.1,
    ),
    props: BARBELL,
    scene: [{ line: [110, 58, 128, 76], w: 8 }, { line: [118, 76, 118, 134], w: 4 }, { rect: [84, 100, 36, 6] }],
  },
  'cable-curl': { frames: rep(curlDown, curlUp, 0.9, 1.1), props: cable([146, 130]) },
  'incline-db-curl': {
    frames: rep(INCLINE, { ...INCLINE, arm: { angles: [12, 150] } }, 0.9, 1.1),
    props: DUMBBELLS,
    scene: [...bench(112, 156), backrest(125, 107, 87, 69)],
  },
  'chin-up': { frames: rep(pullDown, pullUp, 1.1), scene: HIGH_BAR },
  'concentration-curl': {
    frames: rep(
      { hip: [100, 100], torso: 150, arm: { angles: [15, 10] }, leg: { at: [142, 131] } },
      { hip: [100, 100], torso: 150, arm: { angles: [15, 160] }, leg: { at: [142, 131] } },
      0.9,
      1.1,
    ),
    props: [{ kind: 'dumbbell', at: 'hand', near: true }],
    scene: bench(70, 120),
  },
  'towel-curl': {
    frames: rep(
      { ...straightFrom([150, 131], -168), arm: { at: [166, 50] } },
      { ...straightFrom([150, 131], -180), arm: { at: [166, 50] } },
    ),
    props: [{ kind: 'cable', from: [172, 52], to: 'hand' }],
    scene: [{ line: [176, -46, 176, 134], w: 6 }, { circle: [172, 52, 3] }],
  },
  'backpack-curl': { frames: rep(curlDown, curlUp, 0.9, 1.1), props: [{ kind: 'bag', at: 'hand', near: true }] },

  // Triceps
  'rope-pushdown': {
    frames: rep(
      { hip: [118, 65], torso: 172, arm: { angles: [8, 150] }, leg: { at: ANKLE } },
      { hip: [118, 65], torso: 172, arm: { angles: [6, 8] }, leg: { at: ANKLE } },
    ),
    props: cable([150, -42]),
    scene: [tower(152)],
  },
  'skull-crusher': {
    frames: rep({ ...ON_BENCH, arm: { angles: [188, 188] } }, { ...ON_BENCH, arm: { angles: [188, 300] } }),
    props: BARBELL,
    scene: bench(62, 158),
  },
  'overhead-db-ext': {
    frames: rep({ ...SEATED, arm: { angles: [178, 178] } }, { ...SEATED, arm: { angles: [178, 320] } }),
    props: [{ kind: 'dumbbell', at: 'hand', near: true }],
    scene: [...bench(86, 130), backrest(101, 104, 101, 40)],
  },
  'close-grip-bench': { frames: rep(benchTop, { ...ON_BENCH, arm: { at: [102, 88] } }), props: BARBELL, scene: bench(62, 158) },
  'cable-kickback': {
    frames: rep(
      { hip: [100, 70], torso: 120, arm: { angles: [-60, 0] }, leg: { at: ANKLE } },
      { hip: [100, 70], torso: 120, arm: { angles: [-60, -62] }, leg: { at: ANKLE } },
    ),
    props: cable([172, 126]),
    scene: [{ line: [176, 100, 176, 134], w: 6 }],
  },
  'bench-dip': {
    frames: rep(
      { hip: [90, 92], torso: 180, arm: { at: [87, 97] }, leg: { at: [146, 126] }, foot: 150 },
      { hip: [92, 118], torso: 180, arm: { at: [87, 97] }, leg: { at: [146, 126] }, foot: 150 },
    ),
    scene: bench(30, 90, 100),
  },
  'diamond-push-up': { frames: rep(pushTop([158, 132]), pushBottom([158, 132])) },
  'triceps-dip': { frames: rep(dipTop(176, [119.2, 34.9]), dipTop(170, [118, 67.3])), scene: DIP_BARS },

  // Abs
  'cable-crunch': {
    frames: rep(
      { hip: [110, 96], torso: 180, arm: { at: [118, 36] }, leg: { at: [77, 124] }, foot: 'toes' },
      { hip: [110, 96], torso: 110, arm: { at: [170, 82] }, leg: { at: [77, 124] }, foot: 'toes' },
    ),
    props: cable([176, -42]),
    scene: [tower(178)],
  },
  'hanging-leg-raise': {
    frames: rep(
      { hip: [120, 64], torso: 180, arm: { at: [122, -34] }, leg: { angles: [0, 0] }, foot: 'toes' },
      { hip: [120, 64], torso: 180, arm: { at: [122, -34] }, leg: { angles: [88, 88] }, foot: 'toes' },
    ),
    scene: HIGH_BAR,
  },
  'ab-wheel': {
    frames: rep(
      { hip: [80, 95], torso: 125, arm: { at: [118, 120] }, leg: { at: [47, 124] }, foot: 'toes' },
      { hip: [108, 112], torso: 96, arm: { at: [200, 120] }, leg: { at: [47, 124] }, foot: 'toes' },
      1.3,
      1.1,
    ),
    props: [{ kind: 'wheel', at: 'hand' }],
  },
  'decline-sit-up': {
    frames: rep(
      { hip: [142, 86], torso: -68, arm: CROSSED, leg: { at: [176, 104] } },
      { hip: [142, 86], torso: -185, arm: CROSSED, leg: { at: [176, 104] } },
    ),
    scene: [{ line: [66, 120, 156, 90], w: 8 }, { line: [80, 116, 80, 134], w: 5 }, { line: [146, 94, 146, 134], w: 5 }, { circle: [178, 96, 6] }],
  },
  'plank': { frames: hold(plank, { ...plank, ...straightFrom([44, 124], 100), arm: plank.arm }) },
  'crunch': { frames: rep({ ...ON_BACK, arm: TEMPLES }, { ...ON_BACK, torso: -120, arm: TEMPLES }, 0.8, 0.8) },
  'bicycle-crunch': {
    frames: [
      { pose: { ...ON_BACK, torso: -112, arm: TEMPLES, leg: { angles: [100, 100] }, farLeg: { angles: [190, 100] } }, move: 0.6, hold: 0.15 },
      { pose: { ...ON_BACK, torso: -116, arm: TEMPLES, leg: { angles: [190, 100] }, farLeg: { angles: [100, 100] } }, move: 0.6, hold: 0.15 },
    ],
  },
  'lying-leg-raise': {
    frames: rep(
      { ...ON_BACK, arm: { rel: [180, 180] }, leg: { angles: [90, 90] } },
      { ...ON_BACK, arm: { rel: [180, 180] }, leg: { angles: [180, 180] } },
      1.1,
      1.3,
    ),
  },
  'mountain-climber': {
    frames: [
      { pose: { ...pushTop(), leg: { at: [128, 118] }, farLeg: { at: PUSH_FEET } }, move: 0.3 },
      { pose: { ...pushTop(), leg: { at: PUSH_FEET }, farLeg: { at: [128, 118] } }, move: 0.3 },
    ],
  },
  'dead-bug': {
    frames: (() => {
      const up: Limb = { angles: [180, 180] };
      const overhead: Limb = { angles: [260, 260] };
      const table: Limb = { angles: [180, 90] };
      const out: Limb = { angles: [95, 95] };
      const bug = (arm: Limb, farArm: Limb, leg: Limb, farLeg: Limb): Pose => ({ ...ON_BACK, arm, farArm, leg, farLeg });
      return [
        { pose: bug(up, up, table, table), move: 0.8, hold: 0.2 },
        { pose: bug(overhead, up, table, out), move: 0.9, hold: 0.3 },
        { pose: bug(up, up, table, table), move: 0.8, hold: 0.2 },
        { pose: bug(up, overhead, out, table), move: 0.9, hold: 0.3 },
      ];
    })(),
  },

  // Legs
  'back-squat': {
    frames: rep(
      { ...STAND, torso: 178, arm: BAR_ON_BACK },
      { hip: [98, 100], torso: 138, arm: BAR_ON_BACK, leg: { at: ANKLE } },
      1.1,
      0.9,
    ),
    props: [{ kind: 'barbell', at: 'shoulder', nudge: [-7, 4] }],
  },
  'leg-press': {
    frames: rep(
      { hip: [90, 110], torso: -150, arm: { angles: [10, 40] }, leg: { at: [138, 64] }, foot: 'toes' },
      { hip: [90, 110], torso: -150, arm: { angles: [10, 40] }, leg: { at: [114, 88] }, foot: 'toes' },
    ),
    props: [{ kind: 'plate', at: 'ankle', angle: 45, length: 40 }],
    scene: [backrest(85, 113, 62, 73), { rect: [80, 114, 30, 6] }, { line: [100, 124, 190, 34], w: 3 }],
  },
  'romanian-deadlift': {
    frames: repVia(
      { hip: [118, 65], torso: 180, arm: { at: [121, 70] }, leg: { at: ANKLE } },
      { hip: [109, 66], torso: 140, arm: { at: [133, 82] }, leg: { at: ANKLE } },
      { hip: [102, 68], torso: 110, arm: { at: [144, 103] }, leg: { at: ANKLE } },
      0.6,
    ),
    props: BARBELL,
  },
  'leg-extension': {
    frames: rep(
      { hip: [100, 96], torso: 180, arm: { angles: [15, 25] }, leg: { angles: [90, 0] } },
      { hip: [100, 96], torso: 180, arm: { angles: [15, 25] }, leg: { angles: [90, 88] }, foot: 180 },
    ),
    props: [{ kind: 'pad', at: 'ankle', nudge: [5, 0] }],
    scene: [{ rect: [76, 100, 62, 7] }, backrest(92, 100, 92, 44), { line: [110, 107, 110, 134], w: 5 }],
  },
  'leg-curl': {
    frames: rep(
      { hip: [100, 104], torso: 90, arm: { angles: [60, 90] }, leg: { angles: [-90, -90] }, foot: -90 },
      { hip: [100, 104], torso: 90, arm: { angles: [60, 90] }, leg: { angles: [-90, -175] }, foot: -90 },
    ),
    props: [{ kind: 'pad', at: 'ankle', nudge: [0, -5] }],
    scene: bench(30, 180, 108),
  },
  'hip-thrust': {
    frames: rep(hipThrust([110, 118], -129, [112, 110]), hipThrust([122, 90], -90, [124, 82])),
    props: [{ kind: 'barbell', at: 'hip', nudge: [2, -10] }],
    scene: bench(26, 78, 98),
  },
  'walking-lunge-db': {
    frames: [
      { pose: { ...lungeStand, arm: { angles: [0, 0] } }, move: 0.5, hold: 0.3 },
      { pose: { ...lungeStep, arm: { angles: [0, 0] } }, move: 0.4 },
      { pose: { ...lungeBottom, arm: { angles: [0, 0] } }, move: 0.5, hold: 0.3 },
      { pose: { ...lungeStep, arm: { angles: [0, 0] } }, move: 0.5 },
    ],
    props: DUMBBELLS,
  },
  'calf-raise-machine': {
    frames: rep(
      { ...STAND, arm: { at: [128, 16] } },
      { hip: [121, 57], torso: 180, arm: { at: [130, 8] }, leg: { at: [123, 123] }, foot: 45 },
      0.7,
      0.9,
    ),
    focus: ['shin'],
    props: [{ kind: 'pad', at: 'shoulder', nudge: [0, -6] }],
  },
  'bodyweight-squat': { frames: rep(squatTop, squatBottom, 1.1, 0.9) },
  'lunge': {
    frames: [
      { pose: lungeStand, move: 0.5, hold: 0.3 },
      { pose: lungeStep, move: 0.4 },
      { pose: lungeBottom, move: 0.5, hold: 0.3 },
      { pose: lungeStep, move: 0.5 },
    ],
  },
  'bulgarian-split-squat': {
    frames: rep(
      { hip: [108, 72], torso: 178, arm: ON_HIPS, leg: { at: [135, 131] }, farLeg: { at: [62, 92] }, farFoot: -90 },
      { hip: [104, 96], torso: 178, arm: ON_HIPS, leg: { at: [135, 131] }, farLeg: { at: [62, 92] }, farFoot: -90 },
    ),
    scene: bench(30, 76, 98),
  },
  'glute-bridge': {
    frames: rep({ ...ON_BACK, hip: [126, 130], leg: { at: [162, 131] } }, { ...ON_BACK, hip: [120, 104], torso: -59, head: -31, leg: { at: [162, 131] } }),
  },
  'jump-squat': {
    frames: [
      { pose: { ...STAND, torso: 178, arm: { angles: [-20, -20] } }, move: 0.4, hold: 0.3 },
      { pose: { hip: [100, 98], torso: 142, arm: { angles: [-30, -30] }, leg: { at: ANKLE } }, move: 0.6, hold: 0.1 },
      { pose: { hip: [119, 47], torso: 180, arm: { angles: [120, 120] }, leg: { at: [120, 112] }, foot: 50 }, move: 0.25, hold: 0.05 },
      { pose: { hip: [104, 92], torso: 148, arm: { angles: [-10, -10] }, leg: { at: ANKLE } }, move: 0.3, hold: 0.1 },
    ],
  },
  'wall-sit': {
    frames: hold(
      { hip: [70, 96], torso: 180, arm: { angles: [0, 0] }, leg: { at: [104, 131] } },
      { hip: [70, 97], torso: 180, arm: { angles: [0, 0] }, leg: { at: [104, 131] } },
    ),
    scene: [{ line: [60, -46, 60, 134], w: 6 }],
  },

  // Warm-ups
  'jumping-jacks': {
    frames: (() => {
      const air: Pose = { ...FRONT_STAND, hip: [120, 58], arm: { angles: [90, 95] }, leg: { at: [140, 122] } };
      return [
        { pose: { ...FRONT_STAND, arm: { angles: [10, 8] } }, move: 0.2, hold: 0.05 },
        { pose: air, move: 0.18 },
        { pose: { ...FRONT_STAND, hip: [120, 68], arm: { angles: [170, 175] }, leg: { at: [148, 131] } }, move: 0.18, hold: 0.05 },
        { pose: air, move: 0.2 },
      ];
    })(),
  },
  'jump-rope': {
    frames: [
      { pose: { ...STAND, arm: { angles: [15, 70] } }, move: 0.2 },
      { pose: { ...STAND, hip: [119, 57], arm: { angles: [15, 80] }, leg: { at: [120, 123] }, foot: 50 }, move: 0.2 },
    ],
    props: [{ kind: 'cable', from: [124, 135], to: 'hand' }],
  },
  'rower': {
    frames: [
      { pose: { hip: [112, 112], torso: 150, arm: { at: [168, 100] }, leg: { at: [150, 112] }, foot: 'toes' }, move: 1.2, hold: 0.2 },
      { pose: { hip: [84, 112], torso: 202, arm: { at: [92, 90] }, leg: { at: [150, 112] }, foot: 'toes' }, move: 0.9, hold: 0.3 },
    ],
    props: [{ kind: 'cable', from: [176, 100], to: 'hand' }, { kind: 'handle', at: 'hand' }],
    scene: [{ line: [40, 118, 196, 118], w: 5 }, { circle: [186, 104, 14] }, { line: [156, 100, 156, 120], w: 4 }],
  },
  'bike': {
    frames: cycle(
      [0, 45, 90, 135, 180, 225, 270, 315].map((deg): Pose => {
        const pedal = (d: number): Point => [130 + 15 * Math.sin((d * Math.PI) / 180), 112 - 15 * Math.cos((d * Math.PI) / 180)];
        return { hip: [106, 70], torso: 150, arm: { at: [160, 44] }, leg: { at: pedal(deg) }, farLeg: { at: pedal(deg + 180) } };
      }),
      0.15,
    ),
    props: [{ kind: 'lever', from: [130, 112], to: 'ankle' }],
    scene: [
      { line: [98, 74, 114, 74], w: 5 },
      { line: [108, 76, 130, 112], w: 5 },
      { line: [130, 112, 158, 50], w: 5 },
      { line: [152, 46, 166, 46], w: 5 },
      { circle: [166, 112, 16] },
      { line: [96, 134, 180, 134], w: 5 },
    ],
  },
  'arm-circles': {
    frames: [0, 90, 180, 270, 360].map((deg, i) => ({ pose: { ...STAND, arm: { angles: [deg, deg] } }, move: i === 0 ? 0 : 0.3, ease: 'linear' })),
  },
  'band-pull-aparts': {
    frames: rep({ ...STAND, arm: { angles: [90, 90] } }, { ...STAND, arm: { angles: [90, 90], reach: 0.15 } }, 0.8, 0.8),
  },
  'high-knees': {
    frames: [
      { pose: { hip: [119, 64], torso: 178, arm: { angles: [-30, 40] }, farArm: { angles: [40, 130] }, leg: { angles: [75, 0] }, farLeg: { angles: [0, 0] } }, move: 0.3 },
      { pose: { hip: [119, 64], torso: 178, arm: { angles: [40, 130] }, farArm: { angles: [-30, 40] }, leg: { angles: [0, 0] }, farLeg: { angles: [75, 0] } }, move: 0.3 },
    ],
  },
  'world-greatest': {
    frames: rep(
      { hip: [108, 104], torso: 125, arm: { angles: [5, 5] }, farArm: { at: [150, 126] }, leg: { at: [150, 131] }, farLeg: { at: [60, 123] }, farFoot: 'toes' },
      { hip: [108, 104], torso: 128, arm: { angles: [180, 180] }, farArm: { at: [150, 126] }, leg: { at: [150, 131] }, farLeg: { at: [60, 123] }, farFoot: 'toes' },
      1.2,
      1.2,
    ),
  },
  'incline-walk': {
    frames: (() => {
      const front: Point = [140, 120];
      const back: Point = [96, 124.4];
      const mid: Point = [118, 122];
      const lifted: Point = [114, 110];
      const walk = (leg: Point, farLeg: Point, hipY: number, swing: number): Pose => ({
        hip: [116, hipY],
        torso: 176,
        arm: { angles: [swing, swing + 15] },
        farArm: { angles: [-swing, -swing + 15] },
        leg: { at: leg },
        farLeg: { at: farLeg },
        foot: 96,
        farFoot: 96,
      });
      return cycle([walk(front, back, 62, -25), walk(mid, lifted, 60, 0), walk(back, front, 62, 25), walk(lifted, mid, 60, 0)], 0.32);
    })(),
    scene: [{ line: [30, 134, 210, 116], w: 5 }, { line: [150, 40, 190, 40], w: 4 }, { line: [190, 40, 196, 118], w: 4 }],
  },
};
