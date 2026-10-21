import { MUSCLES, type Muscle } from '../data/exercises';
import { setsByMuscle, type WorkoutRecord } from './workout';

export interface Summary {
  workouts: number;
  totalMs: number;
  sets: number;
  perMuscle: Record<Muscle, number>;
}

export function summarize(history: readonly WorkoutRecord[]): Summary {
  const perMuscle = setsByMuscle(history);
  return {
    workouts: history.length,
    totalMs: history.reduce((sum, r) => sum + Math.max(0, r.finishedAt - r.startedAt), 0),
    sets: MUSCLES.reduce((sum, m) => sum + perMuscle[m], 0),
    perMuscle,
  };
}

/**
 * How built up a group looks, from 0 (never trained) toward 1. Early sets show quickly,
 * later ones less, so the stickman keeps growing without ever maxing out.
 * 30 sets ≈ 0.5, 100 sets ≈ 0.9.
 */
export function growth(sets: number): number {
  return 1 - Math.exp(-Math.max(0, sets) / 43);
}

/**
 * Corners of a radar chart: one per value (0–1), the first at the top, going clockwise.
 */
export function radarPoints(values: readonly number[], cx: number, cy: number, radius: number): [number, number][] {
  return values.map((v, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / values.length;
    return [cx + Math.cos(angle) * radius * v, cy + Math.sin(angle) * radius * v];
  });
}

/** 9_000_000 ms → "2 h 30"; under an hour → "45 min". */
export function formatTotal(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}
