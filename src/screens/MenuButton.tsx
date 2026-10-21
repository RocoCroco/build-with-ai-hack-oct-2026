import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import styles from './MenuButton.module.css';

interface Props {
  reduceAnimations: boolean;
  onReduceAnimations: (on: boolean) => void;
  /** Only during the rolls; leave out elsewhere. */
  onStartOver?: () => void;
  /** Only on Start. */
  onLibrary?: () => void;
}

/** The corner menu: the reduce-animations setting, and abandoning the draw during the rolls. */
export function MenuButton({ reduceAnimations, onReduceAnimations, onStartOver, onLibrary }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // A tap anywhere else, or Escape, closes the menu.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        className={styles.button}
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 20 20" aria-hidden>
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.menu}
            role="menu"
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            <button
              className={styles.item}
              role="menuitemcheckbox"
              aria-checked={reduceAnimations}
              onClick={() => onReduceAnimations(!reduceAnimations)}
            >
              <span className={styles.row}>
                Reduce animations
                <span className={styles.switch} data-on={reduceAnimations || undefined} aria-hidden />
              </span>
              <span className={styles.note}>Rolls land fast instead of spinning</span>
            </button>
            {onLibrary && (
              <button
                className={styles.item}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onLibrary();
                }}
              >
                Exercise library
                <span className={styles.note}>Every exercise and how to do it</span>
              </button>
            )}
            {onStartOver && (
              <button className={styles.item} role="menuitem" onClick={onStartOver}>
                Start over
                <span className={styles.note}>This draw is thrown away</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
