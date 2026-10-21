import { motion, type Variants } from 'motion/react';
import { useRef, useState } from 'react';
import { MUSCLE_LABELS } from '../data/exercises';
import type { DrawState } from '../lib/drawState';
import { planImage, planText, sharePhoto, shareText, type ShareResult } from '../lib/share';
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

// What a share button says for a moment after it's used. Shared/cancelled need no note.
const NOTES: Partial<Record<ShareResult, string>> = { copied: 'Copied!', saved: 'Saved!', failed: 'Didn’t work' };

type Kind = 'text' | 'photo';

export function PlanScreen({ state, onNewDraw }: Props) {
  const { warmup } = state;
  const [note, setNote] = useState<{ kind: Kind; text: string } | null>(null);
  const [busy, setBusy] = useState<Kind | null>(null);
  const noteTimer = useRef<number>(undefined);

  async function share(kind: Kind) {
    setBusy(kind);
    let result: ShareResult;
    try {
      result = kind === 'text' ? await shareText(planText(state)) : await sharePhoto(await planImage(state));
    } catch {
      result = 'failed';
    }
    setBusy(null);
    const text = NOTES[result];
    if (!text) return;
    setNote({ kind, text });
    clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), 1800);
  }

  function label(kind: Kind, idle: string) {
    if (note?.kind === kind) return note.text;
    return busy === kind ? '…' : idle;
  }

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
      <div className={styles.actions}>
        <div className={styles.shareRow}>
          <motion.button className={styles.share} onClick={() => share('text')} disabled={busy !== null} whileTap={{ scale: 0.96 }}>
            {label('text', 'Share text')}
          </motion.button>
          <motion.button className={styles.share} onClick={() => share('photo')} disabled={busy !== null} whileTap={{ scale: 0.96 }}>
            {label('photo', 'Save photo')}
          </motion.button>
        </div>
        <button className="primary" onClick={onNewDraw}>
          New draw
        </button>
      </div>
    </div>
  );
}
