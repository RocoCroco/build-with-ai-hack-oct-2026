import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useReducer, useState } from 'react';
import styles from './App.module.css';
import { drawReducer, initialState, resumeState, type Step } from './lib/drawState';
import { store } from './lib/storage';
import { loadReduceAnimations, ReduceAnimationsContext, saveReduceAnimations } from './lib/motionPrefs';
import { unlockAudio } from './lib/sound';
import { CasesScreen } from './screens/CasesScreen';
import { CountScreen } from './screens/CountScreen';
import { DoneScreen } from './screens/DoneScreen';
import { EquipmentScreen } from './screens/EquipmentScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { MenuButton } from './screens/MenuButton';
import { MuscleScreen } from './screens/MuscleScreen';
import { PlanScreen } from './screens/PlanScreen';
import { StartScreen } from './screens/StartScreen';
import { TimeScreen } from './screens/TimeScreen';
import { WarmupScreen } from './screens/WarmupScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';

// Once the draw is locked, the menu's Start over is the way out (it also abandons a workout).
const ROLL_STEPS: Step[] = ['warmup', 'count', 'cases', 'workout'];

export default function App() {
  // A reload picks up where the person left off.
  const [state, dispatch] = useReducer(drawReducer, null, () => resumeState(store.loadSession()) ?? initialState);
  useEffect(() => store.saveSession(state), [state]);
  const [reduceAnimations, setReduceAnimations] = useState(loadReduceAnimations);
  // The exercise library is a side trip from Start, outside the draw.
  const [library, setLibrary] = useState(false);

  function renderScreen() {
    if (library) return <LibraryScreen onBack={() => setLibrary(false)} />;
    switch (state.step) {
      case 'time':
        return <TimeScreen state={state} dispatch={dispatch} />;
      case 'muscles':
        return <MuscleScreen state={state} dispatch={dispatch} />;
      case 'place':
        return <EquipmentScreen state={state} dispatch={dispatch} />;
      case 'warmup':
        return <WarmupScreen state={state} dispatch={dispatch} />;
      case 'count':
        return <CountScreen state={state} dispatch={dispatch} />;
      case 'cases':
        return <CasesScreen state={state} dispatch={dispatch} />;
      case 'plan':
        return (
          <PlanScreen
            state={state}
            onNewDraw={() => dispatch({ type: 'reset' })}
            onStartWorkout={() => dispatch({ type: 'startWorkout', now: Date.now() })}
          />
        );
      case 'workout':
        return (
          <WorkoutScreen
            state={state}
            dispatch={dispatch}
            onFinish={(record) => {
              store.addWorkout(record);
              dispatch({ type: 'finishWorkout', record });
            }}
          />
        );
      case 'done':
        return state.finished && <DoneScreen record={state.finished} onHome={() => dispatch({ type: 'reset' })} />;
      default:
        return <StartScreen onStart={() => dispatch({ type: 'begin' })} />;
    }
  }

  return (
    // Animations ignore the OS "reduce motion" setting (learner decision); the menu's own
    // "Reduce animations" switch turns them down instead.
    <ReduceAnimationsContext value={reduceAnimations}>
    <MotionConfig reducedMotion={reduceAnimations ? 'always' : 'never'}>
      {/* Any tap unlocks audio, so sounds that play later (reels, rolls) are allowed. */}
      <div className={styles.shell} onPointerDown={unlockAudio} data-reduce-motion={reduceAnimations || undefined}>
        {/* AnimatePresence stays mounted; each screen is keyed by its step. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={library ? 'library' : state.step}
            className={styles.screen}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderScreen()}
          </motion.main>
        </AnimatePresence>
        {/* On every screen; once the draw is locked, its Start over is the only way out. */}
        <MenuButton
          reduceAnimations={reduceAnimations}
          onReduceAnimations={(on) => {
            setReduceAnimations(on);
            saveReduceAnimations(on);
          }}
          onStartOver={ROLL_STEPS.includes(state.step) ? () => dispatch({ type: 'reset' }) : undefined}
          onLibrary={state.step === 'start' && !library ? () => setLibrary(true) : undefined}
        />
      </div>
    </MotionConfig>
    </ReduceAnimationsContext>
  );
}
