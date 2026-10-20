import { motion } from 'motion/react';
import type { Dispatch } from 'react';
import { MUSCLE_LABELS, MUSCLES } from '../data/exercises';
import { exerciseCountFor } from '../lib/draw';
import type { Action, DrawState } from '../lib/drawState';
import { BodyMap } from './BodyMap';
import styles from './MuscleScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
}

export function MuscleScreen({ state, dispatch }: Props) {
  const total = exerciseCountFor(state.minutes);
  const picked = state.muscles.length;
  const canContinue = state.fullyRandom || picked > 0;

  let hint = 'Pick at least one, or go fully random';
  if (state.fullyRandom) hint = `${total} exercises from any muscle`;
  else if (picked > total) hint = `${total} exercises for ${picked} groups: some get dropped at random`;
  else if (picked > 0) hint = `${total} exercises across ${picked} ${picked === 1 ? 'group' : 'groups'}`;

  return (
    <div className={styles.screen}>
      <button className="back" onClick={() => dispatch({ type: 'back' })}>
        Back
      </button>
      <h1 className={styles.title}>What do you want to train?</h1>

      <BodyMap
        selected={state.muscles}
        dimmed={state.fullyRandom}
        onToggle={(muscle) => dispatch({ type: 'toggleMuscle', muscle })}
      />

      <div className={styles.chips}>
        {MUSCLES.map((m) => {
          const on = state.muscles.includes(m);
          return (
            <motion.button
              key={m}
              className={styles.chip}
              data-muscle={m}
              data-on={on || undefined}
              aria-pressed={on}
              onClick={() => dispatch({ type: 'toggleMuscle', muscle: m })}
              whileTap={{ scale: 0.94 }}
            >
              {MUSCLE_LABELS[m]}
            </motion.button>
          );
        })}
        <motion.button
          className={styles.random}
          data-on={state.fullyRandom || undefined}
          aria-pressed={state.fullyRandom}
          onClick={() => dispatch({ type: 'setRandom', on: !state.fullyRandom })}
          whileTap={{ scale: 0.94 }}
        >
          <svg viewBox="0 0 20 20" aria-hidden className={styles.die}>
            <rect x="1.5" y="1.5" width="17" height="17" rx="4" />
            <circle cx="6.5" cy="6.5" r="1.6" />
            <circle cx="10" cy="10" r="1.6" />
            <circle cx="13.5" cy="13.5" r="1.6" />
          </svg>
          Fully random
        </motion.button>
      </div>

      <p className={styles.hint}>{hint}</p>

      <button
        className="continue"
        disabled={!canContinue}
        onClick={() => dispatch({ type: 'next' })}
        aria-label="Continue"
      >
        Go
      </button>
    </div>
  );
}
