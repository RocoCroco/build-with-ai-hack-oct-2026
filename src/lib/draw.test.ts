import { describe, expect, it } from 'vitest';
import { EXERCISES, MUSCLES } from '../data/exercises';
import { drawExercise, poolFor, type DrawnExercise } from './draw';

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
