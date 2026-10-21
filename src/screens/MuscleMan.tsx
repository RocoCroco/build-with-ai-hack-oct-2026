import { motion } from 'motion/react';
import type { Muscle } from '../data/exercises';
import { growth } from '../lib/stats';
import styles from './MuscleMan.module.css';

// A front-facing stickman in a 160 × 220 box. Each muscle is an ellipse
// [cx, cy, rx, ry, rotation] drawn at full size; it shrinks toward a small grey
// bump when the group hasn't been trained.
type Blob = [number, number, number, number, number];

const BONES: [number, number, number, number][] = [
  [80, 34, 80, 112], // spine
  [56, 46, 104, 46], // shoulders
  [70, 112, 90, 112], // hips
  [56, 46, 48, 86], // upper arms
  [104, 46, 112, 86],
  [48, 86, 45, 122], // forearms
  [112, 86, 115, 122],
  [70, 112, 67, 162], // thighs
  [90, 112, 93, 162],
  [67, 162, 66, 204], // shins
  [93, 162, 94, 204],
  [66, 204, 58, 206], // feet
  [94, 204, 102, 206],
];

// Drawn behind the bones (they sit at the back of the body)
const BEHIND: { muscle: Muscle; blobs: Blob[] }[] = [
  { muscle: 'back', blobs: [[64, 76, 8, 20, 12], [96, 76, 8, 20, -12]] },
  { muscle: 'triceps', blobs: [[45, 66, 5, 13, 11], [115, 66, 5, 13, -11]] },
];

// Drawn over the bones
const FRONT: { muscle: Muscle; blobs: Blob[] }[] = [
  { muscle: 'legs', blobs: [[69, 136, 9, 21, 4], [91, 136, 9, 21, -4], [66, 184, 6, 13, 2], [94, 184, 6, 13, -2]] },
  { muscle: 'abs', blobs: [[75, 80, 4.5, 5.5, 0], [85, 80, 4.5, 5.5, 0], [75, 92, 4.5, 5.5, 0], [85, 92, 4.5, 5.5, 0], [75, 104, 4.5, 5, 0], [85, 104, 4.5, 5, 0]] },
  { muscle: 'chest', blobs: [[70, 58, 10, 8, 0], [90, 58, 10, 8, 0]] },
  { muscle: 'biceps', blobs: [[52, 68, 5.5, 12, 11], [108, 68, 5.5, 12, -11]] },
  { muscle: 'shoulders', blobs: [[56, 48, 9, 9, 0], [104, 48, 9, 9, 0]] },
];

// Groups pop in one after another, top to bottom.
const ORDER: Muscle[] = ['shoulders', 'chest', 'back', 'biceps', 'triceps', 'abs', 'legs'];

interface Props {
  perMuscle: Record<Muscle, number>;
  animate: boolean;
}

function Group({ muscle, blobs, sets, animate }: { muscle: Muscle; blobs: Blob[]; sets: number; animate: boolean }) {
  const g = growth(sets);
  const scale = 0.4 + 0.6 * g; // never vanishes, so an untrained group still reads as "small"
  return (
    <g className={styles.group} data-muscle={muscle} data-trained={sets > 0 || undefined} style={{ opacity: sets > 0 ? 0.55 + 0.45 * g : 1 }}>
      {blobs.map(([cx, cy, rx, ry, rot], i) => (
        // The tilt sits on a wrapper, since the spring's scale replaces the ellipse's own transform.
        <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
          <motion.ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={animate ? { scale: 0.2 } : false}
            animate={{ scale }}
            transition={{ type: 'spring', stiffness: 260, damping: 13, delay: animate ? 0.15 + ORDER.indexOf(muscle) * 0.07 : 0 }}
          />
        </g>
      ))}
    </g>
  );
}

/** A stickman whose muscle groups grow with the sets finished for each. */
export function MuscleMan({ perMuscle, animate }: Props) {
  return (
    <svg className={styles.man} viewBox="0 0 160 220" role="img" aria-label="Your muscle groups, bigger the more you've trained them">
      {BEHIND.map((m) => (
        <Group key={m.muscle} {...m} sets={perMuscle[m.muscle]} animate={animate} />
      ))}
      <g className={styles.bones}>
        {BONES.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
        <circle cx={80} cy={22} r={12} />
      </g>
      {FRONT.map((m) => (
        <Group key={m.muscle} {...m} sets={perMuscle[m.muscle]} animate={animate} />
      ))}
    </svg>
  );
}
