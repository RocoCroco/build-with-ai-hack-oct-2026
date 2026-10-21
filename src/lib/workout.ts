import { MUSCLES, type Muscle, type Place } from '../data/exercises';
import type { DrawnExercise } from './draw';

/** One step of a workout: the warm-up (a single tick) or an exercise with its sets. */
export interface WorkoutItem {
  id: string;
  name: string;
  muscle?: Muscle; // the warm-up has none
  sets: number;
  reps?: number;
  done: number; // sets ticked so far
}

/** A workout in progress. Times are epoch milliseconds so a reload keeps the clock right. */
export interface WorkoutRun {
  startedAt: number;
  index: number; // the item on screen
  items: WorkoutItem[];
}

/** A finished workout, as kept in the history. */
export interface WorkoutRecord {
  id: string;
  startedAt: number;
  finishedAt: number;
  place: Place;
  items: WorkoutItem[];
}

export function startRun(warmup: { id: string; name: string } | 'none' | null, drawn: DrawnExercise[], now: number): WorkoutRun {
  const items: WorkoutItem[] = [];
  if (warmup && warmup !== 'none') items.push({ id: warmup.id, name: warmup.name, sets: 1, done: 0 });
  for (const { exercise, sets, reps } of drawn) {
    items.push({ id: exercise.id, name: exercise.name, muscle: exercise.muscle, sets, reps, done: 0 });
  }
  return { startedAt: now, index: 0, items };
}

/** Tapping a set ticks it and every set before it; tapping a ticked set unticks it and the ones after. */
export function tapSet(item: WorkoutItem, set: number): WorkoutItem {
  return { ...item, done: set < item.done ? set : set + 1 };
}

export const isComplete = (item: WorkoutItem) => item.done >= item.sets;

export function recordFrom(run: WorkoutRun, place: Place, now: number): WorkoutRecord {
  return { id: `${run.startedAt}`, startedAt: run.startedAt, finishedAt: now, place, items: run.items };
}

/** Sets finished per muscle group across workouts; groups never trained are 0. */
export function setsByMuscle(history: readonly WorkoutRecord[]): Record<Muscle, number> {
  const totals = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const record of history) {
    for (const item of record.items) if (item.muscle) totals[item.muscle] += item.done;
  }
  return totals;
}

/** 754_000 ms → "12:34"; over an hour → "1:02:05". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
