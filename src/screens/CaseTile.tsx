import { motion, type Variants } from 'motion/react';
import type { Muscle } from '../data/exercises';
import styles from './CaseTile.module.css';

export type CaseState = 'ready' | 'open' | 'revealed';

interface Props {
  state: CaseState;
  /** Set once revealed: fills the inside with the group's plate color. */
  muscle?: Muscle;
  label: string;
  onTap: () => void;
  /** Called when the lid finishes opening; the roll starts then. */
  onOpened: () => void;
}

// Front view of a chest. Opening is two moves, like a real lid hinged at the back:
// the lid's front face tips back out of view, then its top rises upright behind the case.
const lidFront: Variants = {
  closed: { rotateX: 0, opacity: 1 },
  // Fades as it goes edge-on, or its seam would stay visible as a line along the rim.
  open: { rotateX: -90, opacity: 0, transition: { duration: 0.16, ease: 'easeIn', opacity: { delay: 0.1, duration: 0.06 } } },
};

const lidTop: Variants = {
  // Hidden while closed: lying flat, perspective would still show slivers at its corners.
  closed: { rotateX: 90, opacity: 0, scale: 1 },
  open: {
    rotateX: 0,
    opacity: 1,
    scale: 1,
    transition: { delay: 0.14, duration: 0.3, ease: [0.34, 1.56, 0.64, 1], opacity: { delay: 0.14, duration: 0 } },
  },
  // When the roll lands, the lid fades away and leaves the open case.
  gone: { rotateX: 0, opacity: 0, scale: 0.6, transition: { duration: 0.3, ease: 'easeOut' } },
};

export function CaseTile({ state, muscle, label, onTap, onOpened }: Props) {
  const lid = state === 'open' ? 'open' : state === 'revealed' ? 'gone' : 'closed';
  return (
    <motion.button
      className={styles.case}
      data-state={state}
      data-muscle={muscle}
      disabled={state !== 'ready'}
      onClick={onTap}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      {/* Paint order matters: the raised lid sits behind the rim, the closed lid in front of everything. */}
      <motion.span
        className={styles.lidTop}
        variants={lidTop}
        initial={false}
        animate={lid}
        onAnimationComplete={(name) => {
          if (name === 'open') onOpened();
        }}
      />
      <span className={styles.rim} />
      <span className={styles.inside} />
      <span className={styles.body} />
      <motion.span
        className={styles.lidFront}
        variants={lidFront}
        initial={false}
        animate={lid === 'closed' ? 'closed' : 'open'}
      />
      <span className={styles.latch} />
    </motion.button>
  );
}
