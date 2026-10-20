import { createContext, useContext } from 'react';

// "Reduce animations" from the menu. Rolls still happen, they just land fast instead of spinning.
// Kept in this browser only; if storage is blocked, the app starts with full animations.

const KEY = 'workout-draw:reduce-animations';

export function loadReduceAnimations(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function saveReduceAnimations(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // Not saved; it still applies until the page is closed.
  }
}

export const ReduceAnimationsContext = createContext(false);

/** True when the person turned on "Reduce animations". */
export function useReduceAnimations() {
  return useContext(ReduceAnimationsContext);
}
