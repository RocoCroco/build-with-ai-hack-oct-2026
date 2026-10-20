import type { Dispatch } from 'react';
import type { Action, DrawState } from '../lib/drawState';
import { NeonSwitch } from './NeonSwitch';
import styles from './EquipmentScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
}

export function EquipmentScreen({ state, dispatch }: Props) {
  return (
    <div className={styles.screen}>
      <button className="back" onClick={() => dispatch({ type: 'back' })}>
        Back
      </button>
      <h1 className={styles.title}>Where are you training?</h1>

      <div className={styles.switch}>
        <NeonSwitch place={state.place} onChange={(place) => dispatch({ type: 'setPlace', place })} />
      </div>

      <p className={styles.hint}>
        {state.place === 'gym' ? 'Any exercise, machines and bars included' : 'Bodyweight only, no equipment needed'}
      </p>

      {/* The last choice: Continue locks the draw */}
      <button className="continue" onClick={() => dispatch({ type: 'next' })} aria-label="Lock in and start rolling">
        Go
      </button>
    </div>
  );
}
