import { motion, type Variants } from 'motion/react';
import { MUSCLE_LABELS } from '../data/exercises';
import type { DrawState } from '../lib/drawState';
import styles from './PlanScreen.module.css';

interface Props {
  state: DrawState;
  onNewDraw: () => void;
}

// The cards deal in one after another, warm-up first.
const list: Variants = {
  hidden: {},
  shown: { transition: { delayChildren: 0.15, staggerChildren: 0.09 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

export function PlanScreen({ state, onNewDraw }: Props) {
  const { warmup } = state;
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Your workout</h1>
      <motion.ol className={styles.list} variants={list} initial="hidden" animate="shown">
        {warmup && warmup !== 'none' && (
          <motion.li className={styles.card} data-warmup variants={card}>
            <div>
              <p className={styles.name}>{warmup.name}</p>
              <p className={styles.muscle}>Warm-up</p>
            </div>
          </motion.li>
        )}
        {state.drawn.map(({ exercise, sets, reps }) => (
          <motion.li key={exercise.id} className={styles.card} data-muscle={exercise.muscle} variants={card}>
            <div>
              <p className={styles.name}>{exercise.name}</p>
              <p className={styles.muscle}>{MUSCLE_LABELS[exercise.muscle]}</p>
            </div>
            <p className={styles.volume}>
              {sets} × {reps}
            </p>
          </motion.li>
        ))}
      </motion.ol>
      <button className={`primary ${styles.newDraw}`} onClick={onNewDraw}>
        New draw
      </button>
    </div>
  );
}
