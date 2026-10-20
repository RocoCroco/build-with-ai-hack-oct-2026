import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useRef, useState, type PointerEvent } from 'react';
import { playLever, playLeverClunk, playLeverNotch } from '../lib/sound';
import styles from './Lever.module.css';

const HEIGHT = 170;
const KNOB = 34;
const TOP = KNOB / 2; // knob center when the lever is up
const BOTTOM = HEIGHT - KNOB / 2; // knob center when it's pulled all the way down
const PIVOT = HEIGHT / 2; // where the rod meets the machine
const NOTCH = 16; // drag distance between ratchet clicks
const TAP_SLOP = 6; // a press that moves less than this is a tap, not a drag
const RELEASE_AT = 0.6; // letting go past this much of the way still completes the pull

interface Props {
  disabled: boolean;
  /** Called when the lever hits the bottom of its pull. */
  onPull: () => void;
}

/**
 * A slot-machine lever seen from the front: the rod swings toward you and down past its pivot.
 * Tap it for a full pull, or drag the knob down yourself.
 */
export function Lever({ disabled, onPull }: Props) {
  const [pulled, setPulled] = useState(false);
  const knobY = useMotionValue(TOP);
  // The rod runs from the pivot to the knob, so it shortens as it swings toward you, then grows below.
  const rodTop = useTransform(knobY, (y) => Math.min(y, PIVOT));
  const rodHeight = useTransform(knobY, (y) => Math.abs(y - PIVOT));
  // The knob is closest to you halfway through the swing, so it looks bigger there.
  const knobScale = useTransform(knobY, [TOP, PIVOT, BOTTOM], [1, 1.3, 1]);
  const knobTop = useTransform(knobY, (y) => y - KNOB / 2);
  // The current drag: where the finger started and the last ratchet notch it clicked.
  const drag = useRef<{ startY: number; notch: number; moved: boolean } | null>(null);

  const locked = disabled || pulled;

  function springBack() {
    animate(knobY, TOP, { type: 'spring', stiffness: 220, damping: 13 });
  }

  // The lever reached the bottom: lock it, start the reels, and let it spring back up with a wobble.
  function finish() {
    setPulled(true);
    onPull();
    springBack();
  }

  async function tapPull() {
    if (locked) return;
    setPulled(true);
    playLever();
    await animate(knobY, BOTTOM, { duration: 0.28, ease: [0.55, 0, 1, 0.45] });
    onPull();
    springBack();
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, notch: 0, moved: false };
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || locked) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > TAP_SLOP) d.moved = true;
    if (!d.moved) return;
    const y = Math.min(BOTTOM, Math.max(TOP, TOP + dy));
    knobY.jump(y);
    // A ratchet click for each notch the knob passes on the way down.
    const notch = Math.floor((y - TOP) / NOTCH);
    if (notch > d.notch) playLeverNotch((y - TOP) / (BOTTOM - TOP));
    d.notch = notch;
    if (y >= BOTTOM) {
      drag.current = null;
      playLeverClunk();
      finish();
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || locked) return;
    if (!d.moved) {
      void tapPull();
      return;
    }
    // Let go partway: past most of the pull it snaps down and counts, otherwise it springs back.
    if ((knobY.get() - TOP) / (BOTTOM - TOP) >= RELEASE_AT) {
      playLeverClunk();
      knobY.jump(BOTTOM);
      finish();
    } else {
      springBack();
    }
  }

  return (
    <button
      className={styles.lever}
      style={{ height: HEIGHT }}
      disabled={locked}
      aria-label="Pull the lever"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      // Pointer presses are handled above; a click with no pointer (detail 0) is Enter or Space.
      onClick={(e) => {
        if (e.detail === 0) void tapPull();
      }}
    >
      <span className={styles.housing} style={{ top: PIVOT - 20 }} />
      <motion.span className={styles.rod} style={{ top: rodTop, height: rodHeight }} />
      <motion.span
        className={styles.knob}
        style={{ top: knobTop, width: KNOB, height: KNOB, scale: knobScale }}
        data-ready={!locked || undefined}
      />
    </button>
  );
}
