/**
 * Unit tests for the LessonProgress aggregate.
 * Covers: factory invariants, clamp behaviour, threshold crossing idempotency,
 * out-of-order write rejection.
 */
import { describe, expect, it } from 'vitest';

import { LessonProgressInvalidError } from './lesson-progress.errors';
import { LessonProgress } from './lesson-progress';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const T0 = new Date('2026-01-01T00:00:00.000Z');
const T1 = new Date('2026-01-01T00:01:00.000Z');
const T2 = new Date('2026-01-01T00:02:00.000Z');

function startAt(
  positionSeconds: number,
  durationSeconds = 100,
): ReturnType<typeof LessonProgress.start> {
  return LessonProgress.start({
    id: 'lp-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    durationSeconds,
    positionSeconds,
    clientUpdatedAt: T0,
  });
}

// ---------------------------------------------------------------------------
// Factory invariants
// ---------------------------------------------------------------------------

describe('LessonProgress.start', () => {
  it('throws LessonProgressInvalidError when durationSeconds < 1', () => {
    expect(() => startAt(0, 0)).toThrow(LessonProgressInvalidError);
    expect(() => startAt(0, -5)).toThrow(LessonProgressInvalidError);
  });

  it('throws LessonProgressInvalidError when positionSeconds < 0', () => {
    expect(() => startAt(-1, 100)).toThrow(LessonProgressInvalidError);
  });

  it('clamps positionSeconds to durationSeconds when position > duration', () => {
    const { aggregate } = startAt(150, 100);
    expect(aggregate.positionSeconds).toBe(100);
    expect(aggregate.percent).toBe(100);
  });

  it('accepts positionSeconds === 0', () => {
    const { aggregate } = startAt(0, 100);
    expect(aggregate.positionSeconds).toBe(0);
    expect(aggregate.percent).toBe(0);
  });

  it('computes percent rounded to nearest integer', () => {
    const { aggregate } = startAt(33, 100);
    expect(aggregate.percent).toBe(33);
  });

  it('sets completed=false and completedAt=undefined when percent < 90', () => {
    const { aggregate, completedThisCall } = startAt(50, 100);
    expect(aggregate.completed).toBe(false);
    expect(aggregate.completedAt).toBeUndefined();
    expect(completedThisCall).toBe(false);
  });

  it('sets completed=true and completedAt when first record crosses 90 %', () => {
    const { aggregate, completedThisCall } = startAt(95, 100);
    expect(aggregate.completed).toBe(true);
    expect(aggregate.completedAt).toEqual(T0);
    expect(completedThisCall).toBe(true);
  });

  it('sets completed=true when positionSeconds equals durationSeconds', () => {
    const { aggregate, completedThisCall } = startAt(100, 100);
    expect(aggregate.percent).toBe(100);
    expect(aggregate.completed).toBe(true);
    expect(completedThisCall).toBe(true);
  });

  it('returns accepted=true on start', () => {
    const { accepted } = startAt(50, 100);
    expect(accepted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// record()
// ---------------------------------------------------------------------------

describe('LessonProgress.record', () => {
  it('accepts a write with a newer clientUpdatedAt', () => {
    const { aggregate } = startAt(10, 100);
    const result = aggregate.record({ positionSeconds: 20, clientUpdatedAt: T1 });

    expect(result.accepted).toBe(true);
    expect(result.aggregate.positionSeconds).toBe(20);
    expect(result.aggregate.lastSeenAt).toEqual(T1);
  });

  it('ignores a write with an older clientUpdatedAt (returns accepted=false)', () => {
    const { aggregate } = LessonProgress.start({
      id: 'lp-1',
      userId: 'user-1',
      lessonId: 'lesson-1',
      durationSeconds: 100,
      positionSeconds: 50,
      clientUpdatedAt: T1,
    });
    const result = aggregate.record({ positionSeconds: 80, clientUpdatedAt: T0 });

    expect(result.accepted).toBe(false);
    expect(result.aggregate.positionSeconds).toBe(50); // unchanged
    expect(result.completedThisCall).toBe(false);
  });

  it('ignores a write with an equal clientUpdatedAt (accepted=false)', () => {
    const { aggregate } = startAt(50, 100);
    const result = aggregate.record({ positionSeconds: 60, clientUpdatedAt: T0 });

    expect(result.accepted).toBe(false);
    expect(result.aggregate.positionSeconds).toBe(50);
  });

  it('crossing 90 % for the first time returns completedThisCall=true', () => {
    const { aggregate } = startAt(50, 100);
    const result = aggregate.record({ positionSeconds: 92, clientUpdatedAt: T1 });

    expect(result.completedThisCall).toBe(true);
    expect(result.aggregate.completed).toBe(true);
    expect(result.aggregate.completedAt).toEqual(T1);
  });

  it('second write above 90 % does NOT re-emit (completedThisCall=false)', () => {
    const { aggregate } = startAt(50, 100);
    aggregate.record({ positionSeconds: 92, clientUpdatedAt: T1 });
    const second = aggregate.record({ positionSeconds: 95, clientUpdatedAt: T2 });

    expect(second.completedThisCall).toBe(false);
    expect(second.aggregate.completed).toBe(true); // still true
  });

  it('clamps position > duration on record', () => {
    const { aggregate } = startAt(50, 100);
    const result = aggregate.record({ positionSeconds: 150, clientUpdatedAt: T1 });

    expect(result.aggregate.positionSeconds).toBe(100);
    expect(result.aggregate.percent).toBe(100);
  });

  it('a write below threshold after start returns completedThisCall=false', () => {
    const { aggregate } = startAt(10, 100);
    const result = aggregate.record({ positionSeconds: 50, clientUpdatedAt: T1 });

    expect(result.completedThisCall).toBe(false);
    expect(result.aggregate.completed).toBe(false);
  });
});
