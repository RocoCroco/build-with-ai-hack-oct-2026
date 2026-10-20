import { EXERCISES, type Exercise, type Muscle, type Place } from '../data/exercises';

export interface DrawnExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
}

export type Group = Muscle | 'any';

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Every exercise that fits the group and place (Home = bodyweight only). */
export function poolFor(group: Group, place: Place): Exercise[] {
  return EXERCISES.filter(
    (e) => (group === 'any' || e.muscle === group) && (place === 'gym' || e.bodyweight),
  );
}

/**
 * Picks the result of one case opening: a random exercise from the pool that hasn't
 * been drawn yet, with sets and reps inside its ranges. Returns null if the pool is empty.
 */
export function drawExercise(
  group: Group,
  place: Place,
  alreadyDrawn: readonly DrawnExercise[],
): DrawnExercise | null {
  const taken = new Set(alreadyDrawn.map((d) => d.exercise.id));
  const pool = poolFor(group, place).filter((e) => !taken.has(e.id));
  if (pool.length === 0) return null;
  const exercise = pick(pool);
  return {
    exercise,
    sets: randomInt(...exercise.sets),
    reps: randomInt(...exercise.reps),
  };
}
