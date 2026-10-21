import { motion, type Variants } from 'motion/react';
import { MUSCLE_LABELS, MUSCLES } from '../data/exercises';
import { formatDuration, setsByMuscle, type WorkoutRecord } from '../lib/workout';
import styles from './DoneScreen.module.css';

const list: Variants = { hidden: {}, shown: { transition: { delayChildren: 0.35, staggerChildren: 0.08 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

/** The finish line: how long it took and what got trained. The workout is already saved. */
export function DoneScreen({ record, onHome }: { record: WorkoutRecord; onHome: () => void }) {
  const perMuscle = setsByMuscle([record]);
  const trained = MUSCLES.filter((m) => perMuscle[m] > 0);
  const most = Math.max(1, ...trained.map((m) => perMuscle[m]));
  const sets = trained.reduce((sum, m) => sum + perMuscle[m], 0);
  const exercises = record.items.filter((i) => i.muscle).length;

  return (
    <div className={styles.screen}>
      <motion.p
        className={styles.badge}
        initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
      >
        Workout done!
      </motion.p>
      <motion.p
        className={styles.time}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 26 }}
      >
        {formatDuration(record.finishedAt - record.startedAt)}
      </motion.p>
      <motion.ul className={styles.stats} variants={list} initial="hidden" animate="shown">
        <motion.li variants={rise}>
          <strong>{exercises}</strong> exercises
        </motion.li>
        <motion.li variants={rise}>
          <strong>{sets}</strong> sets
        </motion.li>
      </motion.ul>
      <motion.ul className={styles.groups} variants={list} initial="hidden" animate="shown">
        {trained.map((m) => (
          <motion.li key={m} data-muscle={m} variants={rise}>
            <span>{MUSCLE_LABELS[m]}</span>
            <span className={styles.track}>
              <motion.span
                className={styles.fill}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: perMuscle[m] / most }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 120, damping: 20 }}
              />
            </span>
            <span className={styles.sets}>{perMuscle[m]}</span>
          </motion.li>
        ))}
      </motion.ul>
      <p className={styles.saved}>Saved to your history on this device</p>
      <button className={`primary ${styles.home}`} onClick={onHome}>
        Back to start
      </button>
    </div>
  );
}
