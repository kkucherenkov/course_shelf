import { describe, expect, it } from 'vitest';

import { Tag } from './tag';
import { TagCategoryInvalidError, TagNotFoundError, TagSlugAlreadyTakenError } from './tag.errors';
import { DisplayNameInvalidError, EntitySlugInvalidError } from '../shared-vo/shared.errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeTag(
  overrides: Partial<{
    id: string;
    displayName: string;
    slug: string;
    category: string | null;
    externalIds: { source: string; externalId: string; url?: string }[];
  }> = {},
): Tag {
  return Tag.create({
    id: overrides.id ?? 'tag-1',
    displayName: overrides.displayName ?? 'React',
    now: NOW,
    ...(overrides.slug !== undefined && { slug: overrides.slug }),
    // category can be null (explicit clear) vs undefined (not specified) — use 'in' to distinguish
    ...('category' in overrides && { category: overrides.category }),
    ...(overrides.externalIds !== undefined && { externalIds: overrides.externalIds }),
  });
}

// ---------------------------------------------------------------------------
// Tag.create
// ---------------------------------------------------------------------------

describe('Tag.create', () => {
  it('creates a tag with valid props and reads them back', () => {
    const t = makeTag({ slug: 'react' });
    expect(t.slug).toBe('react');
    expect(t.displayName).toBe('React');
    expect(t.category).toBeNull();
    expect(t.externalIds).toHaveLength(0);
    expect(t.createdAt).toEqual(NOW);
    expect(t.updatedAt).toEqual(NOW);
  });

  it('auto-derives slug from displayName when slug is omitted', () => {
    const t = makeTag({ displayName: 'Machine Learning' });
    expect(t.slug).toBe('machine-learning');
  });

  it('stores the category when provided', () => {
    const t = makeTag({ category: 'topic' });
    expect(t.category).toBe('topic');
  });

  it('trims the category on create', () => {
    const t = makeTag({ category: '  topic  ' });
    expect(t.category).toBe('topic');
  });

  it('throws TagCategoryInvalidError when category exceeds 64 chars', () => {
    expect(() => makeTag({ category: 'a'.repeat(65) })).toThrow(TagCategoryInvalidError);
  });

  it('throws DisplayNameInvalidError for empty displayName', () => {
    expect(() => makeTag({ displayName: '   ' })).toThrow(DisplayNameInvalidError);
  });

  it('throws DisplayNameInvalidError for displayName exceeding 200 chars', () => {
    expect(() => makeTag({ displayName: 'a'.repeat(201) })).toThrow(DisplayNameInvalidError);
  });

  it('throws EntitySlugInvalidError for invalid explicit slug', () => {
    expect(() => makeTag({ slug: '-bad' })).toThrow(EntitySlugInvalidError);
  });

  it('accepts valid external ids on creation', () => {
    const t = makeTag({
      externalIds: [{ source: 'taxonomy', externalId: 'T-99' }],
    });
    expect(t.externalIds).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Tag.reconstitute
// ---------------------------------------------------------------------------

describe('Tag.reconstitute', () => {
  it('preserves provided values without re-validating', () => {
    const past = new Date('2025-06-01T00:00:00.000Z');
    const t = Tag.reconstitute({
      id: 'tag-recon' as ReturnType<typeof Tag.reconstitute>['id'],
      slug: 'recon-slug',
      displayName: 'Reconstituted Tag',
      category: 'frameworks',
      externalIds: [{ source: 'udemy', externalId: 'u-42' }],
      createdAt: past,
      updatedAt: past,
    });
    expect(t.slug).toBe('recon-slug');
    expect(t.displayName).toBe('Reconstituted Tag');
    expect(t.category).toBe('frameworks');
    expect(t.externalIds).toHaveLength(1);
    expect(t.createdAt).toEqual(past);
    expect(t.updatedAt).toEqual(past);
  });
});

// ---------------------------------------------------------------------------
// rename
// ---------------------------------------------------------------------------

describe('Tag.rename', () => {
  it('updates displayName and advances updatedAt', () => {
    const t = makeTag();
    const before = t.updatedAt;
    t.rename('Vue');
    expect(t.displayName).toBe('Vue');
    expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('trims whitespace before validating', () => {
    const t = makeTag();
    t.rename('  Angular  ');
    expect(t.displayName).toBe('Angular');
  });

  it('throws DisplayNameInvalidError for blank name', () => {
    const t = makeTag();
    expect(() => t.rename('')).toThrow(DisplayNameInvalidError);
  });
});

// ---------------------------------------------------------------------------
// changeSlug
// ---------------------------------------------------------------------------

describe('Tag.changeSlug', () => {
  it('updates the slug and advances updatedAt', () => {
    const t = makeTag({ slug: 'old-slug' });
    const before = t.updatedAt;
    t.changeSlug('new-slug');
    expect(t.slug).toBe('new-slug');
    expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('throws EntitySlugInvalidError for invalid slug', () => {
    const t = makeTag();
    expect(() => t.changeSlug('--invalid')).toThrow(EntitySlugInvalidError);
  });
});

// ---------------------------------------------------------------------------
// setCategory
// ---------------------------------------------------------------------------

describe('Tag.setCategory', () => {
  it('sets the category and advances updatedAt', () => {
    const t = makeTag();
    const before = t.updatedAt;
    t.setCategory('topic');
    expect(t.category).toBe('topic');
    expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('trims the category value', () => {
    const t = makeTag();
    t.setCategory('  frameworks  ');
    expect(t.category).toBe('frameworks');
  });

  it('clears the category when null is passed', () => {
    const t = makeTag({ category: 'topic' });
    t.setCategory(null);
    expect(t.category).toBeNull();
  });

  it('throws TagCategoryInvalidError when category exceeds 64 chars', () => {
    const t = makeTag();
    expect(() => t.setCategory('a'.repeat(65))).toThrow(TagCategoryInvalidError);
  });

  it('accepts exactly 64-character category without error', () => {
    const t = makeTag();
    t.setCategory('a'.repeat(64));
    expect(t.category).toBe('a'.repeat(64));
  });
});

// ---------------------------------------------------------------------------
// setExternalIds
// ---------------------------------------------------------------------------

describe('Tag.setExternalIds', () => {
  it('replaces the entire external-id set', () => {
    const t = makeTag({ externalIds: [{ source: 'tax', externalId: 'old' }] });
    t.setExternalIds([{ source: 'new-src', externalId: 'n-1' }]);
    expect(t.externalIds).toHaveLength(1);
    expect(t.externalIds[0]!.source).toBe('new-src');
  });

  it('dedupes accidentally-duplicated input — last occurrence wins', () => {
    const t = makeTag();
    t.setExternalIds([
      { source: 'tax', externalId: 'abc', url: 'https://old.example.com' },
      { source: 'tax', externalId: 'abc', url: 'https://new.example.com' },
    ]);
    expect(t.externalIds).toHaveLength(1);
    expect(t.externalIds[0]!.url).toBe('https://new.example.com');
  });

  it('clears all external ids when called with empty array', () => {
    const t = makeTag({ externalIds: [{ source: 'tax', externalId: 'abc' }] });
    t.setExternalIds([]);
    expect(t.externalIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// addExternalId
// ---------------------------------------------------------------------------

describe('Tag.addExternalId', () => {
  it('appends a new external-id ref and advances updatedAt', () => {
    const t = makeTag();
    const before = t.updatedAt;
    t.addExternalId({ source: 'tax', externalId: 'T123' });
    expect(t.externalIds).toHaveLength(1);
    expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('is idempotent — does not add a duplicate (source, externalId) pair', () => {
    const t = makeTag();
    t.addExternalId({ source: 'tax', externalId: 'T123' });
    const afterFirst = t.updatedAt;
    t.addExternalId({ source: 'tax', externalId: 'T123' });
    expect(t.updatedAt).toEqual(afterFirst);
    expect(t.externalIds).toHaveLength(1);
  });

  it('preserves insertion order across multiple adds', () => {
    const t = makeTag();
    t.addExternalId({ source: 'a', externalId: '1' });
    t.addExternalId({ source: 'b', externalId: '2' });
    t.addExternalId({ source: 'c', externalId: '3' });
    expect(t.externalIds.map((r) => r.source)).toEqual(['a', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// removeExternalId
// ---------------------------------------------------------------------------

describe('Tag.removeExternalId', () => {
  it('removes the matching pair and advances updatedAt', () => {
    const t = makeTag({ externalIds: [{ source: 'tax', externalId: 'T123' }] });
    const before = t.updatedAt;
    t.removeExternalId({ source: 'tax', externalId: 'T123' });
    expect(t.externalIds).toHaveLength(0);
    expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('is a no-op when the pair is absent — updatedAt does not advance', () => {
    const t = makeTag();
    const before = t.updatedAt;
    t.removeExternalId({ source: 'tax', externalId: 'MISSING' });
    expect(t.updatedAt).toEqual(before);
    expect(t.externalIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Error class smoke tests
// ---------------------------------------------------------------------------

describe('Tag domain errors', () => {
  it('TagNotFoundError has correct code and status', () => {
    const e = new TagNotFoundError('tag-99');
    expect(e.code).toBe('tag-not-found');
    expect(e.status).toBe(404);
  });

  it('TagSlugAlreadyTakenError has correct code and status', () => {
    const e = new TagSlugAlreadyTakenError('react');
    expect(e.code).toBe('tag-slug-already-taken');
    expect(e.status).toBe(409);
  });

  it('TagCategoryInvalidError has correct code and status', () => {
    const e = new TagCategoryInvalidError(65);
    expect(e.code).toBe('tag-category-invalid');
    expect(e.status).toBe(422);
    expect(e.message).toContain('65');
  });
});
