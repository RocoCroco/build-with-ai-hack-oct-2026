import { useRef, useState } from 'react';
import { MUSCLES, type Muscle } from '../data/exercises';
import {
  celebrateBeats,
  DANCE_BEATS,
  IDLE,
  IDLE_BEATS,
  manJoints,
  playBeats,
  type Beat,
  type Limb,
  type ManJoints,
  type ManPose,
  type Point,
} from '../lib/muscleMan';
import { growth } from '../lib/stats';
import { useFrameLoop } from '../lib/useFrameLoop';
import styles from './MuscleMan.module.css';

// ---- Where each muscle sits on the skeleton ----

/** An ellipse at full size: centre, radii, and its tilt in degrees. */
type Blob = { c: Point; rx: number; ry: number; rot: number };

const tilt = ([dx, dy]: Point) => (Math.atan2(-dx, dy) * 180) / Math.PI;

/** A point along a bone (t from root to end), nudged sideways; the blob follows the bone's angle. */
function onBone(a: Point, b: Point, t: number, side: number, rx: number, ry: number): Blob {
  const v: Point = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(v[0], v[1]) || 1;
  const perp: Point = [-v[1] / len, v[0] / len];
  return { c: [a[0] + v[0] * t + perp[0] * side, a[1] + v[1] * t + perp[1] * side], rx, ry, rot: tilt(v) };
}

/** A point on the torso: `k` across from the spine, `d` down from the neck. */
function onTorso(j: ManJoints, k: number, d: number, rx: number, ry: number, extraTilt = 0): Blob {
  return {
    c: [j.neck[0] + j.across[0] * k + j.down[0] * d, j.neck[1] + j.across[1] * k + j.down[1] * d],
    rx,
    ry,
    rot: tilt(j.down) + extraTilt,
  };
}

const bothArms = (j: ManJoints, make: (arm: Limb, out: number) => Blob) => [make(j.arms[0], -1), make(j.arms[1], 1)];
const bothLegs = (j: ManJoints, make: (leg: Limb) => Blob) => [make(j.legs[0]), make(j.legs[1])];

// Behind the bones: lats and triceps sit at the back of the body.
const BEHIND: { muscle: Muscle; blobs: (j: ManJoints) => Blob[] }[] = [
  { muscle: 'back', blobs: (j) => [onTorso(j, 16, 34, 8, 20, -12), onTorso(j, -16, 34, 8, 20, 12)] },
  { muscle: 'triceps', blobs: (j) => bothArms(j, (a, out) => onBone(a.root, a.mid, 0.45, 5 * out, 4.5, 11)) },
];

const FRONT: { muscle: Muscle; blobs: (j: ManJoints) => Blob[] }[] = [
  {
    muscle: 'legs',
    blobs: (j) => [
      ...bothLegs(j, (l) => onBone(l.root, l.mid, 0.45, 0, 9, 21)),
      ...bothLegs(j, (l) => onBone(l.mid, l.end, 0.45, 0, 6, 13)),
    ],
  },
  {
    muscle: 'abs',
    blobs: (j) => [38, 50, 62].flatMap((d) => [onTorso(j, 5, d, 4.5, 5.5), onTorso(j, -5, d, 4.5, 5.5)]),
  },
  { muscle: 'chest', blobs: (j) => [onTorso(j, 10, 15, 10, 8), onTorso(j, -10, 15, 10, 8)] },
  { muscle: 'biceps', blobs: (j) => bothArms(j, (a, out) => onBone(a.root, a.mid, 0.5, -1.5 * out, 5.5, 12)) },
  { muscle: 'shoulders', blobs: (j) => bothArms(j, (a) => onBone(a.root, a.mid, 0.06, 0, 9, 9)) },
];

// Groups pop in one after another, top to bottom, when Start opens.
const ORDER: Muscle[] = ['shoulders', 'chest', 'back', 'biceps', 'triceps', 'abs', 'legs'];
const POP_STAGGER = 0.07;
const POP_TIME = 0.4;

