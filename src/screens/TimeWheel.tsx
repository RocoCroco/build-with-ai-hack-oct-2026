import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from 'motion/react';
import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { playDial, unlockAudio } from '../lib/sound';
import { addTurn, angleToMinutes, MAX_MINUTES, minutesToAngle, pointerAngle } from '../lib/timeWheel';
import styles from './TimeWheel.module.css';

interface Props {
  minutes: number;
  onChange: (minutes: number) => void;
}

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 118;
const TRACK = 26;
const QUARTER_LABELS = [
  { angle: 90, text: '15' },
  { angle: 180, text: '45' },
  { angle: 270, text: '1h' },
];

/** A dial you turn clockwise from the top. The angle maps to minutes non-linearly. */
export function TimeWheel({ minutes, onChange }: Props) {
  const angle = useMotionValue(minutesToAngle(minutes));
  // The knob follows the finger directly; the filled arc trails on a stiff spring for a physical feel.
  const arc = useSpring(angle, { stiffness: 900, damping: 60 });
  const arcLength = useTransform(arc, (a) => Math.max(a / 360, 0.0001));
  const dragging = useRef<{ raw: number } | null>(null);
  const dialRef = useRef<SVGSVGElement>(null);
  const knobRef = useRef<SVGGElement>(null);

  // Move the knob every frame without re-rendering React.
  useMotionValueEvent(angle, 'change', (a) => {
    knobRef.current?.setAttribute('transform', `rotate(${a} ${CENTER} ${CENTER})`);
  });

  function setAngle(next: number) {
    angle.set(next);
    const m = angleToMinutes(next);
    if (m !== minutes) {
      // To go back to the roll's beep, swap this for playTick().
      playDial(m / MAX_MINUTES);
      onChange(m);
    }
  }

  function rawAngle(e: PointerEvent) {
    const box = dialRef.current!.getBoundingClientRect();
    return pointerAngle(e.clientX, e.clientY, box.left + box.width / 2, box.top + box.height / 2);
  }

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    unlockAudio();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = { raw: rawAngle(e) };
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    const raw = rawAngle(e);
    setAngle(addTurn(angle.get(), dragging.current.raw, raw));
    dragging.current.raw = raw;
  }

  function onKeyDown(e: KeyboardEvent) {
    const step = e.shiftKey ? 5 : 1;
    const keys: Record<string, number> = {
      ArrowRight: minutes + step,
      ArrowUp: minutes + step,
      ArrowLeft: minutes - step,
      ArrowDown: minutes - step,
      Home: 0,
      End: MAX_MINUTES,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    unlockAudio();
    setAngle(minutesToAngle(Math.min(Math.max(keys[e.key], 0), MAX_MINUTES)));
  }

  return (
    <svg
      ref={dialRef}
      className={styles.dial}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="slider"
      tabIndex={0}
      aria-label="Time available"
      aria-valuemin={0}
      aria-valuemax={MAX_MINUTES}
      aria-valuenow={minutes}
      aria-valuetext={`${minutes} minutes`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (dragging.current = null)}
      onPointerCancel={() => (dragging.current = null)}
      onKeyDown={onKeyDown}
    >
      <circle className={styles.track} cx={CENTER} cy={CENTER} r={RADIUS} strokeWidth={TRACK} />
      {/* Filled arc from the top, clockwise. Rotated so pathLength starts at 12 o'clock. */}
      <motion.circle
        className={styles.fill}
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        strokeWidth={TRACK}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        style={{ pathLength: arcLength }}
      />
      {QUARTER_LABELS.map(({ angle: a, text }) => {
        const rad = (a * Math.PI) / 180;
        const r = RADIUS - TRACK / 2 - 18;
        return (
          <text
            key={text}
            className={styles.quarter}
            x={CENTER + Math.sin(rad) * r}
            y={CENTER - Math.cos(rad) * r}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {text}
          </text>
        );
      })}
      {/* Start marker at the top: where the turn begins and a full turn (2 h) ends */}
      <path className={styles.start} d={`M ${CENTER - 7} 4 L ${CENTER + 7} 4 L ${CENTER} 14 Z`} />
      {/* The knob rides the track; it rotates around the dial's center */}
      <g ref={knobRef} transform={`rotate(${angle.get()} ${CENTER} ${CENTER})`}>
        <circle className={styles.knob} cx={CENTER} cy={CENTER - RADIUS} r={TRACK / 2 + 6} />
        <path
          className={styles.knobArrow}
          d={`M ${CENTER - 3} ${CENTER - RADIUS - 6} L ${CENTER + 4} ${CENTER - RADIUS} L ${CENTER - 3} ${CENTER - RADIUS + 6}`}
        />
      </g>
    </svg>
  );
}
