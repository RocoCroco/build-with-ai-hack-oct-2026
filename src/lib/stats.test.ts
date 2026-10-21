import { describe, expect, it } from 'vitest';
import { formatTotal, growth, radarPoints, summarize } from './stats';
import type { WorkoutRecord } from './workout';

const workout = (minutes: number, chestSets: number, legSets: number): WorkoutRecord => ({
  id: `${minutes}`,
  startedAt: 0,
  finishedAt: minutes * 60_000,
  place: 'gym',
  items: [
    { id: 'jumping-jacks', name: 'Jumping jacks', sets: 1, done: 1 },
    { id: 'bench-press', name: 'Bench', muscle: 'chest', sets: chestSets, reps: 8, done: chestSets },
    { id: 'back-squat', name: 'Squat', muscle: 'legs', sets: legSets, reps: 8, done: legSets },
  ],
});

describe('summarize', () => {
  it('adds up workouts, time and sets per group, ignoring the warm-up', () => {
    const s = summarize([workout(40, 4, 3), workout(50, 3, 0)]);
    expect(s.workouts).toBe(2);
    expect(s.totalMs).toBe(90 * 60_000);
    expect(s.sets).toBe(10);
    expect(s.perMuscle).toMatchObject({ chest: 7, legs: 3, back: 0 });
    expect(summarize([]).sets).toBe(0);
  });
});

describe('growth', () => {
  it('starts at 0, rises with sets, and never reaches 1', () => {
    expect(growth(0)).toBe(0);
    expect(growth(30)).toBeGreaterThan(0.45);
    expect(growth(30)).toBeLessThan(growth(60));
    expect(growth(1000)).toBeLessThan(1.0000001);
  });
});

describe('radarPoints', () => {
  it('puts the first corner at the top and spreads seven evenly', () => {
    const points = radarPoints([1, 1, 1, 1, 1, 1, 1], 100, 100, 50);
    expect(points[0][0]).toBeCloseTo(100);
    expect(points[0][1]).toBeCloseTo(50);
    expect(points[1][0]).toBeGreaterThan(100); // clockwise
    expect(radarPoints([0], 100, 100, 50)[0]).toEqual([100, 100]);
  });
});

describe('formatTotal', () => {
  it('shows minutes, or hours and minutes', () => {
    expect(formatTotal(45 * 60_000)).toBe('45 min');
    expect(formatTotal(150 * 60_000)).toBe('2 h 30');
  });
});
