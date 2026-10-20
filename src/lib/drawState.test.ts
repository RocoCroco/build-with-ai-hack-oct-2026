import { describe, expect, it } from 'vitest';
import { drawReducer, initialState, type Action, type DrawState } from './drawState';

const run = (actions: Action[], from: DrawState = initialState) => actions.reduce(drawReducer, from);

describe('gym/home step', () => {
  it('comes after the muscles, goes back to them, and locks the draw on Continue', () => {
    const atPlace = run([
      { type: 'begin' },
      { type: 'setMinutes', minutes: 120 },
      { type: 'next' },
      { type: 'toggleMuscle', muscle: 'biceps' },
      { type: 'toggleMuscle', muscle: 'triceps' },
      { type: 'next' },
    ]);
    expect(atPlace.step).toBe('place');
    expect(drawReducer(atPlace, { type: 'back' }).step).toBe('muscles');

    const locked = run([{ type: 'setPlace', place: 'home' }, { type: 'next' }], atPlace);
    expect(locked.step).toBe('count');
    expect(locked.place).toBe('home');
    expect(locked.total).toBe(4); // 2 h asks for 8, but only 4 bodyweight arm exercises exist
    // Once rolling starts, Back does nothing.
    expect(drawReducer(locked, { type: 'back' })).toBe(locked);
  });
});
