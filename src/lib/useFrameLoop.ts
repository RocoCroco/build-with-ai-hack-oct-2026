import { useEffect, useRef } from 'react';

/**
 * Calls `onFrame` on every animation frame with the seconds since the component mounted.
 * The loop subscribes once; each render just swaps in the latest callback. (Motion's
 * `useAnimationFrame` re-subscribes on every render, and a component that re-renders every
 * frame, like the stickman, made its loop stop after a few frames.)
 */
export function useFrameLoop(onFrame: (seconds: number) => void) {
  const latest = useRef(onFrame);
  useEffect(() => {
    latest.current = onFrame;
  });
  useEffect(() => {
    let id = 0;
    let start: number | null = null;
    const loop = (t: number) => {
      start ??= t;
      latest.current((t - start) / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
}
