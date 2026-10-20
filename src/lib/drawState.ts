import type { Muscle, Place, Warmup } from '../data/exercises';
import { exerciseCountFor, type DrawnExercise } from './draw';

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

export function drawReducer(state: DrawState, action: Action): DrawState {
  switch (action.type) {
    case 'begin':
      return { ...initialState, step: 'time' };
    case 'setMinutes':
      return { ...state, minutes: Math.min(Math.max(Math.round(action.minutes), 0), 120) };
    case 'revealExercise':
      return { ...state, drawn: [...state.drawn, action.drawn] };
    case 'next':
      switch (state.step) {
        case 'time':
          if (state.minutes <= 0) return state;
          // Until the body map and gym/home screens exist: lock a fully random gym draw here.
          return { ...state, step: 'cases', fullyRandom: true, total: exerciseCountFor(state.minutes) };
        case 'cases':
          return { ...state, step: 'plan' };
        default:
          return state;
      }
    case 'back':
      // Only setup screens go back; once rolling starts the draw is locked.
      return state.step === 'time' ? { ...state, step: 'start' } : state;
    case 'reset':
      return initialState;
  }
}
