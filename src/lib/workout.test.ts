import { describe, expect, it } from 'vitest';
import { EXERCISES, WARMUPS } from '../data/exercises';
import { drawReducer, initialState, resumeState, type DrawState } from './drawState';
import { formatDuration, recordFrom, setsByMuscle } from './workout';

const bench = EXERCISES.find((e) => e.id === 'bench-press')!;
const curl = EXERCISES.find((e) => e.id === 'db-curl')!;
const atPlan: DrawState = {
  ...initialState,
  step: 'plan',
  minutes: 45,
  warmup: WARMUPS[0],
  drawn: [
    { exercise: bench, sets: 2, reps: 8 },
    { exercise: curl, sets: 3, reps: 12 },
  ],
};

describe('workout mode', () => {
  it('walks the warm-up and each exercise, only moving on once every set is ticked', () => {
    let s = drawReducer(atPlan, { type: 'startWorkout', now: 1000 });
    expect(s.step).toBe('workout');
    expect(s.run!.items.map((i) => i.sets)).toEqual([1, 2, 3]);

    expect(drawReducer(s, { type: 'goTo', index: 1 }).run!.index).toBe(0); // warm-up not ticked
    s = drawReducer(s, { type: 'tapSet', set: 0 });
    s = drawReducer(s, { type: 'goTo', index: 1 });
    expect(s.run!.index).toBe(1);

    s = drawReducer(s, { type: 'tapSet', set: 1 }); // ticks sets 1 and 2
    expect(s.run!.items[1].done).toBe(2);
    s = drawReducer(s, { type: 'tapSet', set: 1 }); // untick the last one
    expect(s.run!.items[1].done).toBe(1);
    expect(drawReducer(s, { type: 'goTo', index: 2 }).run!.index).toBe(1);
    expect(drawReducer(s, { type: 'goTo', index: 0 }).run!.index).toBe(0); // back is always fine

    s = drawReducer(s, { type: 'tapSet', set: 1 });
    s = drawReducer(s, { type: 'goTo', index: 2 });
    const unfinished = recordFrom(s.run!, 'gym', 9000);
    expect(drawReducer(s, { type: 'finishWorkout', record: unfinished }).step).toBe('workout');

    s = drawReducer(s, { type: 'tapSet', set: 2 });
    const record = recordFrom(s.run!, 'gym', 61_000);
    s = drawReducer(s, { type: 'finishWorkout', record });
    expect(s.step).toBe('done');
    expect(s.finished!.finishedAt - s.finished!.startedAt).toBe(60_000);
    expect(setsByMuscle([record])).toMatchObject({ chest: 2, biceps: 3, legs: 0 });
  });
});

describe('resumeState', () => {
  it('keeps the plan and a workout in progress as they were', () => {
    const working = drawReducer(atPlan, { type: 'startWorkout', now: 1000 });
    const reloaded = resumeState(JSON.parse(JSON.stringify(working)));
    expect(reloaded).toEqual(working);
  });

  it('starts an unfinished roll over, keeping the setup', () => {
    const midCases: DrawState = { ...atPlan, step: 'cases', muscles: ['chest'] };
    const reloaded = resumeState(JSON.parse(JSON.stringify(midCases)))!;
    expect(reloaded.step).toBe('cases');
    expect(reloaded.drawn).toEqual([]);
    expect(reloaded.muscles).toEqual(['chest']);
    expect(resumeState({ ...atPlan, step: 'warmup' })!.warmup).toBeNull();
  });

  it('drops a session that names an exercise that no longer exists', () => {
    const stale = { ...atPlan, drawn: [{ exercise: { ...bench, id: 'gone' }, sets: 3, reps: 8 }] };
    expect(resumeState(stale)).toBeNull();
    expect(resumeState(null)).toBeNull();
  });
});

describe('formatDuration', () => {
  it('shows minutes and seconds, and hours when needed', () => {
    expect(formatDuration(754_000)).toBe('12:34');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });
});
