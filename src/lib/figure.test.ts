import { describe, expect, it } from 'vitest';
import { EXERCISES, WARMUPS } from '../data/exercises';
import { FIGURES } from '../data/figures';
import { distance, joints, LENGTHS, loopLength, poseAt, solveLimb, type Limb, type Point } from './figure';

const FLOOR = 134;
const VIEW = { left: 20, right: 220, top: -46 };

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

  it('turns relative angles with the torso and shortens with reach', () => {
    const [, end] = solveLimb([0, 0], { rel: [180, 180], reach: 0.5 }, 27, 25, 1, 180);
    expect(end[1]).toBeCloseTo(26); // torso up, so rel 180 points down
  });
});

describe('figures', () => {
  it('covers every exercise and warm-up, and nothing else', () => {
    const ids = [...EXERCISES, ...WARMUPS].map((x) => x.id);
    expect(ids.filter((id) => !FIGURES[id])).toEqual([]);
    expect(Object.keys(FIGURES).filter((id) => !ids.includes(id))).toEqual([]);
  });

  for (const [id, anim] of Object.entries(FIGURES)) {
    it(`${id}: stays in frame and above the floor, and planted hands/feet stay put`, () => {
      const length = loopLength(anim.frames);
      expect(length).toBeGreaterThan(0);
      for (let s = 0; s < length; s += length / 120) {
        const pose = poseAt(anim.frames, s);
        const j = joints(pose);
        const points: Point[] = [j.hip, j.shoulder, j.head, ...Object.values(j.near), ...Object.values(j.far)];
        for (const [x, y] of points) {
          expect(x, `${id} x at ${s.toFixed(2)}s`).toBeGreaterThanOrEqual(VIEW.left);
          expect(x, `${id} x at ${s.toFixed(2)}s`).toBeLessThanOrEqual(VIEW.right);
          expect(y, `${id} y at ${s.toFixed(2)}s`).toBeGreaterThanOrEqual(VIEW.top + LENGTHS.head);
          expect(y, `${id} y at ${s.toFixed(2)}s`).toBeLessThanOrEqual(FLOOR);
        }
        // Feet are planted exactly; hands may drift a little while carrying a moving bar.
        const reaches = (limb: Limb | undefined, end: Point, slack: number) => {
          if (limb && 'at' in limb) expect(distance(end, limb.at), `${id} reach at ${s.toFixed(2)}s`).toBeLessThan(slack);
        };
        reaches(pose.leg, j.near.ankle, 1.5);
        reaches(pose.arm, j.near.hand, 3);
        reaches(pose.farLeg, j.far.ankle, 1.5);
        reaches(pose.farArm, j.far.hand, 3);
      }
    });
  }
});
