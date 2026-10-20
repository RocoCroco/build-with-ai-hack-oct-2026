import { motion } from 'motion/react';
import styles from './StartScreen.module.css';

export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className={styles.screen}>
      <div>
        <h1 className={styles.title}>
          Workout
          <br />
          Draw
        </h1>
        <p className={styles.tagline}>Randomize your routine</p>
      </div>
      <motion.button
        className={`primary ${styles.start}`}
        onClick={onStart}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        Start
      </motion.button>
    </div>
  );
}
