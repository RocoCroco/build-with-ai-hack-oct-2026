import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Muscle } from '../data/exercises';
import { CUES, youtubeSearchUrl } from '../data/howTo';
import { ExerciseFigure } from './ExerciseFigure';
import styles from './ExerciseSheet.module.css';

export interface SheetItem {
  id: string;
  name: string;
  label: string; // muscle group, or "Warm-up"
  muscle?: Muscle; // warm-ups have none and use the accent
  volume?: string; // "4 × 8"
}

interface Props {
  item: SheetItem | null;
  onClose: () => void;
}

/** Slides up over the plan with how to do one exercise. Drag down, tap outside, or Escape to close. */
export function ExerciseSheet({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  // Portaled to <body> so it stays fixed to the screen even while the plan scrolls.
  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key="backdrop"
          className={styles.backdrop}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.section
            className={styles.sheet}
            data-muscle={item.muscle}
            role="dialog"
            aria-modal
            aria-label={item.name}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <div className={styles.handle} aria-hidden />
            <p className={styles.label}>{item.label}</p>
            <div className={styles.head}>
              <h2 className={styles.name}>{item.name}</h2>
              {item.volume && <p className={styles.volume}>{item.volume}</p>}
            </div>
            <ExerciseFigure id={item.id} />
            <ol className={styles.cues}>
              {CUES[item.id]?.map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ol>
            <a className={styles.youtube} href={youtubeSearchUrl(item.name)} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M9 7.5v9l7.5-4.5z" />
              </svg>
              Watch on YouTube
            </a>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
