import { describe, expect, it } from 'vitest';

import { Instructor } from './instructor';
import { InstructorNotFoundError, InstructorSlugAlreadyTakenError } from './instructor.errors';
import { DisplayNameInvalidError, EntitySlugInvalidError } from '../shared-vo/shared.errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeInstructor(
  overrides: Partial<{
    id: string;
    displayName: string;
    slug: string;
    externalIds: { source: string; externalId: string; url?: string }[];
  }> = {},
): Instructor {
  return Instructor.create({
    id: overrides.id ?? 'instr-1',
    displayName: overrides.displayName ?? 'John Doe',
    now: NOW,
    ...(overrides.slug !== undefined && { slug: overrides.slug }),
    ...(overrides.externalIds !== undefined && { externalIds: overrides.externalIds }),
  });
}

// ---------------------------------------------------------------------------
// Instructor.create
// ---------------------------------------------------------------------------

describe('Instructor.create', () => {
  it('creates an instructor with valid props and reads them back', () => {
    const i = makeInstructor({ slug: 'john-doe' });
    expect(i.slug).toBe('john-doe');
    expect(i.displayName).toBe('John Doe');
    expect(i.externalIds).toHaveLength(0);
    expect(i.createdAt).toEqual(NOW);
    expect(i.updatedAt).toEqual(NOW);
  });

  it('auto-derives slug from displayName when slug is omitted', () => {
    const i = makeInstructor({ displayName: 'John Doe' });
    expect(i.slug).toBe('john-doe');
  });

  it('auto-derives slug with special chars ("Jane O\'Brien" → "jane-o-brien")', () => {
    const i = makeInstructor({ displayName: "Jane O'Brien" });
    expect(i.slug).toBe('jane-o-brien');
  });

  it('throws DisplayNameInvalidError for empty displayName', () => {
    expect(() => makeInstructor({ displayName: '   ' })).toThrow(DisplayNameInvalidError);
  });

  it('throws DisplayNameInvalidError for displayName exceeding 200 chars', () => {
    expect(() => makeInstructor({ displayName: 'a'.repeat(201) })).toThrow(DisplayNameInvalidError);
  });

  it('throws EntitySlugInvalidError for invalid explicit slug', () => {
    expect(() => makeInstructor({ slug: '-bad-slug' })).toThrow(EntitySlugInvalidError);
  });

  it('accepts valid external ids on creation', () => {
    const i = makeInstructor({
      externalIds: [{ source: 'youtube', externalId: 'UC123', url: 'https://youtube.com/c/UC123' }],
    });
    expect(i.externalIds).toHaveLength(1);
    expect(i.externalIds[0]!.source).toBe('youtube');
  });
});

// ---------------------------------------------------------------------------
// Instructor.reconstitute
// ---------------------------------------------------------------------------

describe('Instructor.reconstitute', () => {
  it('preserves provided values without re-validating', () => {
    const past = new Date('2025-06-01T00:00:00.000Z');
    const i = Instructor.reconstitute({
      id: 'instr-recon' as ReturnType<typeof Instructor.reconstitute>['id'],
      slug: 'recon-slug',
      displayName: 'Reconstituted Name',
      externalIds: [{ source: 'udemy', externalId: 'u-42' }],
      createdAt: past,
      updatedAt: past,
    });
    expect(i.slug).toBe('recon-slug');
    expect(i.displayName).toBe('Reconstituted Name');
    expect(i.externalIds).toHaveLength(1);
    expect(i.createdAt).toEqual(past);
    expect(i.updatedAt).toEqual(past);
  });
});

// ---------------------------------------------------------------------------
// rename
// ---------------------------------------------------------------------------

