/**
 * Unit tests for the shared elapsed-time clock (#603 — two independent
 * timers for the same scan used to drift apart).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  subscribeElapsedClock,
  unsubscribeElapsedClock,
  formatElapsed,
  elapsedClockNow,
} from '../useElapsedTime';

describe('useElapsedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formatElapsed computes HH:MM:SS from a startedAt against a given now', () => {
    const startedAt = '2026-01-01T00:00:00.000Z';
    const now = new Date('2026-01-01T01:02:03.000Z').getTime();
    expect(formatElapsed(startedAt, now)).toBe('01:02:03');
  });

  it('formatElapsed clamps negative deltas (clock skew) to zero', () => {
    const startedAt = '2026-01-01T01:00:00.000Z';
    const now = new Date('2026-01-01T00:00:00.000Z').getTime();
    expect(formatElapsed(startedAt, now)).toBe('00:00:00');
  });

  it('the shared clock ticks once per second while subscribed, and every subscriber reads the same value', () => {
    subscribeElapsedClock();
    try {
      const before = elapsedClockNow.value;
      vi.advanceTimersByTime(1000);
      expect(elapsedClockNow.value).toBe(before + 1000);

      // A second subscriber does not start a second interval — reading the
      // same ref confirms there's exactly one clock, not one per caller.
      subscribeElapsedClock();
      try {
        vi.advanceTimersByTime(1000);
        expect(elapsedClockNow.value).toBe(before + 2000);
      } finally {
        unsubscribeElapsedClock();
      }
    } finally {
      unsubscribeElapsedClock();
    }
  });

  it('stops ticking once the last subscriber unsubscribes', () => {
    subscribeElapsedClock();
    const value = elapsedClockNow.value;
    unsubscribeElapsedClock();

    vi.advanceTimersByTime(5000);
    expect(elapsedClockNow.value).toBe(value);
  });
});
