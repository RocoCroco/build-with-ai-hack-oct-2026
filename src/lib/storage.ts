import type { DrawState } from './drawState';
import type { WorkoutRecord } from './workout';

// Everything the app keeps between visits goes through `store`. Today it's this browser's
// localStorage; moving to an online database (e.g. Supabase) means writing another object
// with the same shape, without touching the screens.

export interface Store {
  loadSession(): DrawState | null;
  saveSession(state: DrawState): void;
  loadHistory(): WorkoutRecord[];
  addWorkout(record: WorkoutRecord): void;
  /** The last finished workout the Start screen has already celebrated. */
  loadCelebrated(): string | null;
  saveCelebrated(id: string): void;
}

const SESSION = 'workout-draw:session:v1';
const HISTORY = 'workout-draw:history:v1';
const CELEBRATED = 'workout-draw:celebrated:v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null; // blocked storage or a damaged value: start fresh
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not saved (private mode, full storage); the app keeps working for this visit.
  }
}

export const localStore: Store = {
  loadSession: () => read<DrawState>(SESSION),
  // Sitting on Start there's nothing to resume, so nothing is kept.
  saveSession: (state) => write(SESSION, state.step === 'start' ? null : state),
  loadHistory: () => {
    const history = read<WorkoutRecord[]>(HISTORY);
    return Array.isArray(history) ? history : [];
  },
  addWorkout: (record) => {
    const history = localStore.loadHistory().filter((r) => r.id !== record.id);
    write(HISTORY, [...history, record]);
  },
  loadCelebrated: () => read<string>(CELEBRATED),
  saveCelebrated: (id) => write(CELEBRATED, id),
};

export const store: Store = localStore;
