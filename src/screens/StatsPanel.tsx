import { motion, type PanInfo } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useReduceAnimations } from '../lib/motionPrefs';
import type { Muscle } from '../data/exercises';
import { formatTotal, type Summary } from '../lib/stats';
import { MuscleMan } from './MuscleMan';
import { RadarChart } from './RadarChart';
import styles from './StatsPanel.module.css';

const PAGES = ['Muscles', 'Balance'] as const;

/** The Start screen's stats: swipe (or tap the tabs) between the stickman and the chart. */
interface Props {
  summary: Summary;
  before: Record<Muscle, number>; // sets per group before the newest workout
  fresh: readonly Muscle[]; // groups the newest workout trained, if not celebrated yet
}

export function StatsPanel({ summary, before, fresh }: Props) {
  const reduce = useReduceAnimations();
  const [page, setPage] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function onDragEnd(_: unknown, info: PanInfo) {
    // A short flick is enough; a slow drag needs to pass a third of the way.
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (swipe < -width / 3) setPage(Math.min(page + 1, PAGES.length - 1));
    else if (swipe > width / 3) setPage(Math.max(page - 1, 0));
  }

  return (
    <section className={styles.panel} aria-label="Your training">
      <div className={styles.tabs} role="tablist">
        {PAGES.map((name, i) => (
          <button key={name} role="tab" aria-selected={page === i} className={styles.tab} onClick={() => setPage(i)}>
            {page === i && <motion.span layoutId="stats-tab" className={styles.pill} transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <span className={styles.tabLabel}>{name}</span>
          </button>
        ))}
      </div>

      <div ref={viewport} className={styles.viewport}>
        <motion.div
          className={styles.track}
          drag="x"
          dragConstraints={{ left: -width * (PAGES.length - 1), right: 0 }}
          dragElastic={0.12}
          onDragEnd={onDragEnd}
          animate={{ x: -page * width }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        >
          <div className={styles.page}>
            <div className={styles.man}>
              <MuscleMan before={before} after={summary.perMuscle} celebrate={fresh} animate={!reduce} />
            </div>
          </div>
          <div className={styles.page}>
            {/* Re-keyed so the chart grows again each time it's shown */}
            <RadarChart
              key={page === 1 ? 'shown' : 'hidden'}
              before={before}
              after={summary.perMuscle}
              fresh={fresh}
              play={page === 1 && !reduce}
            />
          </div>
        </motion.div>
      </div>

      <dl className={styles.totals}>
        <div>
          <dt>Workouts</dt>
          <dd>{summary.workouts}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTotal(summary.totalMs)}</dd>
        </div>
        <div>
          <dt>Sets</dt>
          <dd>{summary.sets}</dd>
        </div>
      </dl>
    </section>
  );
}
