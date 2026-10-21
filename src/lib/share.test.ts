import { describe, expect, it } from 'vitest';
import { EXERCISES, WARMUPS } from '../data/exercises';
import { planText } from './share';

const bench = EXERCISES.find((e) => e.id === 'bench-press')!;
const curl = EXERCISES.find((e) => e.id === 'db-curl')!;
const drawn = [
  { exercise: bench, sets: 4, reps: 8 },
  { exercise: curl, sets: 3, reps: 12 },
];

describe('planText', () => {
  it('lists the setup, the warm-up, and each exercise with sets × reps', () => {
    const text = planText({ minutes: 63, place: 'gym', warmup: WARMUPS[0], drawn });
    expect(text.split('\n')).toEqual([
      'My workout · 1 h 03 · Gym',
      '',
      `Warm-up: ${WARMUPS[0].name}`,
      'Barbell bench press (Chest): 4 × 8',
      'Dumbbell curl (Biceps): 3 × 12',
      '',
      'Drawn with Workout Draw 🎰',
    ]);
  });

  it('leaves out the warm-up line for "No warm-up"', () => {
    const text = planText({ minutes: 45, place: 'home', warmup: 'none', drawn });
    expect(text).not.toContain('Warm-up');
    expect(text).toContain('45 min · Home');
  });
});
