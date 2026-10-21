import { motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { EXERCISES, MUSCLE_LABELS, MUSCLES, WARMUPS, type Where } from '../data/exercises';
import { ExerciseFigure } from './ExerciseFigure';
import { ExerciseSheet, type SheetItem } from './ExerciseSheet';
import styles from './LibraryScreen.module.css';

const WHERE_LABELS: Record<Where, string> = { gym: 'Gym', home: 'Home', any: 'Gym · Home' };

const range = ([min, max]: [number, number]) => (min === max ? `${min}` : `${min}–${max}`);

interface Row extends SheetItem {
  where: Where;
}

// Warm-ups first, like the draw, then each muscle group in body-map order.
const SECTIONS: { title: string; muscle?: SheetItem['muscle']; rows: Row[] }[] = [
  { title: 'Warm-ups', rows: WARMUPS.map((w) => ({ id: w.id, name: w.name, label: 'Warm-up', where: w.where })) },
  ...MUSCLES.map((muscle) => ({
    title: MUSCLE_LABELS[muscle],
    muscle,
    rows: EXERCISES.filter((e) => e.muscle === muscle).map((e) => ({
      id: e.id,
      name: e.name,
      label: MUSCLE_LABELS[muscle],
      muscle,
      where: e.where,
      volume: `${range(e.sets)} × ${range(e.reps)}`,
    })),
  })),
];

/** Every exercise and warm-up with its how-to, opened from the Start menu. */
export function LibraryScreen({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<SheetItem | null>(null);
  const closeSheet = useCallback(() => setOpen(null), []);

  return (
    <div className={styles.screen}>
      <button className="back" onClick={onBack}>
        Back
      </button>
      <h1 className={styles.title}>Exercises</h1>
      {SECTIONS.map((section) => (
        <section key={section.title} className={styles.section} data-muscle={section.muscle}>
          <h2 className={styles.heading}>{section.title}</h2>
          <ul className={styles.list}>
            {section.rows.map((row) => (
              <li key={row.id}>
                <motion.button className={styles.row} onClick={() => setOpen(row)} whileTap={{ scale: 0.98 }}>
                  <ExerciseFigure id={row.id} muscle={row.muscle} still />
                  <span className={styles.text}>
                    <span className={styles.name}>{row.name}</span>
                    <span className={styles.meta}>
                      {WHERE_LABELS[row.where]}
                      {row.volume && ` · ${row.volume}`}
                    </span>
                  </span>
                  <span className={styles.chevron} aria-hidden>
                    ›
                  </span>
                </motion.button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <ExerciseSheet item={open} onClose={closeSheet} />
    </div>
  );
}
