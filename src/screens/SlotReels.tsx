import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react';
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { MUSCLE_LABELS, type Muscle } from '../data/exercises';
import { randomInt } from '../lib/draw';
import { useReduceAnimations } from '../lib/motionPrefs';
import { playReelStop, playTick } from '../lib/sound';
import styles from './SlotReels.module.css';

const LENGTH = 26;
const WIN_INDEX = 22; // where the decided count sits in the strip
const GAP = 12;

/** Few reels get big windows; many wrap onto two rows of smaller ones. */
function reelSize(reels: number, width: number) {
  const perRow = reels <= 4 ? reels : Math.ceil(reels / 2);
  const reelWidth = Math.min(210, Math.floor((width - (perRow - 1) * GAP) / perRow));
  // Tall windows, like real slot reels
  const cell = Math.round(Math.min(reelWidth * 1.45, 280));
  return { reelWidth, cell };
}

interface ReelProps {
  muscle: Muscle;
  count: number;
  maxCount: number;
  cell: number;
  spinning: boolean;
  delay: number;
  duration: number;
  onStop: () => void;
}

function Reel({ muscle, count, maxCount, cell, spinning, delay, duration, onStop }: ReelProps) {
  // Random numbers around the decided count, fixed for the life of the reel.
  // The first slot is a "?" so the reel shows nothing until the lever is pulled.
  const [strip] = useState(() => {
    const s: (number | null)[] = Array.from({ length: LENGTH }, () => randomInt(0, maxCount));
    s[0] = null;
    s[WIN_INDEX] = count;
    return s;
  });
  const [stopped, setStopped] = useState(false);
  const y = useMotionValue(0);
  const lastIndex = useRef(0);
  const stop = useEffectEvent(() => {
    setStopped(true);
    playReelStop();
    onStop();
  });

  useMotionValueEvent(y, 'change', (latest) => {
    const index = Math.round(-latest / cell);
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      playTick();
    }
  });

  useEffect(() => {
    if (!spinning) return;
    const end = -WIN_INDEX * cell;
    const controls = animate(y, [0, end - cell * 0.12, end], {
      delay,
      duration,
      times: [0, 0.9, 1],
      ease: [[0.25, 0.46, 0.45, 0.94], [0.45, 0, 0.25, 1]],
    });
    let cancelled = false;
    controls.then(() => {
      if (!cancelled) stop();
    });
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [y, cell, spinning, delay, duration]);

  return (
    <div className={styles.reel} data-muscle={muscle} data-dropped={(stopped && count === 0) || undefined}>
      <div className={styles.window}>
        <motion.div className={styles.strip} style={{ y }}>
          {strip.map((n, i) => (
            <motion.span
              key={i}
              className={styles.number}
              style={{ height: cell }}
              animate={stopped && i === WIN_INDEX ? { scale: [1, 1.25, 1] } : undefined}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {n ?? '?'}
            </motion.span>
          ))}
        </motion.div>
      </div>
      <span className={styles.label}>{MUSCLE_LABELS[muscle]}</span>
      <span className={styles.dropped} aria-hidden={!(stopped && count === 0)}>
        {stopped && count === 0 ? 'Dropped' : ''}
      </span>
    </div>
  );
}

interface Props {
  counts: Partial<Record<Muscle, number>>;
  order: readonly Muscle[];
  /** The reels wait on "?" until this turns true (the lever is pulled). */
  spinning: boolean;
  onDone: () => void;
}

/** One reel per chosen group; each spins and stops on its decided count, left to right. */
export function SlotReels({ counts, order, spinning, onDone }: Props) {
  const reduce = useReduceAnimations();
  const stoppedCount = useRef(0);
  const machineRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const total = order.reduce((sum, m) => sum + (counts[m] ?? 0), 0);
  const maxCount = Math.max(total, 3);

  // Reel sizes come from the space actually available, measured before the first paint.
  useLayoutEffect(() => {
    setWidth(machineRef.current!.clientWidth);
  }, []);

  const { reelWidth, cell } = reelSize(order.length, width);
  const size = { '--reel-w': `${reelWidth}px`, '--cell': `${cell}px`, '--gap': `${GAP}px` } as CSSProperties;

  return (
    <div ref={machineRef} className={styles.machine} style={size} role="list" aria-label="Exercises per muscle">
      {width > 0 &&
        order.map((m, i) => (
          <Reel
            key={m}
            muscle={m}
            count={counts[m] ?? 0}
            maxCount={maxCount}
            cell={cell}
            spinning={spinning}
            delay={0.05}
            duration={reduce ? 0.45 + i * 0.1 : 1.6 + i * 0.4}
            onStop={() => {
              stoppedCount.current++;
              if (stoppedCount.current === order.length) onDone();
            }}
          />
        ))}
    </div>
  );
}
