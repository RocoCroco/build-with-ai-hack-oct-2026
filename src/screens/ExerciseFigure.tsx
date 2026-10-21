import { useAnimationFrame } from 'motion/react';
import { useState } from 'react';
import type { Muscle } from '../data/exercises';
import { FIGURES, type JointName, type Prop, type Segment, type Shape } from '../data/figures';
import { add, dir, distance, joints, poseAt, type Joints, type Point, type Side } from '../lib/figure';
import styles from './ExerciseFigure.module.css';

const FLOOR = 134;

// What's working, unless a figure says otherwise
const FOCUS: Record<Muscle, Segment[]> = {
  chest: ['torso'],
  back: ['torso'],
  shoulders: ['upperArm'],
  biceps: ['upperArm'],
  triceps: ['upperArm'],
  abs: ['torso'],
  legs: ['thigh'],
};

const LIMB_JOINTS = new Set<JointName>(['hand', 'elbow', 'knee', 'ankle', 'toe']);

/** Where a prop sits; limb joints come from the side being drawn. */
function jointOf(j: Joints, s: Side, name: JointName): Point {
  if (name === 'shoulder') return j.shoulder;
  if (name === 'hip') return j.hip;
  return s[name];
}

function Bone({ from, to, focus }: { from: Point; to: Point; focus?: boolean }) {
  return <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} data-focus={focus || undefined} />;
}

function PropMark({ prop, j, s, mirror }: { prop: Prop; j: Joints; s: Side; mirror: boolean }) {
  if ('from' in prop) {
    const [x, y] = jointOf(j, s, prop.to);
    // In front view the far side's cable comes from the mirrored pulley.
    const fromX = mirror ? 2 * j.hip[0] - prop.from[0] : prop.from[0];
    return <line className={styles[prop.kind]} x1={fromX} y1={prop.from[1]} x2={x} y2={y} />;
  }
  if (prop.kind === 'bar') {
    const [a, b] = [j.near.hand, j.far.hand];
    const along: Point = [(b[0] - a[0]) / (distance(a, b) || 1), (b[1] - a[1]) / (distance(a, b) || 1)];
    const [p, q] = [add(a, along, -12), add(b, along, 12)];
    return <line className={styles.bar} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />;
  }
  if (prop.kind === 'dumbbell-across') {
    // The handle runs square to the forearm, with a plate at each end.
    const len = distance(s.elbow, s.hand) || 1;
    const along: Point = [(s.hand[0] - s.elbow[0]) / len, (s.hand[1] - s.elbow[1]) / len];
    const across: Point = [-along[1], along[0]];
    const ends = [add(s.hand, across, -8), add(s.hand, across, 8)];
    return (
      <g className={styles.weight}>
        <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} />
        {ends.map(([x, y], i) => (
          <rect key={i} x={x - 4} y={y - 4} width={8} height={8} rx={2} />
        ))}
      </g>
    );
  }
  if (prop.kind === 'plate') {
    const at = jointOf(j, s, prop.at);
    const [a, b] = [add(at, dir(prop.angle), -prop.length / 2), add(at, dir(prop.angle), prop.length / 2)];
    return <line className={styles.lever} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
  }
  const [x, y] = add(jointOf(j, s, prop.at), prop.nudge ?? [0, 0]);
  switch (prop.kind) {
    case 'barbell':
    case 'wheel':
      return (
        <g className={styles.weight}>
          <circle cx={x} cy={y} r={12} />
          <circle className={styles.hub} cx={x} cy={y} r={3} />
        </g>
      );
    case 'dumbbell':
      return <circle className={styles.weight} cx={x} cy={y} r={7} />;
    case 'bag':
      return <rect className={styles.weight} x={x - 8} y={y - 2} width={16} height={19} rx={4} />;
    case 'pad':
      return <circle className={styles.pad} cx={x} cy={y} r={6} />;
    case 'handle':
      return <circle className={styles.hub} cx={x} cy={y} r={4} />;
  }
}

