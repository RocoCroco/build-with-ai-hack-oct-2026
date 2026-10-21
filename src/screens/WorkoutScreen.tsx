import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type Dispatch } from 'react';
import { MUSCLE_LABELS } from '../data/exercises';
import type { Action, DrawState } from '../lib/drawState';
import { playLand, playReelStop } from '../lib/sound';
import { formatDuration, isComplete, recordFrom } from '../lib/workout';
import { ExerciseFigure } from './ExerciseFigure';
import styles from './WorkoutScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
  onFinish: (record: ReturnType<typeof recordFrom>) => void;
}

/** Ticks once a second; the elapsed time comes from the saved start, so a reload keeps it. */
function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** One exercise at a time: tick each set, then move on. The last one finishes the workout. */
export function WorkoutScreen({ state, dispatch, onFinish }: Props) {
  const now = useNow();
  const run = state.run;
  if (!run) return null;
  const item = run.items[run.index];
  const last = run.index === run.items.length - 1;
  const complete = isComplete(item);

  function tap(set: number) {
    const ticking = set >= item.done;
    dispatch({ type: 'tapSet', set });
    if (!ticking) return;
    // A clunk per set, and a chime when the exercise is done.
    if (set + 1 >= item.sets) playLand();
    else playReelStop();
    try {
      navigator.vibrate?.(15);
    } catch {
      // No vibration on this device.
    }
  }

  return (
    <div className={styles.screen} data-muscle={item.muscle}>
      <header className={styles.top}>
        <span className={styles.count}>
          {run.index + 1} / {run.items.length}
        </span>
        <span className={styles.timer} aria-label="Time so far">
          {formatDuration(now - run.startedAt)}
        </span>
      </header>
      <div className={styles.progress} aria-hidden>
        {run.items.map((it, i) => (
          <span key={it.id} data-muscle={it.muscle} data-state={isComplete(it) ? 'done' : i === run.index ? 'now' : undefined} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={item.id}
          className={styles.exercise}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <p className={styles.label}>{item.muscle ? MUSCLE_LABELS[item.muscle] : 'Warm-up'}</p>
          <h1 className={styles.name}>{item.name}</h1>
          {item.reps !== undefined && (
            <p className={styles.volume}>
              {item.sets} × {item.reps}
            </p>
          )}
          <ExerciseFigure id={item.id} muscle={item.muscle} />

          <p className={styles.hint}>{complete ? 'All done!' : item.muscle ? 'Tap each set as you finish it' : 'Tap when you’re warm'}</p>
          <div className={styles.sets}>
            {Array.from({ length: item.sets }, (_, set) => {
              const done = set < item.done;
              return (
                <motion.button
                  key={set}
                  className={styles.set}
                  data-done={done || undefined}
                  aria-pressed={done}
                  aria-label={item.muscle ? `Set ${set + 1}` : 'Warm-up done'}
                  onClick={() => tap(set)}
                  whileTap={{ scale: 0.88 }}
                  animate={done ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {done ? '✓' : item.muscle ? set + 1 : 'Go'}
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </AnimatePresence>

      {run.index > 0 && (
        <button className={styles.previous} onClick={() => dispatch({ type: 'goTo', index: run.index - 1 })}>
          ‹ Previous
        </button>
      )}
      <button
        className="continue"
        disabled={!complete}
        onClick={() => (last ? onFinish(recordFrom(run, state.place, Date.now())) : dispatch({ type: 'goTo', index: run.index + 1 }))}
        aria-label={last ? 'Finish the workout' : 'Next exercise'}
      >
        {last ? 'Done' : 'Next'}
      </button>
    </div>
  );
}
