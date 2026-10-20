import type { Muscle, Place, Warmup } from '../data/exercises';
import type { DrawnExercise } from './draw';

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
  | { type: 'revealExercise'; drawn: DrawnExercise }
  | { type: 'next' }
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
      // Fixed draw until the setup screens exist: fully random, 4 cases, gym.
      return { ...initialState, step: 'cases', fullyRandom: true, total: 4 };
    case 'revealExercise':
      return { ...state, drawn: [...state.drawn, action.drawn] };
    case 'next':
      return state.step === 'cases' ? { ...state, step: 'plan' } : state;
    case 'reset':
      return initialState;
  }
}