/** Props for one side: far gets the hand-held ones unless marked near-only; body props go with near. */
function propsFor(props: Prop[], side: 'near' | 'far') {
  return props.filter((p) => {
    const joint = 'to' in p ? p.to : p.at;
    if (!LIMB_JOINTS.has(joint)) return side === 'near';
    const nearOnly = p.kind === 'plate' || p.kind === 'bar' || ('near' in p && p.near) || p.kind === 'barbell' || p.kind === 'wheel';
    return side === 'near' || !nearOnly;
  });
}

function SceneShape({ shape }: { shape: Shape }) {
  if ('line' in shape) {
    const [x1, y1, x2, y2] = shape.line;
    return <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={shape.w ?? 4} />;
  }
  if ('rect' in shape) {
    const [x, y, w, h] = shape.rect;
    return <rect x={x} y={y} width={w} height={h} rx={3} />;
  }
  const [cx, cy, r] = shape.circle;
  return <circle cx={cx} cy={cy} r={r} />;
}

function Limbs({ s, focus }: { s: Side; focus: Segment[] }) {
  return (
    <>
      <Bone from={s.hip} to={s.knee} focus={focus.includes('thigh')} />
      <Bone from={s.knee} to={s.ankle} focus={focus.includes('shin')} />
      <Bone from={s.ankle} to={s.toe} />
      <Bone from={s.shoulder} to={s.elbow} focus={focus.includes('upperArm')} />
      <Bone from={s.elbow} to={s.hand} focus={focus.includes('forearm')} />
    </>
  );
}

interface Props {
  id: string;
  muscle?: Muscle; // warm-ups have none and highlight nothing
  still?: boolean; // a frozen thumbnail of the starting pose
}

/** A looping figure doing the exercise, or nothing if this exercise has none. */
export function ExerciseFigure({ id, muscle, still }: Props) {
  const anim = FIGURES[id];
  const [seconds, setSeconds] = useState(0);
  useAnimationFrame((ms) => {
    if (anim && !still) setSeconds(ms / 1000);
  });
  if (!anim) return null;

  // A still shows the first keyframe, the pose each rep starts from.
  const j = joints(still ? anim.frames[0].pose : poseAt(anim.frames, seconds));
  const focus = anim.focus ?? (muscle ? FOCUS[muscle] : []);
  const props = anim.props ?? [];
  return (
    <svg
      className={styles.figure}
      data-still={still || undefined}
      viewBox="20 -46 200 188"
      role="img"
      aria-label={still ? undefined : 'How the exercise moves'}
      aria-hidden={still || undefined}
    >
      <line className={styles.floor} x1={20} y1={FLOOR + 1.5} x2={220} y2={FLOOR + 1.5} />
      <g className={styles.scene}>
        {anim.scene?.map((shape, i) => <SceneShape key={i} shape={shape} />)}
      </g>
      {/* Side view: the far side sits behind, offset and dimmed. Front view: both sides are equal. */}
      <g className={j.front ? styles.body : styles.far} transform={j.front ? undefined : 'translate(5 0)'}>
        {propsFor(props, 'far').map((p, i) => <PropMark key={i} prop={p} j={j} s={j.far} mirror={j.front} />)}
        <Limbs s={j.far} focus={focus} />
      </g>
      <g className={styles.body}>
        <Bone from={j.hip} to={j.shoulder} focus={focus.includes('torso')} />
        {j.front && (
          <>
            <Bone from={j.far.shoulder} to={j.near.shoulder} focus={focus.includes('torso')} />
            <Bone from={j.far.hip} to={j.near.hip} />
          </>
        )}
        <circle className={styles.head} cx={j.head[0]} cy={j.head[1]} r={10} />
        <Limbs s={j.near} focus={focus} />
        {propsFor(props, 'near').map((p, i) => <PropMark key={i} prop={p} j={j} s={j.near} mirror={false} />)}
      </g>
    </svg>
  );
}
