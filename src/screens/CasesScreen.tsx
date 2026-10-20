import { motion } from 'motion/react';
import { useMemo, useState, type Dispatch } from 'react';
import { MUSCLE_LABELS } from '../data/exercises';
import { drawExercise, poolFor, type DrawnExercise } from '../lib/draw';
import type { Action, DrawState } from '../lib/drawState';
import { unlockAudio } from '../lib/sound';
import { CaseRoll, type RollItem } from './CaseRoll';
import { CaseTile, type CaseState } from './CaseTile';
import styles from './CasesScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
}

function toItem(d: DrawnExercise): RollItem {
  return { id: d.exercise.id, label: d.exercise.name, muscle: d.exercise.muscle };
}

export function CasesScreen({ state, dispatch }: Props) {
  const group = 'any';
  const pool = useMemo(
    () => poolFor(group, state.place).map((e) => ({ id: e.id, label: e.name, muscle: e.muscle })),
    [state.place],
  );
  // idle → tap → opening (lid swings up) → rolling (strip spins) → idle
  const [phase, setPhase] = useState<'idle' | 'opening' | 'rolling'>('idle');
  // The result of the case being opened, decided at the tap, revealed once the lid is open.
  const [pending, setPending] = useState<DrawnExercise | null>(null);
  // Which case tile was opened for each draw, in draw order.
  const [openedTiles, setOpenedTiles] = useState<number[]>([]);

  const busy = phase !== 'idle';
  const latest = state.drawn.at(-1) ?? null;
  const allOpen = state.drawn.length >= state.total;

  function open(tile: number) {
    if (busy || openedTiles.includes(tile)) return;
    unlockAudio(); // the tap is what allows the roll's sounds to play
    // Decide first, then animate toward the decided result.
    const drawn = drawExercise(group, state.place, state.drawn);
    if (!drawn) return;
    setPending(drawn);
    setOpenedTiles([...openedTiles, tile]);
    setPhase('opening');
  }

  function startRoll() {
    if (phase !== 'opening' || !pending) return;
    dispatch({ type: 'revealExercise', drawn: pending });
    setPending(null);
    setPhase('rolling');
  }

  function caseState(tile: number): CaseState {
    const drawIndex = openedTiles.indexOf(tile);
    if (drawIndex === -1) return busy ? 'waiting' : 'ready';
    return busy && drawIndex === openedTiles.length - 1 ? 'open' : 'revealed';
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Case {Math.min(openedTiles.length + (busy ? 0 : 1), state.total)} of {state.total}
        </h1>
        <p className={styles.sub}>Any muscle</p>
      </header>

      <CaseRoll
        key={state.drawn.length}
        pool={pool}
        result={latest && toItem(latest)}
        onDone={() => setPhase('idle')}
      />

      <div className={styles.result} aria-hidden={busy}>
        {latest && !busy && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className={styles.resultName}>{latest.exercise.name}</p>
            <p className={styles.resultMeta} data-muscle={latest.exercise.muscle}>
              {MUSCLE_LABELS[latest.exercise.muscle]}
            </p>
          </motion.div>
        )}
      </div>

      <div className={styles.cases}>
        {Array.from({ length: state.total }, (_, tile) => {
          const caseNow = caseState(tile);
          const exercise = caseNow === 'revealed' ? state.drawn[openedTiles.indexOf(tile)].exercise : undefined;
          return (
            <CaseTile
              key={tile}
              state={caseNow}
              muscle={exercise?.muscle}
              label={exercise ? exercise.name : `Open case ${tile + 1}`}
              onTap={() => open(tile)}
              onOpened={startRoll}
            />
          );
        })}
      </div>
      <p className={styles.hint}>{busy ? '' : allOpen ? 'All cases open' : 'Tap a case to open it'}</p>

      {allOpen && !busy && (
        <button className="continue" onClick={() => dispatch({ type: 'next' })} aria-label="Continue to your plan">
          Go
        </button>
      )}
    </div>
  );
}
