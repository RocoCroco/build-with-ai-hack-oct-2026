import { animate } from 'motion/react';
import { useEffect, useState } from 'react';
import { MUSCLE_LABELS, MUSCLES, type Muscle } from '../data/exercises';
import { growth, radarPoints } from '../lib/stats';
import styles from './RadarChart.module.css';

const CX = 120;
const CY = 112;
const R = 74;
const RINGS = [0.25, 0.5, 0.75, 1];

const path = (points: [number, number][]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

interface Props {
  before: Record<Muscle, number>;
  after: Record<Muscle, number>;
  /** Groups the newest workout trained: they grow from before to after and get a "+sets" badge. */
  fresh: readonly Muscle[];
  /** Animate when shown; otherwise draw the final shape straight away. */
  play: boolean;
}

/**
 * Seven corners, one per group, on the same growth curve as the stickman's muscles:
 * a first workout is a small shape near the middle, and it fills out over many workouts.
 */
export function RadarChart({ before, after, fresh, play }: Props) {
  const [progress, setProgress] = useState(play ? 0 : 1);
  useEffect(() => {
    if (!play) return;
    const controls = animate(0, 1, { type: 'spring', stiffness: 70, damping: 14, delay: 0.15, onUpdate: setProgress });
    return () => controls.stop();
  }, [play]);

  const anything = MUSCLES.some((m) => after[m] > 0);
  // New growth starts from where it was; a plain visit grows the whole shape out from the middle.
  const values = MUSCLES.map((m) => {
    const from = fresh.length ? growth(before[m]) : 0;
    return Math.max(0.03, from + (growth(after[m]) - from) * progress);
  });
  const corners = radarPoints(values, CX, CY, R);
  const axes = radarPoints(MUSCLES.map(() => 1), CX, CY, R);
  const labels = radarPoints(MUSCLES.map(() => 1), CX, CY, R + 22);

  return (
    <svg className={styles.chart} viewBox="0 0 240 224" role="img" aria-label="How built up each muscle group is">
      {RINGS.map((ring) => (
        <polygon key={ring} className={styles.ring} points={path(radarPoints(MUSCLES.map(() => ring), CX, CY, R))} />
      ))}
      {axes.map(([x, y], i) => (
        <line key={i} className={styles.axis} x1={CX} y1={CY} x2={x} y2={y} />
      ))}
      {anything && <polygon className={styles.shape} points={path(corners)} />}
      {anything &&
        corners.map(([x, y], i) => {
          const m = MUSCLES[i];
          const grew = fresh.includes(m);
          return (
            <circle key={m} className={styles.dot} data-muscle={m} data-grew={grew || undefined} cx={x} cy={y} r={grew ? 5 : 4} />
          );
        })}
      {labels.map(([x, y], i) => {
        const m = MUSCLES[i];
        const gained = after[m] - before[m];
        return (
          <text key={m} className={styles.label} data-muscle={m} x={x} y={y} textAnchor="middle">
            <tspan x={x} dy="-0.1em">
              {MUSCLE_LABELS[m]}
            </tspan>
            <tspan className={styles.count} x={x} dy="1.1em">
              {after[m]}
              {fresh.includes(m) && gained > 0 && <tspan className={styles.gain}> +{gained}</tspan>}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
