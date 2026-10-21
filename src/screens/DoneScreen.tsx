import { motion, type Variants } from 'motion/react';
import { useEffect, useState } from 'react';
import { MUSCLE_LABELS, MUSCLES, type Muscle } from '../data/exercises';
import { summarize } from '../lib/stats';
import { store } from '../lib/storage';
import { formatDuration, setsByMuscle, type WorkoutRecord } from '../lib/workout';
import { MuscleMan } from './MuscleMan';
import styles from './DoneScreen.module.css';

const list: Variants = { hidden: {}, shown: { transition: { delayChildren: 0.35, staggerChildren: 0.08 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

/** All sets per group, before and after this workout (it's already in the history). */
function loadTotals(record: WorkoutRecord) {
  const history = store.loadHistory();
  return {
    before: summarize(history.filter((r) => r.id !== record.id)).perMuscle,
    after: summarize(history.some((r) => r.id === record.id) ? history : [...history, record]).perMuscle,
  };
}

/**
 * The finish line: how long it took, and the stickman showing off each group this
 * workout trained while it grows. The workout is already saved.
 */
export function DoneScreen({ record, onHome }: { record: WorkoutRecord; onHome: () => void }) {
  const perMuscle = setsByMuscle([record]);
  // In workout order, so he poses in the order the groups were trained.
  const trained = [...new Set(record.items.flatMap((i) => (i.muscle && i.done > 0 ? [i.muscle] : [])))] as Muscle[];
  const most = Math.max(1, ...trained.map((m) => perMuscle[m]));
  const sets = trained.reduce((sum, m) => sum + perMuscle[m], 0);
  const exercises = record.items.filter((i) => i.muscle).length;
  const [totals] = useState(() => loadTotals(record));

  // Shown off here, so the Start screen doesn't replay it.
  useEffect(() => store.saveCelebrated(record.id), [record.id]);

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
      <div className={styles.man}>
        <MuscleMan before={totals.before} after={totals.after} celebrate={trained} animate />
      </div>
      <motion.ul className={styles.stats} variants={list} initial="hidden" animate="shown">
        <motion.li variants={rise}>
          <strong>{exercises}</strong> exercises
        </motion.li>
        <motion.li variants={rise}>
          <strong>{sets}</strong> sets
        </motion.li>
      </motion.ul>
      <motion.ul className={styles.groups} variants={list} initial="hidden" animate="shown">
        {MUSCLES.filter((m) => trained.includes(m)).map((m) => (
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
            <span className={styles.sets}>+{perMuscle[m]}</span>
          </motion.li>
        ))}
      </motion.ul>
      <button className={`primary ${styles.home}`} onClick={onHome}>
        Back to start
      </button>
    </div>
  );
}
