import { describe, expect, it } from 'vitest';
import { EXERCISES, MUSCLES, type Muscle } from '../data/exercises';
import { drawExercise, planCounts, poolFor, shuffle, type DrawnExercise } from './draw';

function drawMany(count: number, group: Parameters<typeof drawExercise>[0], place: 'gym' | 'home') {
  const drawn: DrawnExercise[] = [];
  for (let i = 0; i < count; i++) {
    const next = drawExercise(group, place, drawn);
    if (next) drawn.push(next);
  }
  return drawn;
}

describe('exercise data', () => {
  it('has unique ids and every group has gym and home options', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const m of MUSCLES) {
      expect(poolFor(m, 'gym').length).toBeGreaterThanOrEqual(8);
      expect(poolFor(m, 'home').length).toBeGreaterThanOrEqual(2);
    }
  });
});

const sum = (counts: Record<string, number>) => Object.values(counts).reduce((a, b) => a + b, 0);

describe('planCounts', () => {
  it('always sums to the total', () => {
    for (let run = 0; run < 300; run++) {
      const groups = shuffle(MUSCLES).slice(0, 1 + (run % 7));
      for (const total of [3, 4, 5, 6, 7, 8]) {
        const counts = planCounts(groups, total, 'gym');
        expect(sum(counts)).toBe(total);
        expect(Object.keys(counts).sort()).toEqual([...groups].sort());
      }
    }
  });

  it('drops groups at random when there are more groups than exercises', () => {
    const kept = new Set<string>();
    for (let run = 0; run < 300; run++) {
      const counts = planCounts(MUSCLES, 3, 'gym'); // 7 groups at 15 min
      const values = Object.values(counts);
      expect(values.filter((v) => v === 1)).toHaveLength(3);
      expect(values.filter((v) => v === 0)).toHaveLength(4);
      for (const [g, v] of Object.entries(counts)) if (v) kept.add(g);
    }
    expect(kept.size).toBe(7); // every group gets kept sometimes
  });

  it('gives every group at least one when there is room', () => {
    for (let run = 0; run < 200; run++) {
      const counts = planCounts(['chest', 'legs'], 6, 'gym');
      expect(counts.chest).toBeGreaterThanOrEqual(1);
      expect(counts.legs).toBeGreaterThanOrEqual(1);
    }
  });

  it('never repeats an exercise across a whole draw', () => {
    for (let run = 0; run < 200; run++) {
      const counts = planCounts(['chest', 'back', 'legs'], 8, 'gym');
      const drawn: DrawnExercise[] = [];
      for (const [g, n] of Object.entries(counts)) {
        for (let i = 0; i < n; i++) {
          const d = drawExercise(g as Muscle, 'gym', drawn);
          expect(d).not.toBeNull();
          drawn.push(d!);
        }
      }
      expect(new Set(drawn.map((d) => d.exercise.id)).size).toBe(8);
    }
  });
});

describe('drawExercise', () => {
  it('never repeats an exercise within one workout', () => {
    for (let run = 0; run < 200; run++) {
      const drawn = drawMany(8, 'any', 'gym');
      expect(drawn).toHaveLength(8);
      expect(new Set(drawn.map((d) => d.exercise.id)).size).toBe(8);
    }
  });

  it('picks sets and reps within the exercise ranges', () => {
    for (let run = 0; run < 200; run++) {
      for (const d of drawMany(4, 'any', 'gym')) {
        const { sets, reps } = d.exercise;
        expect(d.sets).toBeGreaterThanOrEqual(sets[0]);
        expect(d.sets).toBeLessThanOrEqual(sets[1]);
        expect(d.reps).toBeGreaterThanOrEqual(reps[0]);
        expect(d.reps).toBeLessThanOrEqual(reps[1]);
      }
    }
  });

  it('stays inside the requested group', () => {
    for (const d of drawMany(5, 'legs', 'gym')) expect(d.exercise.muscle).toBe('legs');
  });

  it('returns null once a pool runs out instead of repeating', () => {
    const size = poolFor('biceps', 'home').length;
    const drawn = drawMany(size, 'biceps', 'home');
    expect(drawn).toHaveLength(size);
    expect(drawExercise('biceps', 'home', drawn)).toBeNull();
  });
});
