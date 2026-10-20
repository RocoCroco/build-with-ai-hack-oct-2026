import { AnimatePresence, motion } from 'motion/react';
import { useState, type Dispatch } from 'react';
import { MUSCLES } from '../data/exercises';
import type { Action, DrawState } from '../lib/drawState';
import { Lever } from './Lever';
import { SlotReels } from './SlotReels';
import styles from './CountScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
}

/** A hand-drawn arrow curving from the title down to the lever's knob. */
function PullArrow() {
  return (
    <motion.svg
      className={styles.arrow}
      viewBox="0 0 120 70"
      aria-hidden
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {/* Bobs toward the knob to say "pull me" */}
      <motion.g animate={{ y: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
        <motion.path
          d="M6 8 C 50 0, 92 10, 92 52"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        />
        <motion.path
          d="M83 44 L92 56 L100 43"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.1 }}
        />
      </motion.g>
    </motion.svg>
  );
}

export function CountScreen({ state, dispatch }: Props) {
  const [pulled, setPulled] = useState(false);
  const [done, setDone] = useState(false);
  // Reels follow body order, not tap order, so the machine always reads the same way.
  const order = MUSCLES.filter((m) => state.muscles.includes(m));

  let hint = 'Pull the lever';
  if (done) hint = `${state.total} exercises locked in`;
  else if (pulled) hint = '';

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>How many of each?</h1>
      <div className={styles.cabinet}>
        <AnimatePresence>{!pulled && <PullArrow />}</AnimatePresence>
        <SlotReels counts={state.counts} order={order} spinning={pulled} onDone={() => setDone(true)} />
        <Lever disabled={pulled} onPull={() => setPulled(true)} />
      </div>
      <p className={styles.hint}>{hint}</p>
      {done && (
        <button className="continue" onClick={() => dispatch({ type: 'next' })} aria-label="Continue to the cases">
          Go
        </button>
      )}
    </div>
  );
}
