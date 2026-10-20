import type { Muscle, Place, Warmup } from '../data/exercises';
import { exerciseCountFor, planCounts, poolFor, type DrawnExercise } from './draw';

export type Step = 'start' | 'time' | 'muscles' | 'place' | 'warmup' | 'count' | 'cases' | 'plan';

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
}

export type Action =
  | { type: 'begin' }
  | { type: 'setMinutes'; minutes: number }
  | { type: 'toggleMuscle'; muscle: Muscle }
  | { type: 'setRandom'; on: boolean }
  | { type: 'revealExercise'; drawn: DrawnExercise }
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
};

/**
 * Locks the draw: decides the total and each group's count once, before any roll plays.
 * Fully random skips the count roll and goes straight to the cases.
 */
function lockDraw(state: DrawState): DrawState {
  const total = exerciseCountFor(state.minutes);
  if (state.fullyRandom) {
    const available = poolFor('any', state.place).length;
    return { ...state, step: 'cases', total: Math.min(total, available), counts: {}, drawn: [] };
  }
  const counts = planCounts(state.muscles, total, state.place);
  const locked = Object.values(counts).reduce((a, b) => a + b, 0);
  return { ...state, step: 'count', total: locked, counts, drawn: [] };
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
    case 'revealExercise':
      return { ...state, drawn: [...state.drawn, action.drawn] };
    case 'next':
      switch (state.step) {
        case 'time':
          return state.minutes > 0 ? { ...state, step: 'muscles' } : state;
        case 'muscles':
          // Until the gym/home screen exists, Continue here locks a gym draw.
          return state.fullyRandom || state.muscles.length > 0 ? lockDraw(state) : state;
        case 'count':
          return { ...state, step: 'cases' };
        case 'cases':
          return { ...state, step: 'plan' };
        default:
          return state;
      }
    case 'back': {
      // Only setup screens go back, keeping their choices; once rolling starts the draw is locked.
      const previous: Partial<Record<Step, Step>> = { time: 'start', muscles: 'time' };
      const to = previous[state.step];
      return to ? { ...state, step: to } : state;
    }
    case 'reset':
      return initialState;
  }
}
