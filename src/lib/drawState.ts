import { EXERCISES, WARMUPS, type Muscle, type Place, type Warmup } from '../data/exercises';
import { exerciseCountFor, planCounts, poolFor, type DrawnExercise } from './draw';
import { isComplete, startRun, tapSet, type WorkoutRecord, type WorkoutRun } from './workout';

export type Step = 'start' | 'time' | 'muscles' | 'place' | 'warmup' | 'count' | 'cases' | 'plan' | 'workout' | 'done';

export interface DrawState {
  step: Step;
  minutes: number; // 0–120
  muscles: Muscle[]; // empty when fullyRandom
  fullyRandom: boolean;
  place: Place;
  // set at lock:
  total: number;
  counts: Partial<Record<Muscle, number>>; // includes 0s for dropped groups
  // revealed as you go:
  warmup: Warmup | 'none' | null;
  drawn: DrawnExercise[];
  // doing the workout:
  run: WorkoutRun | null;
  finished: WorkoutRecord | null; // shown on the done screen
}

export type Action =
  | { type: 'begin' }
  | { type: 'setMinutes'; minutes: number }
  | { type: 'toggleMuscle'; muscle: Muscle }
  | { type: 'setRandom'; on: boolean }
  | { type: 'setPlace'; place: Place }
  | { type: 'revealWarmup'; warmup: Warmup | 'none' }
  | { type: 'revealExercise'; drawn: DrawnExercise }
  | { type: 'startWorkout'; now: number }
  | { type: 'tapSet'; set: number }
  | { type: 'goTo'; index: number }
  | { type: 'finishWorkout'; record: WorkoutRecord }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'reset' };

export const initialState: DrawState = {
  step: 'start',
  minutes: 0,
  muscles: [],
  fullyRandom: false,
  place: 'gym',
  total: 0,
  counts: {},
  warmup: null,
  drawn: [],
  run: null,
  finished: null,
};

/**
 * Locks the draw: decides the total and each group's count once, before any roll plays.
 * The warm-up roll comes next; fully random later skips the count roll.
 */
function lockDraw(state: DrawState): DrawState {
  const total = exerciseCountFor(state.minutes);
  if (state.fullyRandom) {
    const available = poolFor('any', state.place).length;
    return { ...state, step: 'warmup', total: Math.min(total, available), counts: {}, warmup: null, drawn: [] };
  }
  const counts = planCounts(state.muscles, total, state.place);
  const locked = Object.values(counts).reduce((a, b) => a + b, 0);
  return { ...state, step: 'warmup', total: locked, counts, warmup: null, drawn: [] };
}

function updateRun(state: DrawState, change: (run: WorkoutRun) => WorkoutRun): DrawState {
  return state.step === 'workout' && state.run ? { ...state, run: change(state.run) } : state;
}

export function drawReducer(state: DrawState, action: Action): DrawState {
  switch (action.type) {
    case 'begin':
      return { ...initialState, step: 'time' };
    case 'setMinutes':
      return { ...state, minutes: Math.min(Math.max(Math.round(action.minutes), 0), 120) };
    case 'toggleMuscle': {
      const has = state.muscles.includes(action.muscle);
      // Picking a group turns fully random off.
      const muscles = has ? state.muscles.filter((m) => m !== action.muscle) : [...state.muscles, action.muscle];
      return { ...state, muscles, fullyRandom: false };
    }
    case 'setRandom':
      // Fully random clears any picked groups.
      return { ...state, fullyRandom: action.on, muscles: action.on ? [] : state.muscles };
    case 'setPlace':
      return { ...state, place: action.place };
    case 'revealWarmup':
      return { ...state, warmup: action.warmup };
    case 'revealExercise':
      return { ...state, drawn: [...state.drawn, action.drawn] };
    case 'startWorkout':
      return state.step === 'plan' ? { ...state, step: 'workout', run: startRun(state.warmup, state.drawn, action.now) } : state;
    case 'tapSet':
      return updateRun(state, (run) => ({
        ...run,
        items: run.items.map((item, i) => (i === run.index ? tapSet(item, action.set) : item)),
      }));
    case 'goTo':
      // Moving on needs the current exercise finished; going back is always fine.
      return updateRun(state, (run) => {
        const forward = action.index > run.index;
        if (action.index < 0 || action.index >= run.items.length) return run;
        if (forward && !isComplete(run.items[run.index])) return run;
        return { ...run, index: action.index };
      });
    case 'finishWorkout':
      return state.run?.items.every(isComplete) ? { ...state, step: 'done', run: null, finished: action.record } : state;
    case 'next':
      switch (state.step) {
        case 'time':
          return state.minutes > 0 ? { ...state, step: 'muscles' } : state;
        case 'muscles':
          return state.fullyRandom || state.muscles.length > 0 ? { ...state, step: 'place' } : state;
        case 'place':
          // Gym or home is the last choice, so its Continue locks the draw.
          return lockDraw(state);
        case 'warmup':
          // Fully random has no counts to roll.
          return state.warmup ? { ...state, step: state.fullyRandom ? 'cases' : 'count' } : state;
        case 'count':
          return { ...state, step: 'cases' };
        case 'cases':
          return { ...state, step: 'plan' };
        default:
          return state;
      }
    case 'back': {
      // Only setup screens go back, keeping their choices; once rolling starts the draw is locked.
      const previous: Partial<Record<Step, Step>> = { time: 'start', muscles: 'time', place: 'muscles' };
      const to = previous[state.step];
      return to ? { ...state, step: to } : state;
    }
    case 'reset':
      return initialState;
  }
}

/**
 * A saved session, ready to continue after a reload. The roll screens keep their animation
 * progress on screen only, so a roll that was underway starts over: the warm-up roll clears
 * its result, and the cases clear theirs. Exercises are looked up again by id, so a session
 * saved by an older version with exercises that no longer exist is dropped.
 */
export function resumeState(saved: DrawState | null): DrawState | null {
  if (!saved || typeof saved !== 'object' || !saved.step) return null;
  const drawn: DrawnExercise[] = [];
  for (const d of saved.drawn ?? []) {
    const exercise = EXERCISES.find((e) => e.id === d.exercise?.id);
    if (!exercise) return null;
    drawn.push({ ...d, exercise });
  }
  let warmup = saved.warmup;
  if (warmup && warmup !== 'none') {
    const id = warmup.id;
    warmup = WARMUPS.find((w) => w.id === id) ?? null;
    if (!warmup) return null;
  }
  const state: DrawState = { ...initialState, ...saved, warmup, drawn };
  if (state.step === 'warmup') return { ...state, warmup: null };
  if (state.step === 'cases') return { ...state, drawn: [] };
  if (state.step === 'workout' && !state.run) return { ...state, step: 'plan' };
  return state;
}
