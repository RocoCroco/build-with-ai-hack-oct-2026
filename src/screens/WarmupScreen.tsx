import { useState, type Dispatch } from 'react';
import { WARMUPS, type Warmup } from '../data/exercises';
import { drawWarmup } from '../lib/draw';
import type { Action, DrawState } from '../lib/drawState';
import { unlockAudio } from '../lib/sound';
import { CaseRoll, type RollItem } from './CaseRoll';
import { CaseTile } from './CaseTile';
// Same layout as the exercise cases: title, roll in the middle, the case at the bottom.
import styles from './CasesScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
}

// The gold card. Same odds as each warm-up; it just looks like the rare one.
const NONE: RollItem = { id: 'none', label: 'No warm-up', gold: true };
const POOL: RollItem[] = [...WARMUPS.map((w) => ({ id: w.id, label: w.name })), NONE];

function toItem(warmup: Warmup | 'none'): RollItem {
  return warmup === 'none' ? NONE : { id: warmup.id, label: warmup.name };
}

/** One case before the counts: it lands on a warm-up, or on "No warm-up". */
export function WarmupScreen({ state, dispatch }: Props) {
  // tapped (result decided, lid opens) → rolling → landed
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(false);
  const { warmup } = state;

  function open() {
    if (warmup) return;
    unlockAudio();
    dispatch({ type: 'revealWarmup', warmup: drawWarmup() });
  }

  let hint = 'Tap the case to open it';
  if (warmup && !landed) hint = '';
  else if (landed) hint = warmup === 'none' ? 'Straight into it' : 'Do this before your first exercise';

  return (
    <div className={styles.round}>
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1 className={styles.title}>Warm-up</h1>
          <p className={styles.sub}>{landed ? 'Done' : 'One case'}</p>
        </header>

        <div className={styles.rolls}>
          {rolling && warmup ? (
            <CaseRoll key="roll" pool={POOL} result={toItem(warmup)} onDone={() => setLanded(true)} />
          ) : (
            <CaseRoll key="idle" pool={POOL} result={null} />
          )}
        </div>

        <div className={styles.cases}>
          <CaseTile
            gold={landed && warmup === 'none'}
            state={!warmup ? 'ready' : landed ? 'revealed' : 'open'}
            label={landed && warmup ? toItem(warmup).label : 'Open the warm-up case'}
            onTap={open}
            onOpened={() => setRolling(true)}
          />
        </div>
        <p className={styles.hint}>{hint}</p>

        {landed && (
          <button
            className="continue"
            onClick={() => dispatch({ type: 'next' })}
            aria-label={state.fullyRandom ? 'Continue to the cases' : 'Continue to the count'}
          >
            Go
          </button>
        )}
      </div>
    </div>
  );
}
