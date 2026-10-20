import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useReducer } from 'react';
import styles from './App.module.css';
import { drawReducer, initialState } from './lib/drawState';
import { unlockAudio } from './lib/sound';
import { CasesScreen } from './screens/CasesScreen';
import { CountScreen } from './screens/CountScreen';
import { EquipmentScreen } from './screens/EquipmentScreen';
import { MuscleScreen } from './screens/MuscleScreen';
import { PlanScreen } from './screens/PlanScreen';
import { StartScreen } from './screens/StartScreen';
import { TimeScreen } from './screens/TimeScreen';

export default function App() {
  const [state, dispatch] = useReducer(drawReducer, initialState);

  function renderScreen() {
    switch (state.step) {
      case 'time':
        return <TimeScreen state={state} dispatch={dispatch} />;
      case 'muscles':
        return <MuscleScreen state={state} dispatch={dispatch} />;
      case 'place':
        return <EquipmentScreen state={state} dispatch={dispatch} />;
      case 'count':
        return <CountScreen state={state} dispatch={dispatch} />;
      case 'cases':
        return <CasesScreen state={state} dispatch={dispatch} />;
      case 'plan':
        return <PlanScreen state={state} onNewDraw={() => dispatch({ type: 'reset' })} />;
      default:
        return <StartScreen onStart={() => dispatch({ type: 'begin' })} />;
    }
  }

  return (
    // Animations always play, even with the OS "reduce motion" setting on (learner decision).
    // A manual toggle can come later with the settings menu.
    <MotionConfig reducedMotion="never">
      {/* Any tap unlocks audio, so sounds that play later (reels, rolls) are allowed. */}
      <div className={styles.shell} onPointerDown={unlockAudio}>
        {/* AnimatePresence stays mounted; each screen is keyed by its step. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={state.step}
            className={styles.screen}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderScreen()}
          </motion.main>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
