import type { Dispatch } from 'react';
import { exerciseCountFor } from '../lib/draw';
import type { Action, DrawState } from '../lib/drawState';
import { TimeWheel } from './TimeWheel';
import styles from './TimeScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
}

function Readout({ minutes }: { minutes: number }) {
  if (minutes < 60) {
    return (
      <>
        <span className={styles.big}>{minutes}</span>
        <span className={styles.unit}>min</span>
      </>
    );
  }
  return (
    <>
      <span className={styles.big}>{Math.floor(minutes / 60)}</span>
      <span className={styles.unit}>h</span>
      <span className={styles.big}>{String(minutes % 60).padStart(2, '0')}</span>
    </>
  );
}

export function TimeScreen({ state, dispatch }: Props) {
  const count = exerciseCountFor(state.minutes);
  return (
    <div className={styles.screen}>
      <button className="back" onClick={() => dispatch({ type: 'back' })}>
        Back
      </button>
      <h1 className={styles.title}>How long do you have?</h1>

      <div className={styles.wheel}>
        <TimeWheel minutes={state.minutes} onChange={(minutes) => dispatch({ type: 'setMinutes', minutes })} />
        <p className={styles.readout} aria-hidden>
          <Readout minutes={state.minutes} />
        </p>
      </div>

      <p className={styles.hint}>{count === 0 ? 'Turn the dial clockwise' : `${count} exercises`}</p>

      <button
        className="continue"
        disabled={state.minutes <= 0}
        onClick={() => dispatch({ type: 'next' })}
        aria-label="Continue"
      >
        Go
      </button>
    </div>
  );
}
