import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { Place } from '../data/exercises';
import { playSwitch } from '../lib/sound';
import styles from './NeonSwitch.module.css';

const TRAVEL = 64; // how far the handle slides between GYM (up) and HOME (down)

interface Props {
  place: Place;
  onChange: (place: Place) => void;
}

/** A neon tube sign: unlit glass always there, the lit tube on top flickering on when it's chosen. */
function Sign({ text, lit, tone, onPick }: { text: string; lit: boolean; tone: Place; onPick: () => void }) {
  return (
    <button className={styles.sign} data-tone={tone} data-lit={lit || undefined} onClick={onPick} tabIndex={-1} aria-hidden>
      <span className={styles.glass}>{text}</span>
      {/* Mounted each time it lights, so the flicker plays again */}
      {lit && (
        <span className={styles.tube}>
          {[...text].map((ch, i) => (
            // One letter is a little loose in its socket and blinks now and then.
            <span key={i} className={i === 1 ? styles.loose : undefined}>
              {ch}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

/** GYM over HOME with a chunky toggle between them. Tap the toggle or a sign, or slide the handle. */
export function NeonSwitch({ place, onChange }: Props) {
  const y = useMotionValue(place === 'home' ? TRAVEL : 0);
  // Where the press started: a press that moved is a drag, not also a tap.
  const pressY = useRef(0);

  // The handle snaps to whichever side is chosen.
  useEffect(() => {
    const controls = animate(y, place === 'home' ? TRAVEL : 0, { type: 'spring', stiffness: 700, damping: 30 });
    return () => controls.stop();
  }, [y, place]);

  function choose(next: Place) {
    if (next === place) return;
    playSwitch();
    onChange(next);
  }

  return (
    <div className={styles.panel}>
      <Sign text="GYM" tone="gym" lit={place === 'gym'} onPick={() => choose('gym')} />

      <motion.button
        className={styles.toggle}
        role="switch"
        aria-checked={place === 'home'}
        aria-label="Train at home (bodyweight only)"
        onPointerDown={(e) => (pressY.current = e.clientY)}
        onClick={(e) => {
          // detail 0 is Enter or Space, which has no pointer position
          if (e.detail !== 0 && Math.abs(e.clientY - pressY.current) > 4) return;
          choose(place === 'gym' ? 'home' : 'gym');
        }}
      >
        <span className={styles.slot} />
        <motion.span
          className={styles.handle}
          style={{ y }}
          drag="y"
          dragConstraints={{ top: 0, bottom: TRAVEL }}
          dragElastic={0.08}
          dragMomentum={false}
          onDragEnd={() => {
            const next = y.get() > TRAVEL / 2 ? 'home' : 'gym';
            if (next !== place) choose(next);
            else animate(y, place === 'home' ? TRAVEL : 0, { type: 'spring', stiffness: 700, damping: 30 });
          }}
        />
      </motion.button>

      <Sign text="HOME" tone="home" lit={place === 'home'} onPick={() => choose('home')} />
    </div>
  );
}
