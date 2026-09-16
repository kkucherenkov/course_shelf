/**
 * Unit tests for the Flashcard aggregate.
 * Covers invariants on create()/update(), grade() delegation to the pure
 * SM-2 function, and the sourceCueId passthrough.
 */
import { describe, expect, it } from 'vitest';

import { Flashcard } from './flashcard';
import { FlashcardInvalidError, FlashcardUpdateEmptyError } from './flashcard.errors';
import { INITIAL_EASE_FACTOR } from './review-schedule';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBase(overrides: Partial<Parameters<typeof Flashcard.create>[0]> = {}): Flashcard {
  return Flashcard.create({
    id: 'fc-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    front: 'What is an aggregate?',
    back: 'A cluster of domain objects treated as a unit for data changes.',
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Flashcard.create — invariants
// ---------------------------------------------------------------------------

describe('Flashcard.create', () => {
  it('creates a card with valid front/back', () => {
    const fc = makeBase();
    expect(fc.id).toBe('fc-1');
    expect(fc.userId).toBe('user-1');
    expect(fc.lessonId).toBe('lesson-1');
    expect(fc.sourceCueId).toBeUndefined();
  });

  it('is due immediately with the initial ease factor', () => {
    const fc = makeBase();
    expect(fc.schedule.repetitions).toBe(0);
    expect(fc.schedule.intervalDays).toBe(0);
    expect(fc.schedule.easeFactor).toBe(INITIAL_EASE_FACTOR);
    expect(fc.schedule.dueAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('trims front and back', () => {
    const fc = makeBase({ front: '  Q?  ', back: '  A.  ' });
    expect(fc.front).toBe('Q?');
    expect(fc.back).toBe('A.');
  });

  it('stores sourceCueId when provided', () => {
    const fc = makeBase({ sourceCueId: 'cue-1' });
    expect(fc.sourceCueId).toBe('cue-1');
  });

  it('throws FlashcardInvalidError when front is empty after trim', () => {
    expect(() => makeBase({ front: '   ' })).toThrowError(FlashcardInvalidError);
  });

  it('throws FlashcardInvalidError when back is empty after trim', () => {
    expect(() => makeBase({ back: '' })).toThrowError(FlashcardInvalidError);
  });

  it('throws FlashcardInvalidError when front exceeds 2000 chars', () => {
    expect(() => makeBase({ front: 'a'.repeat(2001) })).toThrowError(FlashcardInvalidError);
  });

  it('accepts front/back exactly 2000 chars', () => {
    const text = 'a'.repeat(2000);
    expect(() => makeBase({ front: text, back: text })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Flashcard.update — invariants
// ---------------------------------------------------------------------------

describe('Flashcard.update', () => {
  it('updates front only', () => {
    const fc = makeBase();
    fc.update({ front: 'New question?' });
    expect(fc.front).toBe('New question?');
    expect(fc.back).toBe('A cluster of domain objects treated as a unit for data changes.');
  });

  it('updates back only', () => {
    const fc = makeBase();
    fc.update({ back: 'New answer.' });
    expect(fc.back).toBe('New answer.');
  });

  it('throws FlashcardUpdateEmptyError when no fields provided', () => {
    const fc = makeBase();
    expect(() => fc.update({})).toThrowError(FlashcardUpdateEmptyError);
  });

  it('throws FlashcardInvalidError for empty-after-trim front on update', () => {
    const fc = makeBase();
    expect(() => fc.update({ front: '   ' })).toThrowError(FlashcardInvalidError);
  });

  it('does not touch the review schedule', () => {
    const fc = makeBase();
    const before = fc.schedule;
    fc.update({ front: 'Different?' });
    expect(fc.schedule).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// Flashcard.grade — delegates to the pure SM-2 function
// ---------------------------------------------------------------------------

describe('Flashcard.grade', () => {
  const NOW = new Date('2026-02-01T00:00:00.000Z');

  it('advances repetitions and interval on a passing grade', () => {
    const fc = makeBase();
    fc.grade(5, NOW);
    expect(fc.schedule.repetitions).toBe(1);
    expect(fc.schedule.intervalDays).toBe(1);
    expect(fc.schedule.dueAt.getTime()).toBe(NOW.getTime() + 24 * 60 * 60 * 1000);
  });

  it('resets repetitions on a lapse grade', () => {
    const fc = makeBase();
    fc.grade(5, NOW);
    fc.grade(1, NOW);
    expect(fc.schedule.repetitions).toBe(0);
  });

  it('uses the supplied clock, not Date.now(), for updatedAt and dueAt', () => {
    const fc = makeBase();
    fc.grade(4, NOW);
    expect(fc.updatedAt).toEqual(NOW);
  });

  it('throws FlashcardInvalidError for a non-integer grade', () => {
    const fc = makeBase();
    expect(() => fc.grade(3.5, NOW)).toThrowError(FlashcardInvalidError);
  });

  it('throws FlashcardInvalidError for a grade out of the 0..5 range', () => {
    const fc = makeBase();
    expect(() => fc.grade(6, NOW)).toThrowError(FlashcardInvalidError);
    expect(() => fc.grade(-1, NOW)).toThrowError(FlashcardInvalidError);
  });
});
