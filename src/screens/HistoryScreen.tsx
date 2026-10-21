import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { MUSCLE_LABELS, MUSCLES } from '../data/exercises';
import { store } from '../lib/storage';
import { formatDuration, setsByMuscle, type WorkoutRecord } from '../lib/workout';
import styles from './HistoryScreen.module.css';

const PLACE = { gym: 'Gym', home: 'Home' } as const;

const dateLabel = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Workout({ record, open, onToggle }: { record: WorkoutRecord; open: boolean; onToggle: () => void }) {
  const perMuscle = setsByMuscle([record]);
  const groups = MUSCLES.filter((m) => perMuscle[m] > 0);
  return (
    <motion.li
      className={styles.card}
      variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <button className={styles.head} onClick={onToggle} aria-expanded={open}>
        <span className={styles.when}>
          {dateLabel(record.finishedAt)}
          <span className={styles.place}>{PLACE[record.place]}</span>
        </span>
        <span className={styles.duration}>{formatDuration(record.finishedAt - record.startedAt)}</span>
        <span className={styles.chips}>
          {groups.map((m) => (
            <span key={m} className={styles.chip} data-muscle={m}>
              {MUSCLE_LABELS[m]} {perMuscle[m]}
            </span>
          ))}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            className={styles.items}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          >
            {record.items.map((item) => (
              <li key={item.id} data-muscle={item.muscle}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemSets}>
                  {item.reps === undefined ? 'Warm-up' : `${item.done} × ${item.reps}`}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/** Every finished workout on this device, newest first; tap one to see its exercises. */
export function HistoryScreen({ onBack }: { onBack: () => void }) {
  const [history] = useState(() => [...store.loadHistory()].sort((a, b) => b.finishedAt - a.finishedAt));
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className={styles.screen}>
      <button className="back" onClick={onBack}>
        Back
      </button>
      <h1 className={styles.title}>History</h1>
      {history.length === 0 ? (
        <p className={styles.empty}>No workouts yet. Finish one and it shows up here.</p>
      ) : (
        <motion.ul
          className={styles.list}
          initial="hidden"
          animate="shown"
          variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.05 } } }}
        >
          {history.map((record) => (
            <Workout
              key={record.id}
              record={record}
              open={open === record.id}
              onToggle={() => setOpen(open === record.id ? null : record.id)}
            />
          ))}
        </motion.ul>
      )}
    </div>
  );
}
