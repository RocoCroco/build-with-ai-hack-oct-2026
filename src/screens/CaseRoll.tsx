import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react';
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import type { Muscle } from '../data/exercises';
import { pick } from '../lib/draw';
import { useReduceAnimations } from '../lib/motionPrefs';
import { playLand, playTick } from '../lib/sound';
import styles from './CaseRoll.module.css';

export interface RollItem {
  id: string;
  label: string;
  muscle?: Muscle;
  /** A special item, shown as a gold card (like a rare drop). */
  gold?: boolean;
}

const ITEM_WIDTH = 132;
const GAP = 8;
const STEP = ITEM_WIDTH + GAP;
const LENGTH = 62;
const WIN_INDEX = 58; // where the result sits in the strip
const START_INDEX = 2; // the item centered under the marker before the roll

/** Random filler around a fixed winning slot. The result is decided before this runs. */
function buildStrip(pool: RollItem[], result: RollItem | null): RollItem[] {
  const strip = Array.from({ length: LENGTH }, () => pick(pool));
  if (result) strip[WIN_INDEX] = result;
  return strip;
}

/** The strip offset that puts item `index` under the center marker. */
function offsetFor(index: number, viewportWidth: number) {
  return viewportWidth / 2 - index * STEP - ITEM_WIDTH / 2;
}

interface Props {
  pool: RollItem[];
  /** null shows an idle strip; a result spins the strip and lands on it. */
  result: RollItem | null;
  onDone?: () => void;
}

/** Remount with a new `key` for each roll. */
export function CaseRoll({ pool, result, onDone }: Props) {
  // Both are fixed for the life of this roll, so re-renders never restart it.
  const [strip] = useState(() => buildStrip(pool, result));
  const [spins] = useState(result !== null);
  const [landed, setLanded] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const lastIndex = useRef(START_INDEX);
  const reduce = useReduceAnimations();
  const finish = useEffectEvent(() => {
    setLanded(true);
    playLand();
    onDone?.();
  });

  // Tick whenever a new item crosses the center marker.
  useMotionValueEvent(x, 'change', (latest) => {
    const width = viewportRef.current?.clientWidth ?? 0;
    const index = Math.floor((width / 2 - latest) / STEP);
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      playTick();
    }
  });

  // Park the strip before the first paint so it never flashes at x = 0.
  useLayoutEffect(() => {
    x.jump(offsetFor(START_INDEX, viewportRef.current!.clientWidth));
  }, [x]);

  useEffect(() => {
    if (!spins) return;
    const width = viewportRef.current!.clientWidth;
    const start = offsetFor(START_INDEX, width);
    // Land somewhere inside the winning item, not dead center, like a real case opening.
    const jitter = (Math.random() - 0.5) * ITEM_WIDTH * 0.7;
    const stop = offsetFor(WIN_INDEX, width) + jitter;
    const overshoot = 16;

    // Spins even with the OS reduced-motion setting (learner decision); the app's own
    // "Reduce animations" switch makes it a quick slide onto the result instead.
    const controls = reduce
      ? animate(x, [start, stop], { duration: 0.6, ease: [0.23, 1, 0.32, 1] })
      : animate(x, [start, stop - overshoot, stop], {
          duration: 5.2,
          times: [0, 0.92, 1],
          // Steady deceleration (ease-out quad) so cards keep crossing the marker, and ticking,
          // almost until the stop; then a short settle back from the overshoot.
          ease: [[0.25, 0.46, 0.45, 0.94], [0.45, 0, 0.25, 1]],
        });

    let cancelled = false;
    controls.then(() => {
      if (!cancelled) finish();
    });
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [x, spins, reduce]);

  return (
    <div ref={viewportRef} className={styles.viewport} aria-live="polite">
      <motion.div className={styles.strip} style={{ x }}>
        {strip.map((item, i) => {
          const isWinner = landed && i === WIN_INDEX;
          return (
            <motion.div
              key={i}
              className={styles.item}
              data-muscle={item.muscle}
              data-winner={isWinner || undefined}
              data-gold={item.gold || undefined}
              // The winner pops up and gives a quick shake when the roll lands.
              animate={isWinner ? { scale: [1, 1.2, 1.1], y: -4, rotate: [0, -4, 4, -3, 2, 0] } : undefined}
              transition={{
                scale: { duration: 0.45, times: [0, 0.4, 1], ease: 'easeOut' },
                y: { type: 'spring', stiffness: 420, damping: 18 },
                rotate: { duration: 0.5, ease: 'easeInOut' },
              }}
              style={{ width: ITEM_WIDTH, marginRight: GAP }}
            >
              <span className={styles.label}>{item.label}</span>
            </motion.div>
          );
        })}
      </motion.div>
      <div className={styles.marker} aria-hidden />
      {landed && result && <span className={styles.srOnly}>Landed on {result.label}</span>}
    </div>
  );
}
