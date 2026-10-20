import { EXERCISES, WARMUPS, type Exercise, type Muscle, type Place, type Warmup } from '../data/exercises';

export interface DrawnExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
}

export type Group = Muscle | 'any';

/** The warm-up roll: any warm-up, or "No warm-up", each equally likely. */
export function drawWarmup(): Warmup | 'none' {
  return pick<Warmup | 'none'>([...WARMUPS, 'none']);
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** How many exercises the chosen time allows. Rough ranges, tuned while testing. */
export function exerciseCountFor(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 20) return 3;
  if (minutes <= 35) return 4;
  if (minutes <= 50) return 5;
  if (minutes <= 75) return 6;
  if (minutes <= 100) return 7;
  return 8;
}

/** Every exercise that fits the group and place (Home = bodyweight only). */
export function poolFor(group: Group, place: Place): Exercise[] {
  return EXERCISES.filter(
    (e) => (group === 'any' || e.muscle === group) && (place === 'gym' || e.bodyweight),
  );
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Splits `total` exercises across the chosen groups. More groups than exercises → `total`
 * random groups get 1 and the rest are dropped (0). Otherwise every group gets 1 and the
 * remainder is spread at random. No group gets more than its pool has; if the pools can't
 * cover the total, the total shrinks. Every chosen group appears in the result, 0 or not.
 */
export function planCounts(groups: readonly Muscle[], total: number, place: Place): Record<Muscle, number> {
  const counts = Object.fromEntries(groups.map((g) => [g, 0])) as Record<Muscle, number>;
  const caps = Object.fromEntries(groups.map((g) => [g, poolFor(g, place).length])) as Record<Muscle, number>;
  const order = shuffle(groups);
  let left = total;
  // One each first, in random order, so dropped groups are random.
  for (const g of order) {
    if (left === 0) break;
    if (caps[g] > 0) {
      counts[g] = 1;
      left--;
    }
  }
  // Spread the rest one at a time among groups that still have room.
  while (left > 0) {
    const open = groups.filter((g) => counts[g] > 0 && counts[g] < caps[g]);
    if (open.length === 0) break;
    counts[pick(open)]++;
    left--;
  }
  return counts;
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
