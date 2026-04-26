/**
 * Unit tests for the Bookmark aggregate.
 * Covers invariants on create() and update(), label trimming, and the
 * explicit-null label-clear semantic.
 */
import { describe, expect, it } from 'vitest';

import { Bookmark } from './bookmark';
import { BookmarkInvalidError, BookmarkUpdateEmptyError } from './bookmark.errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBase(overrides: Partial<Parameters<typeof Bookmark.create>[0]> = {}): Bookmark {
  return Bookmark.create({
    id: 'bm-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    positionSeconds: 30,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Bookmark.create — invariants
// ---------------------------------------------------------------------------

describe('Bookmark.create', () => {
  it('creates a bookmark with valid params (no label)', () => {
    const bm = makeBase();
    expect(bm.id).toBe('bm-1');
    expect(bm.userId).toBe('user-1');
    expect(bm.lessonId).toBe('lesson-1');
    expect(bm.positionSeconds).toBe(30);
    expect(bm.label).toBeUndefined();
  });

  it('creates a bookmark with a trimmed label', () => {
    const bm = makeBase({ label: '  My note  ' });
    expect(bm.label).toBe('My note');
  });

  it('throws BookmarkInvalidError when positionSeconds < 0', () => {
    expect(() => makeBase({ positionSeconds: -1 })).toThrowError(BookmarkInvalidError);
  });

  it('accepts positionSeconds === 0 (boundary)', () => {
    expect(() => makeBase({ positionSeconds: 0 })).not.toThrow();
  });

  it('throws BookmarkInvalidError for label that is empty after trim', () => {
    expect(() => makeBase({ label: '   ' })).toThrowError(BookmarkInvalidError);
  });

  it('throws BookmarkInvalidError for empty string label', () => {
    expect(() => makeBase({ label: '' })).toThrowError(BookmarkInvalidError);
  });

  it('throws BookmarkInvalidError for label exceeding 200 chars', () => {
    const longLabel = 'a'.repeat(201);
    expect(() => makeBase({ label: longLabel })).toThrowError(BookmarkInvalidError);
  });

  it('accepts label exactly 200 chars', () => {
    const label = 'a'.repeat(200);
    expect(() => makeBase({ label })).not.toThrow();
    expect(makeBase({ label }).label).toHaveLength(200);
  });

  it('stores trimmed label, not the raw input', () => {
    const bm = makeBase({ label: '  hello world  ' });
    expect(bm.label).toBe('hello world');
  });
});

// ---------------------------------------------------------------------------
// Bookmark.update — invariants
// ---------------------------------------------------------------------------

describe('Bookmark.update', () => {
  it('updates positionSeconds when provided', () => {
    const bm = makeBase();
    bm.update({ positionSeconds: 60 });
    expect(bm.positionSeconds).toBe(60);
  });

  it('trims label when updating with a string', () => {
    const bm = makeBase({ label: 'original' });
    bm.update({ label: '  updated  ' });
    expect(bm.label).toBe('updated');
  });

  it('clears label when label === null', () => {
    const bm = makeBase({ label: 'keep me' });
    bm.update({ label: null });
    expect(bm.label).toBeUndefined();
  });

  it('leaves label untouched when label === undefined', () => {
    const bm = makeBase({ label: 'keep me' });
    bm.update({ positionSeconds: 50 });
    expect(bm.label).toBe('keep me');
  });

  it('throws BookmarkUpdateEmptyError when no fields provided', () => {
    const bm = makeBase();
    expect(() => bm.update({})).toThrowError(BookmarkUpdateEmptyError);
  });

  it('throws BookmarkInvalidError when positionSeconds < 0 on update', () => {
    const bm = makeBase();
    expect(() => bm.update({ positionSeconds: -5 })).toThrowError(BookmarkInvalidError);
  });

  it('throws BookmarkInvalidError for empty-after-trim label on update', () => {
    const bm = makeBase();
    expect(() => bm.update({ label: '  ' })).toThrowError(BookmarkInvalidError);
  });

  it('throws BookmarkInvalidError for label over 200 chars on update', () => {
    const bm = makeBase();
    expect(() => bm.update({ label: 'x'.repeat(201) })).toThrowError(BookmarkInvalidError);
  });

  it('updates updatedAt on successful update', () => {
    const bm = makeBase();
    const before = bm.updatedAt;
    bm.update({ positionSeconds: 99 });
    expect(bm.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('can update both positionSeconds and label in one call', () => {
    const bm = makeBase();
    bm.update({ positionSeconds: 100, label: 'chapter start' });
    expect(bm.positionSeconds).toBe(100);
    expect(bm.label).toBe('chapter start');
  });
});
