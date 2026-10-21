import { useAnimationFrame } from 'motion/react';
import { useState } from 'react';
import { FIGURES, type Segment } from '../data/figures';
import { joints, poseAt, type Joints, type Point } from '../lib/figure';
import styles from './ExerciseFigure.module.css';

const FLOOR = 134;

function Bone({ from, to, focus }: { from: Point; to: Point; focus?: boolean }) {
  return <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} data-focus={focus || undefined} />;
}

/** One side's arm and leg; the far side is drawn first, offset and dimmed, for a hint of depth. */
function Limbs({ j, focus, dumbbell }: { j: Joints; focus: Segment[]; dumbbell: boolean }) {
  return (
    <>
      <Bone from={j.hip} to={j.knee} focus={focus.includes('thigh')} />
      <Bone from={j.knee} to={j.ankle} focus={focus.includes('shin')} />
      <Bone from={j.ankle} to={j.toe} />
      <Bone from={j.shoulder} to={j.elbow} focus={focus.includes('upperArm')} />
      <Bone from={j.elbow} to={j.hand} focus={focus.includes('forearm')} />
      {dumbbell && <circle className={styles.weight} cx={j.hand[0]} cy={j.hand[1]} r={7} />}
    </>
  );
}

/** A looping side-view figure doing the exercise, or nothing if this exercise has none yet. */
export function ExerciseFigure({ id }: { id: string }) {
  const anim = FIGURES[id];
  const [seconds, setSeconds] = useState(0);
  useAnimationFrame((ms) => {
    if (anim) setSeconds(ms / 1000);
  });
  if (!anim) return null;

  const j = joints(poseAt(anim.frames, seconds));
  const dumbbell = anim.props?.includes('dumbbell') ?? false;
  return (
    <svg className={styles.figure} viewBox="20 -24 200 166" role="img" aria-label="How the exercise moves">
      <line className={styles.floor} x1={20} y1={FLOOR + 1.5} x2={220} y2={FLOOR + 1.5} />
      <g className={styles.far} transform="translate(5 0)">
        <Limbs j={j} focus={anim.focus} dumbbell={dumbbell} />
      </g>
      <g className={styles.body}>
        <Bone from={j.hip} to={j.shoulder} focus={anim.focus.includes('torso')} />
        <circle className={styles.head} cx={j.head[0]} cy={j.head[1]} r={10} />
        <Limbs j={j} focus={anim.focus} dumbbell={dumbbell} />
      </g>
    </svg>
  );
}
