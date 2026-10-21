import { describe, expect, it } from 'vitest';
import { MUSCLES } from '../data/exercises';
import { beatsLength, celebrateBeats, FLEX, IDLE, IDLE_BEATS, manJoints, pickTapMove, playBeats, TAP_MOVES, type ManPose } from './muscleMan';

// The stickman's viewBox is cropped tight (-10 4 180 208) and may overflow into the free space
// around his box: about 25 units each side, and room above for raised arms.
const VIEW = { left: -35, right: 195, top: -40, bottom: 216 };

function points(pose: ManPose) {
  const j = manJoints(pose);
  return [j.hip, j.neck, j.head, ...j.arms.flatMap((a) => [a.root, a.mid, a.end]), ...j.legs.flatMap((l) => [l.root, l.mid, l.end]), ...j.feet];
}

describe('stickman poses', () => {
  const poses = [...IDLE, ...Object.values(FLEX), ...TAP_MOVES.flatMap((m) => m.beats.map((b) => b.pose))];

  it('keep him inside his frame', () => {
    for (const pose of poses) {
      expect(manJoints(pose).head[1]).toBeGreaterThanOrEqual(VIEW.top + 12); // room for the head
      for (const [x, y] of points(pose)) {
        expect(x).toBeGreaterThanOrEqual(VIEW.left);
        expect(x).toBeLessThanOrEqual(VIEW.right);
        expect(y).toBeGreaterThanOrEqual(VIEW.top + 4);
        expect(y).toBeLessThanOrEqual(VIEW.bottom);
      }
    }
  });

  it('keep the feet near the ground, even in the squat', () => {
    const ground = manJoints(IDLE[0]).feet[0][1];
    for (const pose of poses) {
      // A dance kick may lift one foot; the other stays down.
      const feet = manJoints(pose).feet.map(([, y]) => y);
      expect(Math.max(...feet)).toBeGreaterThan(ground - 8);
    }
  });

  it('have one flex per muscle group', () => {
    expect(Object.keys(FLEX).sort()).toEqual([...MUSCLES].sort());
  });
});

describe('playBeats', () => {
  it('runs a celebration once, featuring each group in order, then ends', () => {
    const beats = celebrateBeats(['chest', 'biceps']);
    expect(playBeats(beats, IDLE[0], 0.6, false)?.feature).toBe('chest');
    expect(playBeats(beats, IDLE[0], 2.6, false)?.feature).toBe('biceps');
    expect(playBeats(beats, IDLE[0], beatsLength(beats) + 0.1, false)).toBeNull();
  });

  it('loops the idle forever', () => {
    expect(playBeats(IDLE_BEATS, IDLE[0], beatsLength(IDLE_BEATS) * 5.5, true)).not.toBeNull();
  });
});

describe('tap moves', () => {
  it('has 3 dances and 5 poses, and never picks the same one twice in a row', () => {
    expect(TAP_MOVES.filter((m) => m.beats.every((b) => !b.feature))).toHaveLength(3);
    expect(TAP_MOVES.filter((m) => m.beats.some((b) => b.feature))).toHaveLength(5);
    for (let last = 0; last < TAP_MOVES.length; last++) {
      for (const r of [0, 0.3, 0.6, 0.999]) {
        const next = pickTapMove(last, () => r);
        expect(next).not.toBe(last);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(TAP_MOVES.length);
      }
    }
    expect(pickTapMove(-1, () => 0.999)).toBe(TAP_MOVES.length - 1);
  });
});
