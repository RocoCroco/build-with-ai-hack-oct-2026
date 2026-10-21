import { animate } from 'motion/react';
import { useEffect, useState } from 'react';
import { MUSCLE_LABELS, MUSCLES, type Muscle } from '../data/exercises';
import { radarPoints } from '../lib/stats';
import styles from './RadarChart.module.css';

const CX = 120;
const CY = 112;
const R = 74;
const RINGS = [0.25, 0.5, 0.75, 1];

const path = (points: [number, number][]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

interface Props {
  perMuscle: Record<Muscle, number>;
  /** Grow the shape out from the middle when it first shows. */
  play: boolean;
}

/** Seven corners, one per group, scaled to the most-trained group: how balanced the training is. */
export function RadarChart({ perMuscle, play }: Props) {
  const [progress, setProgress] = useState(play ? 0 : 1);
  useEffect(() => {
    if (!play) return;
    const controls = animate(0, 1, { type: 'spring', stiffness: 90, damping: 14, onUpdate: setProgress });
    return () => controls.stop();
  }, [play]);

  const most = Math.max(...MUSCLES.map((m) => perMuscle[m]));
  // Even an untrained group keeps a sliver, so the shape never collapses to a line.
  const values = MUSCLES.map((m) => (most > 0 ? Math.max(0.04, perMuscle[m] / most) : 0) * progress);
  const corners = radarPoints(values, CX, CY, R);
  const axes = radarPoints(MUSCLES.map(() => 1), CX, CY, R);
  const labels = radarPoints(MUSCLES.map(() => 1), CX, CY, R + 22);

  return (
    <svg className={styles.chart} viewBox="0 0 240 224" role="img" aria-label="Sets per muscle group">
      {RINGS.map((ring) => (
        <polygon key={ring} className={styles.ring} points={path(radarPoints(MUSCLES.map(() => ring), CX, CY, R))} />
      ))}
      {axes.map(([x, y], i) => (
        <line key={i} className={styles.axis} x1={CX} y1={CY} x2={x} y2={y} />
      ))}
      {most > 0 && <polygon className={styles.shape} points={path(corners)} />}
      {most > 0 &&
        corners.map(([x, y], i) => <circle key={i} className={styles.dot} data-muscle={MUSCLES[i]} cx={x} cy={y} r={4} />)}
      {labels.map(([x, y], i) => {
        const m = MUSCLES[i];
        return (
          <text key={m} className={styles.label} data-muscle={m} x={x} y={y} textAnchor="middle">
            <tspan x={x} dy="-0.1em">
              {MUSCLE_LABELS[m]}
            </tspan>
            <tspan className={styles.count} x={x} dy="1.1em">
              {perMuscle[m]}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
