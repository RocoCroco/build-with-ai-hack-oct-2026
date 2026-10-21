import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../data/exercises';
import { FIGURES } from '../data/figures';
import { distance, joints, LENGTHS, loopLength, poseAt, solveLimb } from './figure';

const FLOOR = 134;
const VIEW = { left: 20, right: 220, top: -24 };

describe('solveLimb', () => {
  it('reaches a target in range and keeps both bone lengths', () => {
    const [mid, end] = solveLimb([0, 0], { at: [10, 40] }, 27, 25, 1);
    expect(distance(end, [10, 40])).toBeLessThan(0.01);
    expect(distance([0, 0], mid)).toBeCloseTo(27);
    expect(distance(mid, end)).toBeCloseTo(25);
  });

  it('stretches straight toward a target out of reach', () => {
    const [, end] = solveLimb([0, 0], { at: [0, 200] }, 27, 25, 1);
    expect(end[1]).toBeCloseTo(52, 1);
  });
});

describe('figures', () => {
  for (const [id, anim] of Object.entries(FIGURES)) {
    it(`${id}: is a real exercise, stays in frame, and planted hands/feet stay put`, () => {
      expect(EXERCISES.some((e) => e.id === id)).toBe(true);
      const length = loopLength(anim.frames);
      for (let s = 0; s < length; s += length / 120) {
        const pose = poseAt(anim.frames, s);
        const j = joints(pose);
        for (const [x, y] of Object.values(j)) {
          expect(x).toBeGreaterThanOrEqual(VIEW.left);
          expect(x).toBeLessThanOrEqual(VIEW.right);
          expect(y).toBeGreaterThanOrEqual(VIEW.top + LENGTHS.head);
          expect(y).toBeLessThanOrEqual(FLOOR);
        }
        if ('at' in pose.leg) expect(distance(j.ankle, pose.leg.at)).toBeLessThan(1.5);
        if ('at' in pose.arm) expect(distance(j.hand, pose.arm.at)).toBeLessThan(1.5);
      }
    });
  }
});