/** 0 → 1 with a little overshoot, for the pop-in. */
function popIn(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.9;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

// ---- The figure ----

type Mode = { kind: 'idle' | 'dance' | 'settle' | 'celebrate'; beats: Beat[]; start: number; from: ManPose };

interface Props {
  /** Sets per group before the newest workout (or the totals, when there's nothing new). */
  before: Record<Muscle, number>;
  after: Record<Muscle, number>;
  /** Groups the newest workout trained, in order; each gets its pose and grows. Empty when nothing is new. */
  celebrate: readonly Muscle[];
  animate: boolean;
}

/** What one animation frame draws: worked out in the frame callback, read by render. */
interface Frame {
  pose: ManPose;
  sizes: Record<Muscle, number>; // 0–1 growth as currently shown
  shown: Record<Muscle, number>; // sets as currently shown (old until a group's turn)
  feature?: Muscle; // the group being posed in the celebration
  age: number; // seconds since the figure appeared, for the pop-in
  clock: number; // seconds, for the featured group's pulse
}

/** A stickman whose muscle groups grow with the sets finished for each. Tap him and he dances. */
export function MuscleMan({ before, after, celebrate, animate }: Props) {
  const [frame, setFrame] = useState<Frame | null>(null);
  // The animation's own bookkeeping; only the frame callback and the tap handler touch these.
  const born = useRef<number | null>(null);
  const mode = useRef<Mode | null>(null);
  const pose = useRef<ManPose>(IDLE[0]);
  const grown = useRef(new Set<Muscle>());
  const sizes = useRef<Record<Muscle, number>>(Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>);
  const clock = useRef(0);

  function startIdle(now: number) {
    // Starting a beat in, so the loop picks up from the standing pose without a jump.
    mode.current = { kind: 'idle', beats: IDLE_BEATS, start: now - IDLE_BEATS[0].move, from: IDLE[0] };
  }

  useFrameLoop((now) => {
    if (!animate) return;
    const dt = Math.min(0.1, now - clock.current);
    clock.current = now;
    if (born.current === null) {
      born.current = now;
      // After the pop-in, show off what the last workout trained, then idle.
      const pause: Beat = { pose: IDLE[0], move: 0.9 };
      if (celebrate.length) mode.current = { kind: 'celebrate', beats: [pause, ...celebrateBeats(celebrate)], start: now, from: IDLE[0] };
      else startIdle(now);
    }
    const m = mode.current!;
    const result = playBeats(m.beats, m.from, now - m.start, m.kind === 'idle');
    let feature: Muscle | undefined;
    if (!result) {
      if (m.kind === 'celebrate') celebrate.forEach((g) => grown.current.add(g));
      // Ease back to standing, then breathe.
      if (m.kind === 'settle') startIdle(now);
      else mode.current = { kind: 'settle', beats: [{ pose: IDLE[0], move: 0.5 }], start: now, from: pose.current };
    } else {
      pose.current = result.pose;
      feature = m.kind === 'celebrate' ? result.feature : undefined;
      if (feature) grown.current.add(feature);
    }
    // Each group eases toward its size: the old one until its turn in the celebration, then the new.
    const shown = {} as Record<Muscle, number>;
    for (const g of MUSCLES) {
      shown[g] = grown.current.has(g) ? after[g] : before[g];
      sizes.current[g] += (growth(shown[g]) - sizes.current[g]) * Math.min(1, dt * 5);
    }
    setFrame({ pose: pose.current, sizes: { ...sizes.current }, shown, feature, age: now - born.current, clock: now });
  });

  function dance() {
    const m = mode.current;
    if (!animate || !m || m.kind === 'celebrate' || m.kind === 'dance') return;
    mode.current = { kind: 'dance', beats: DANCE_BEATS, start: clock.current, from: pose.current };
  }

  // Without animation (or before the first frame) he stands still at his current size.
  const still = !animate || !frame;
  return (
    <ManFigure
      pose={still ? IDLE[0] : frame.pose}
      look={(m) => ({
        sets: still ? after[m] : frame.shown[m],
        size: still ? growth(after[m]) : frame.sizes[m],
        pop: !animate ? 1 : still ? 0 : popIn((frame.age - 0.1 - ORDER.indexOf(m) * POP_STAGGER) / POP_TIME),
      })}
      feature={still ? undefined : frame.feature}
      pulse={still ? 1 : 1 + 0.25 * Math.sin(frame.clock * 7) ** 2}
      onTap={animate ? dance : undefined}
    />
  );
}

interface FigureProps {
  pose: ManPose;
  /** For each group: sets shown (0 = grey), growth 0–1, and pop-in 0–1. */
  look: (muscle: Muscle) => { sets: number; size: number; pop: number };
  feature?: Muscle; // lit up, with the rest dimmed
  pulse?: number; // extra scale on the featured group
  onTap?: () => void;
}

/** The stickman drawn in one pose. No timing of its own, so it also works as a still. */
export function ManFigure({ pose, look, feature, pulse = 1, onTap }: FigureProps) {
  const j = manJoints(pose);

  function group({ muscle, blobs }: { muscle: Muscle; blobs: (j: ManJoints) => Blob[] }) {
    const { sets, size, pop } = look(muscle);
    const featured = feature === muscle;
    const scale = (0.4 + 0.6 * size) * pop * (featured ? pulse : 1);
    return (
      <g
        key={muscle}
        className={styles.group}
        data-muscle={muscle}
        data-trained={sets > 0 || undefined}
        data-featured={featured || undefined}
        data-dim={(feature && !featured) || undefined}
        style={{ opacity: sets > 0 ? 0.55 + 0.45 * size : 1 }}
      >
        {blobs(j).map(({ c: [cx, cy], rx, ry, rot }, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx * scale} ry={ry * scale} transform={`rotate(${rot.toFixed(1)} ${cx} ${cy})`} />
        ))}
      </g>
    );
  }

  const bone = ([x1, y1]: Point, [x2, y2]: Point, key: string) => <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} />;

  return (
    <svg
      className={styles.man}
      viewBox="-10 -40 180 256"
      role="img"
      aria-label="Your muscle groups, bigger the more you've trained them. Tap him to dance."
      onClick={onTap}
      data-tappable={onTap ? true : undefined}
    >
      {BEHIND.map(group)}
      <g className={styles.bones}>
        {bone(j.hip, j.neck, 'spine')}
        {bone(j.arms[0].root, j.arms[1].root, 'shoulders')}
        {bone(j.legs[0].root, j.legs[1].root, 'hips')}
        {j.arms.flatMap((a, i) => [bone(a.root, a.mid, `ua${i}`), bone(a.mid, a.end, `fa${i}`)])}
        {j.legs.flatMap((l, i) => [bone(l.root, l.mid, `th${i}`), bone(l.mid, l.end, `sh${i}`), bone(l.end, j.feet[i], `ft${i}`)])}
        <circle cx={j.head[0]} cy={j.head[1]} r={12} />
      </g>
      {FRONT.map(group)}
    </svg>
  );
}
