import { motion } from 'motion/react';
import type { Muscle } from '../data/exercises';
import styles from './BodyMap.module.css';

interface Props {
  selected: readonly Muscle[];
  dimmed: boolean;
  onToggle: (muscle: Muscle) => void;
}

// A rounded rectangle: x, y, width, height, corner radius.
type Box = [number, number, number, number, number];

// Shared silhouette parts (not tappable), in a 120 × 260 figure.
const BASE: Box[] = [
  [46, 6, 28, 30, 14], // head
  [54, 32, 12, 12, 4], // neck
  [34, 40, 52, 86, 16], // torso
  [12, 96, 13, 38, 6], // left forearm
  [95, 96, 13, 38, 6], // right forearm
  [40, 120, 40, 18, 8], // hips
];

// Tappable regions per view. Shoulders and legs show on both sides of the body.
const FRONT: { muscle: Muscle; boxes: Box[] }[] = [
  { muscle: 'shoulders', boxes: [[20, 42, 20, 22, 10], [80, 42, 20, 22, 10]] },
  { muscle: 'chest', boxes: [[40, 46, 19, 24, 8], [61, 46, 19, 24, 8]] },
  { muscle: 'abs', boxes: [[46, 73, 28, 46, 9]] },
  { muscle: 'biceps', boxes: [[15, 64, 14, 30, 7], [91, 64, 14, 30, 7]] },
  { muscle: 'legs', boxes: [[40, 134, 19, 64, 9], [61, 134, 19, 64, 9], [42, 202, 15, 50, 7], [63, 202, 15, 50, 7]] },
];

const BACK: { muscle: Muscle; boxes: Box[] }[] = [
  { muscle: 'shoulders', boxes: [[20, 42, 20, 22, 10], [80, 42, 20, 22, 10]] },
  { muscle: 'back', boxes: [[38, 44, 44, 70, 14]] },
  { muscle: 'triceps', boxes: [[15, 64, 14, 30, 7], [91, 64, 14, 30, 7]] },
  { muscle: 'legs', boxes: [[40, 122, 40, 24, 10], [40, 148, 19, 50, 9], [61, 148, 19, 50, 9], [42, 202, 15, 50, 7], [63, 202, 15, 50, 7]] },
];

function Figure({ regions, label, selected, onToggle }: { regions: typeof FRONT; label: string } & Omit<Props, 'dimmed'>) {
  return (
    <figure className={styles.figure}>
      <svg viewBox="0 0 120 260" className={styles.svg} aria-hidden>
        {BASE.map(([x, y, w, h, r], i) => (
          <rect key={i} className={styles.base} x={x} y={y} width={w} height={h} rx={r} />
        ))}
        {regions.map(({ muscle, boxes }) => {
          const on = selected.includes(muscle);
          return (
            <motion.g
              key={muscle}
              className={styles.region}
              data-muscle={muscle}
              data-on={on || undefined}
              onClick={() => onToggle(muscle)}
              // A small spring "pop" when a group is picked
              animate={on ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileTap={{ scale: 0.92 }}
            >
              {boxes.map(([x, y, w, h, r], i) => (
                <rect key={i} x={x} y={y} width={w} height={h} rx={r} />
              ))}
            </motion.g>
          );
        })}
      </svg>
      <figcaption className={styles.caption}>{label}</figcaption>
    </figure>
  );
}

/** Front and back silhouettes; tap a group on either to pick it. */
export function BodyMap({ selected, dimmed, onToggle }: Props) {
  return (
    <div className={styles.map} data-dimmed={dimmed || undefined}>
      <Figure regions={FRONT} label="Front" selected={selected} onToggle={onToggle} />
      <Figure regions={BACK} label="Back" selected={selected} onToggle={onToggle} />
    </div>
  );
}
