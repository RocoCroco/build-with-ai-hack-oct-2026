import { describe, expect, it } from 'vitest';
import { exerciseCountFor } from './draw';
import { addTurn, angleToMinutes, formatMinutes, minutesToAngle, pointerAngle } from './timeWheel';

describe('angleToMinutes', () => {
  it('hits 15 / 45 / 60 / 120 at the quarter points', () => {
    expect(angleToMinutes(0)).toBe(0);
    expect(angleToMinutes(90)).toBe(15);
    expect(angleToMinutes(180)).toBe(45);
    expect(angleToMinutes(270)).toBe(60);
    expect(angleToMinutes(360)).toBe(120);
  });

  it('clamps at both ends', () => {
    expect(angleToMinutes(-30)).toBe(0);
    expect(angleToMinutes(500)).toBe(120);
  });

  it('can select every minute from 0 to 120', () => {
    const seen = new Set<number>();
    for (let a = 0; a <= 360; a += 0.05) seen.add(angleToMinutes(a));
    expect(seen.size).toBe(121);
  });

  it('round-trips through minutesToAngle', () => {
    for (let m = 0; m <= 120; m++) expect(angleToMinutes(minutesToAngle(m))).toBe(m);
  });
});

describe('addTurn', () => {
  it('keeps counting across the top instead of wrapping', () => {
    expect(addTurn(355, 355, 5)).toBe(360); // clamped at a full turn
    expect(addTurn(300, 350, 10)).toBe(320);
  });

  it('cannot go below zero', () => {
    expect(addTurn(10, 10, 340)).toBe(0);
  });
});

describe('pointerAngle', () => {
  it('measures clockwise from the top', () => {
    expect(pointerAngle(0, -10, 0, 0)).toBeCloseTo(0);
    expect(pointerAngle(10, 0, 0, 0)).toBeCloseTo(90);
    expect(pointerAngle(0, 10, 0, 0)).toBeCloseTo(180);
    expect(pointerAngle(-10, 0, 0, 0)).toBeCloseTo(270);
  });
});

describe('formatMinutes', () => {
  it('shows minutes under an hour and h + mm above', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(63)).toBe('1 h 03');
    expect(formatMinutes(120)).toBe('2 h 00');
  });
});

describe('exerciseCountFor', () => {
  it('maps time ranges to exercise counts', () => {
    expect(exerciseCountFor(0)).toBe(0);
    expect(exerciseCountFor(15)).toBe(3);
    expect(exerciseCountFor(20)).toBe(3);
    expect(exerciseCountFor(35)).toBe(4);
    expect(exerciseCountFor(45)).toBe(5);
    expect(exerciseCountFor(60)).toBe(6);
    expect(exerciseCountFor(63)).toBe(6); // small differences give the same result
    expect(exerciseCountFor(90)).toBe(7);
    expect(exerciseCountFor(120)).toBe(8);
  });
});
