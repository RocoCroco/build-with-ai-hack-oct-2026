import { MUSCLE_LABELS } from '../data/exercises';
import type { DrawState } from '../lib/drawState';
import styles from './PlanScreen.module.css';

interface Props {
  state: DrawState;
  onNewDraw: () => void;
}

export function PlanScreen({ state, onNewDraw }: Props) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Your workout</h1>
      <ol className={styles.list}>
        {state.drawn.map(({ exercise, sets, reps }) => (
          <li key={exercise.id} className={styles.card} data-muscle={exercise.muscle}>
            <div>
              <p className={styles.name}>{exercise.name}</p>
              <p className={styles.muscle}>{MUSCLE_LABELS[exercise.muscle]}</p>
            </div>
            <p className={styles.volume}>
              {sets} × {reps}
            </p>
          </li>
        ))}
      </ol>
      <button className={`primary ${styles.newDraw}`} onClick={onNewDraw}>
        New draw
      </button>
    </div>
  );
}
