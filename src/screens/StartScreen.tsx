import { motion } from 'motion/react';
import { useState } from 'react';
import { MUSCLES, type Muscle } from '../data/exercises';
import { useReduceAnimations } from '../lib/motionPrefs';
import { summarize } from '../lib/stats';
import { store } from '../lib/storage';
import { MuscleMan } from './MuscleMan';
import { StatsPanel } from './StatsPanel';
import styles from './StartScreen.module.css';

const UNTRAINED = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;

export function StartScreen({ onStart }: { onStart: () => void }) {
  // Read once per visit to Start, so a workout finished just before shows up.
  const [summary] = useState(() => summarize(store.loadHistory()));
  const reduce = useReduceAnimations();

  return (
    <div className={styles.screen}>
      <div>
        <h1 className={styles.title}>Workout Draw</h1>
        <p className={styles.tagline}>Randomize your routine</p>
      </div>
      {summary.workouts > 0 ? (
        <StatsPanel summary={summary} />
      ) : (
        // Before the first workout: a skinny grey stickman and a nudge.
        <div className={styles.empty}>
          <div className={styles.emptyMan}>
            <MuscleMan perMuscle={UNTRAINED} animate={!reduce} />
          </div>
          <p className={styles.hint}>Finish a workout and watch him grow</p>
        </div>
      )}
      <motion.button
        className={`primary ${styles.start}`}
        onClick={onStart}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        Start
      </motion.button>
    </div>
  );
}
