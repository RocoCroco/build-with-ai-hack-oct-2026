import { motion } from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch } from 'react';
import { MUSCLE_LABELS, MUSCLES } from '../data/exercises';
import { drawExercise, poolFor, type DrawnExercise, type Group } from '../lib/draw';
import type { Action, DrawState } from '../lib/drawState';
import { unlockAudio } from '../lib/sound';
import { CaseRoll, type RollItem } from './CaseRoll';
import { CaseTile, type CaseState } from './CaseTile';
import styles from './CasesScreen.module.css';

interface Props {
  state: DrawState;
  dispatch: Dispatch<Action>;
}

interface Round {
  group: Group;
  count: number;
}

function toItem(d: DrawnExercise): RollItem {
  return { id: d.exercise.id, label: d.exercise.name, muscle: d.exercise.muscle };
}

function groupLabel(group: Group) {
  return group === 'any' ? 'Any muscle' : MUSCLE_LABELS[group];
}

const ROW_GAP = 6;

/** One roll row per open case: full size while few, shrinking so every row fits the space. */
function rowSize(rows: number, area: number) {
  const slot = Math.floor((area - (rows - 1) * ROW_GAP) / rows);
  const pad = slot >= 130 ? 16 : slot >= 48 ? 6 : 3;
  const itemHeight = Math.max(28, Math.min(112, slot - 2 * pad));
  return { itemHeight, pad, compact: itemHeight < 72 };
}

/** One group's cases. Remounted (keyed) for each group so its local state starts fresh. */
function GroupRound({
  round,
  next,
  state,
  dispatch,
  onContinue,
}: {
  round: Round;
  next: Round | undefined;
  state: DrawState;
  dispatch: Dispatch<Action>;
  onContinue: () => void;
}) {
  const { group, count } = round;
  const pool = useMemo(
    () => poolFor(group, state.place).map((e) => ({ id: e.id, label: e.name, muscle: e.muscle })),
    [group, state.place],
  );
  // Each case goes: tapped (result decided, lid swings up) → rolling (its row spins) → landed.
  // Several can be in flight at once. Indexes below are draw indexes within this round.
  const [openedTiles, setOpenedTiles] = useState<number[]>([]); // the tile opened for each draw
  const [rolling, setRolling] = useState<number[]>([]); // draws whose lid is open, in row order
  const [landed, setLanded] = useState<number[]>([]);
  // Draws from earlier groups come first in state.drawn.
  const [startIndex] = useState(state.drawn.length);
  const rollsRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState(0);

  // The rolls fill whatever height the header and cases leave.
  useLayoutEffect(() => {
    const el = rollsRef.current!;
    const observer = new ResizeObserver(() => setArea(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // On very short screens the rows can overflow; keep the newest one in view.
  useEffect(() => {
    const el = rollsRef.current!;
    el.scrollTo({ top: el.scrollHeight });
  }, [rolling.length]);

  const roundDrawn = state.drawn.slice(startIndex);
  const finished = landed.length >= count;

  function open(tile: number) {
    if (openedTiles.includes(tile) || openedTiles.length >= count) return;
    unlockAudio(); // the tap is what allows the roll's sounds to play
    // Decide first, then animate toward the decided result. No repeats across the whole draw.
    const drawn = drawExercise(group, state.place, state.drawn);
    if (!drawn) return;
    dispatch({ type: 'revealExercise', drawn });
    setOpenedTiles([...openedTiles, tile]);
  }

  function caseState(tile: number): CaseState {
    const draw = openedTiles.indexOf(tile);
    if (draw === -1) return 'ready';
    return landed.includes(draw) ? 'revealed' : 'open';
  }

  let hint = 'Tap a case to open it';
  if (finished) hint = next ? `Next up: ${groupLabel(next.group)}` : 'All cases open';
  else if (openedTiles.length === count) hint = '';
  else if (openedTiles.length > 0) hint = 'Open the next one any time';

  const { itemHeight, pad, compact } = rowSize(Math.max(rolling.length, 1), area);
  const rowStyle = { '--item-h': `${itemHeight}px`, '--roll-pad': `${pad}px`, '--row-gap': `${ROW_GAP}px` } as CSSProperties;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title} data-muscle={group === 'any' ? undefined : group}>
          {groupLabel(group)}
        </h1>
        <p className={styles.sub}>
          {landed.length} of {count} {count === 1 ? 'case' : 'cases'} open
        </p>
      </header>

      <div ref={rollsRef} className={styles.rolls} style={rowStyle} data-compact={compact || undefined}>
        {rolling.length === 0 ? (
          <CaseRoll key="idle" pool={pool} result={null} />
        ) : (
          rolling.map((draw, i) => (
            <motion.div
              key={draw}
              // The first row replaces the idle strip in place; later rows grow in.
              initial={i === 0 ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              <CaseRoll
                pool={pool}
                result={toItem(roundDrawn[draw])}
                onDone={() => setLanded((l) => [...l, draw])}
              />
            </motion.div>
          ))
        )}
      </div>

      <div className={styles.cases}>
        {Array.from({ length: count }, (_, tile) => {
          const caseNow = caseState(tile);
          const exercise = caseNow === 'revealed' ? roundDrawn[openedTiles.indexOf(tile)].exercise : undefined;
          return (
            <CaseTile
              key={tile}
              state={caseNow}
              muscle={exercise?.muscle}
              label={exercise ? exercise.name : `Open case ${tile + 1}`}
              onTap={() => open(tile)}
              onOpened={() => setRolling((r) => [...r, openedTiles.indexOf(tile)])}
            />
          );
        })}
      </div>
      <p className={styles.hint}>{hint}</p>

      {finished && (
        <button
          className="continue"
          onClick={onContinue}
          aria-label={next ? `Continue to ${groupLabel(next.group)}` : 'Continue to your plan'}
        >
          Go
        </button>
      )}
    </div>
  );
}

/** Goes group by group (in body order), or one round of N cases from any group when fully random. */
export function CasesScreen({ state, dispatch }: Props) {
  const rounds: Round[] = state.fullyRandom
    ? [{ group: 'any', count: state.total }]
    : MUSCLES.filter((m) => (state.counts[m] ?? 0) > 0).map((m) => ({ group: m, count: state.counts[m]! }));
  const [index, setIndex] = useState(0);

  return (
    <motion.div
      key={index}
      className={styles.round}
      initial={index === 0 ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      <GroupRound
        round={rounds[index]}
        next={rounds[index + 1]}
        state={state}
        dispatch={dispatch}
        onContinue={() => (index + 1 < rounds.length ? setIndex(index + 1) : dispatch({ type: 'next' }))}
      />
    </motion.div>
  );
}