describe('Instructor.rename', () => {
  it('updates displayName and advances updatedAt', () => {
    const i = makeInstructor();
    const before = i.updatedAt;
    i.rename('Jane Smith');
    expect(i.displayName).toBe('Jane Smith');
    expect(i.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('trims whitespace before validating', () => {
    const i = makeInstructor();
    i.rename('  Alice  ');
    expect(i.displayName).toBe('Alice');
  });

  it('throws DisplayNameInvalidError for blank name', () => {
    const i = makeInstructor();
    expect(() => i.rename('')).toThrow(DisplayNameInvalidError);
  });

  it('throws DisplayNameInvalidError for name exceeding 200 chars', () => {
    const i = makeInstructor();
    expect(() => i.rename('x'.repeat(201))).toThrow(DisplayNameInvalidError);
  });
});

// ---------------------------------------------------------------------------
// changeSlug
// ---------------------------------------------------------------------------

describe('Instructor.changeSlug', () => {
  it('updates the slug and advances updatedAt', () => {
    const i = makeInstructor({ slug: 'old-slug' });
    const before = i.updatedAt;
    i.changeSlug('new-slug');
    expect(i.slug).toBe('new-slug');
    expect(i.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('throws EntitySlugInvalidError for invalid slug', () => {
    const i = makeInstructor();
    expect(() => i.changeSlug('--invalid')).toThrow(EntitySlugInvalidError);
  });
});

// ---------------------------------------------------------------------------
// setExternalIds
// ---------------------------------------------------------------------------

describe('Instructor.setExternalIds', () => {
  it('replaces the entire external-id set', () => {
    const i = makeInstructor({ externalIds: [{ source: 'youtube', externalId: 'old' }] });
    i.setExternalIds([{ source: 'udemy', externalId: 'u-1' }]);
    expect(i.externalIds).toHaveLength(1);
    expect(i.externalIds[0]!.source).toBe('udemy');
  });

  it('dedupes accidentally-duplicated input by (source, externalId) — last occurrence wins', () => {
    const i = makeInstructor();
    i.setExternalIds([
      { source: 'yt', externalId: 'abc', url: 'https://old.example.com' },
      { source: 'yt', externalId: 'abc', url: 'https://new.example.com' },
    ]);
    expect(i.externalIds).toHaveLength(1);
    expect(i.externalIds[0]!.url).toBe('https://new.example.com');
  });

  it('clears all external ids when called with empty array', () => {
    const i = makeInstructor({ externalIds: [{ source: 'yt', externalId: 'abc' }] });
    i.setExternalIds([]);
    expect(i.externalIds).toHaveLength(0);
  });

  it('advances updatedAt even when clearing', () => {
    const i = makeInstructor();
    const before = i.updatedAt;
    i.setExternalIds([]);
    expect(i.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

// ---------------------------------------------------------------------------
// addExternalId
// ---------------------------------------------------------------------------

describe('Instructor.addExternalId', () => {
  it('appends a new external-id ref and advances updatedAt', () => {
    const i = makeInstructor();
    const before = i.updatedAt;
    i.addExternalId({ source: 'yt', externalId: 'UC123' });
    expect(i.externalIds).toHaveLength(1);
    expect(i.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('is idempotent — does not add a duplicate (source, externalId) pair', () => {
    const i = makeInstructor();
    i.addExternalId({ source: 'yt', externalId: 'UC123' });
    const afterFirst = i.updatedAt;
    i.addExternalId({ source: 'yt', externalId: 'UC123' });
    // updatedAt must not advance on a no-op add
    expect(i.updatedAt).toEqual(afterFirst);
    expect(i.externalIds).toHaveLength(1);
  });

  it('preserves insertion order across multiple adds', () => {
    const i = makeInstructor();
    i.addExternalId({ source: 'a', externalId: '1' });
    i.addExternalId({ source: 'b', externalId: '2' });
    i.addExternalId({ source: 'c', externalId: '3' });
    expect(i.externalIds.map((r) => r.source)).toEqual(['a', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// removeExternalId
// ---------------------------------------------------------------------------

describe('Instructor.removeExternalId', () => {
  it('removes the matching (source, externalId) pair and advances updatedAt', () => {
    const i = makeInstructor({ externalIds: [{ source: 'yt', externalId: 'UC123' }] });
    const before = i.updatedAt;
    i.removeExternalId({ source: 'yt', externalId: 'UC123' });
    expect(i.externalIds).toHaveLength(0);
    expect(i.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('is a no-op when the pair is absent — updatedAt does not advance', () => {
    const i = makeInstructor();
    const before = i.updatedAt;
    i.removeExternalId({ source: 'yt', externalId: 'MISSING' });
    expect(i.updatedAt).toEqual(before);
    expect(i.externalIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Error class smoke tests
// ---------------------------------------------------------------------------

describe('Instructor domain errors', () => {
  it('InstructorNotFoundError has correct code and status', () => {
    const e = new InstructorNotFoundError('instr-99');
    expect(e.code).toBe('instructor-not-found');
    expect(e.status).toBe(404);
  });

  it('InstructorSlugAlreadyTakenError has correct code and status', () => {
    const e = new InstructorSlugAlreadyTakenError('john-doe');
    expect(e.code).toBe('instructor-slug-already-taken');
    expect(e.status).toBe(409);
  });
});
