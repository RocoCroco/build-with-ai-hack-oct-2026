import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { MUSCLES, type Muscle } from '../data/exercises';
import { summarize } from '../lib/stats';
import { store } from '../lib/storage';
import type { WorkoutRecord } from '../lib/workout';
import { MuscleMan } from './MuscleMan';
import { StatsPanel } from './StatsPanel';
import styles from './StartScreen.module.css';

const UNTRAINED = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;

/** The groups a workout trained, in the order it trained them. */
function groupsOf(record: WorkoutRecord): Muscle[] {
  const groups: Muscle[] = [];
  for (const item of record.items) if (item.muscle && item.done > 0 && !groups.includes(item.muscle)) groups.push(item.muscle);
  return groups;
}

/** History, plus what the newest workout changed if Start hasn't shown it off yet. */
function loadStats() {
  const history = store.loadHistory();
  const last = history.at(-1);
  const isNew = !!last && store.loadCelebrated() !== last.id;
  const summary = summarize(history);
  return {
    last,
    summary,
    before: isNew ? summarize(history.slice(0, -1)).perMuscle : summary.perMuscle,
    fresh: isNew && last ? groupsOf(last) : [],
  };
}

export function StartScreen({ onStart }: { onStart: () => void }) {
  // Read once per visit to Start, so a workout finished just before shows up.
  const [stats] = useState(loadStats);
  // The newest workout gets its celebration once.
  useEffect(() => {
    if (stats.last) store.saveCelebrated(stats.last.id);
  }, [stats.last]);

  return (
    <div className={styles.screen}>
      <div>
        <h1 className={styles.title}>Workout Draw</h1>
        <p className={styles.tagline}>Randomize your routine</p>
      </div>
      {stats.summary.workouts > 0 ? (
        <StatsPanel summary={stats.summary} before={stats.before} fresh={stats.fresh} />
      ) : (
        // Before the first workout: a skinny grey stickman and a nudge.
        <div className={styles.empty}>
          <div className={styles.emptyMan}>
            <MuscleMan before={UNTRAINED} after={UNTRAINED} celebrate={[]} animate />
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
