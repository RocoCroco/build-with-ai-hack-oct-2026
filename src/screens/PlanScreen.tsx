import { motion, type Variants } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { MUSCLE_LABELS } from '../data/exercises';
import type { DrawState } from '../lib/drawState';
import { planImage, planText, sharePhoto, shareText, type ShareResult } from '../lib/share';
import { ExerciseSheet, type SheetItem } from './ExerciseSheet';
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
  const [open, setOpen] = useState<SheetItem | null>(null);
  const closeSheet = useCallback(() => setOpen(null), []);
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

  // The warm-up (unless "No warm-up") on top, then the exercises in the order they were drawn.
  const items: SheetItem[] = [
    ...(warmup && warmup !== 'none' ? [{ id: warmup.id, name: warmup.name, label: 'Warm-up' }] : []),
    ...state.drawn.map(({ exercise, sets, reps }) => ({
      id: exercise.id,
      name: exercise.name,
      label: MUSCLE_LABELS[exercise.muscle],
      muscle: exercise.muscle,
      volume: `${sets} × ${reps}`,
    })),
  ];

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Your workout</h1>
      <motion.ol className={styles.list} variants={list} initial="hidden" animate="shown">
        {items.map((item) => (
          <motion.li key={item.id} variants={card}>
            {/* Each card opens its how-to sheet. */}
            <motion.button
              className={styles.card}
              data-muscle={item.muscle}
              onClick={() => setOpen(item)}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <p className={styles.name}>{item.name}</p>
                <p className={styles.muscle}>{item.label}</p>
              </div>
              {item.volume && <p className={styles.volume}>{item.volume}</p>}
              <span className={styles.chevron} aria-hidden>
                ›
              </span>
            </motion.button>
          </motion.li>
        ))}
      </motion.ol>
      <ExerciseSheet item={open} onClose={closeSheet} />
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
