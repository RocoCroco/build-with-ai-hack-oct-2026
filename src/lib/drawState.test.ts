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
    expect(locked.step).toBe('warmup');
    expect(locked.place).toBe('home');
    expect(locked.total).toBe(4); // 2 h asks for 8, but only 4 bodyweight arm exercises exist
    // Once rolling starts, Back does nothing.
    expect(drawReducer(locked, { type: 'back' })).toBe(locked);
  });
});

describe('after the warm-up', () => {
  it('goes to the count reels, or straight to the cases when fully random', () => {
    const setup: Action[] = [{ type: 'begin' }, { type: 'setMinutes', minutes: 45 }, { type: 'next' }];
    const picked = run([...setup, { type: 'toggleMuscle', muscle: 'chest' }, { type: 'next' }, { type: 'next' }]);
    expect(picked.step).toBe('warmup');
    expect(drawReducer(picked, { type: 'next' })).toBe(picked); // not until the warm-up has landed
    expect(run([{ type: 'revealWarmup', warmup: 'none' }, { type: 'next' }], picked).step).toBe('count');

    const random = run([...setup, { type: 'setRandom', on: true }, { type: 'next' }, { type: 'next' }]);
    expect(run([{ type: 'revealWarmup', warmup: 'none' }, { type: 'next' }], random).step).toBe('cases');
  });
});

describe('start over', () => {
  it('from a roll returns to a clean Start, with nothing carried over', () => {
    const midRoll = run([
      { type: 'begin' },
      { type: 'setMinutes', minutes: 60 },
      { type: 'next' },
      { type: 'toggleMuscle', muscle: 'legs' },
      { type: 'next' },
      { type: 'setPlace', place: 'home' },
      { type: 'next' },
      { type: 'revealWarmup', warmup: 'none' },
      { type: 'next' },
      { type: 'next' },
    ]);
    expect(midRoll.step).toBe('cases');
    expect(drawReducer(midRoll, { type: 'reset' })).toEqual(initialState);
  });
});
