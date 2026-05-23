import { describe, expect, it } from 'vitest';

import { Studio } from './studio';
import { StudioNotFoundError, StudioSlugAlreadyTakenError } from './studio.errors';
import { DisplayNameInvalidError, EntitySlugInvalidError } from '../shared-vo/shared.errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeStudio(
  overrides: Partial<{
    id: string;
    displayName: string;
    slug: string;
    externalIds: { source: string; externalId: string; url?: string }[];
  }> = {},
): Studio {
  return Studio.create({
    id: overrides.id ?? 'studio-1',
    displayName: overrides.displayName ?? 'Acme Studio',
    now: NOW,
    ...(overrides.slug !== undefined && { slug: overrides.slug }),
    ...(overrides.externalIds !== undefined && { externalIds: overrides.externalIds }),
  });
}

// ---------------------------------------------------------------------------
// Studio.create
// ---------------------------------------------------------------------------

describe('Studio.create', () => {
  it('creates a studio with valid props and reads them back', () => {
    const s = makeStudio({ slug: 'acme-studio' });
    expect(s.slug).toBe('acme-studio');
    expect(s.displayName).toBe('Acme Studio');
    expect(s.externalIds).toHaveLength(0);
    expect(s.createdAt).toEqual(NOW);
    expect(s.updatedAt).toEqual(NOW);
  });

  it('auto-derives slug from displayName when slug is omitted', () => {
    const s = makeStudio({ displayName: 'Big Fish Studio' });
    expect(s.slug).toBe('big-fish-studio');
  });

  it('auto-derives slug collapsing special chars', () => {
    const s = makeStudio({ displayName: 'Studio #1 — Pro' });
    expect(s.slug).toBe('studio-1-pro');
  });

  it('throws DisplayNameInvalidError for empty displayName', () => {
    expect(() => makeStudio({ displayName: '   ' })).toThrow(DisplayNameInvalidError);
  });

  it('throws DisplayNameInvalidError for displayName exceeding 200 chars', () => {
    expect(() => makeStudio({ displayName: 'a'.repeat(201) })).toThrow(DisplayNameInvalidError);
  });

  it('throws EntitySlugInvalidError for invalid explicit slug', () => {
    expect(() => makeStudio({ slug: '-bad' })).toThrow(EntitySlugInvalidError);
  });

  it('accepts valid external ids on creation', () => {
    const s = makeStudio({
      externalIds: [{ source: 'vimeo', externalId: 'V999', url: 'https://vimeo.com/V999' }],
    });
    expect(s.externalIds).toHaveLength(1);
    expect(s.externalIds[0]!.source).toBe('vimeo');
  });
});

// ---------------------------------------------------------------------------
// Studio.reconstitute
// ---------------------------------------------------------------------------

describe('Studio.reconstitute', () => {
  it('preserves provided values without re-validating', () => {
    const past = new Date('2025-06-01T00:00:00.000Z');
    const s = Studio.reconstitute({
      id: 'studio-recon' as ReturnType<typeof Studio.reconstitute>['id'],
      slug: 'recon-slug',
      displayName: 'Reconstituted Studio',
      externalIds: [{ source: 'udemy', externalId: 'u-42' }],
      createdAt: past,
      updatedAt: past,
    });
    expect(s.slug).toBe('recon-slug');
    expect(s.displayName).toBe('Reconstituted Studio');
    expect(s.externalIds).toHaveLength(1);
    expect(s.createdAt).toEqual(past);
    expect(s.updatedAt).toEqual(past);
  });
});

// ---------------------------------------------------------------------------
// rename
// ---------------------------------------------------------------------------

describe('Studio.rename', () => {
  it('updates displayName and advances updatedAt', () => {
    const s = makeStudio();
    const before = s.updatedAt;
    s.rename('New Name');
    expect(s.displayName).toBe('New Name');
    expect(s.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('trims whitespace before validating', () => {
    const s = makeStudio();
    s.rename('  Trimmed  ');
    expect(s.displayName).toBe('Trimmed');
  });

  it('throws DisplayNameInvalidError for blank name', () => {
    const s = makeStudio();
    expect(() => s.rename('')).toThrow(DisplayNameInvalidError);
  });

  it('throws DisplayNameInvalidError for name exceeding 200 chars', () => {
    const s = makeStudio();
    expect(() => s.rename('x'.repeat(201))).toThrow(DisplayNameInvalidError);
  });
});

// ---------------------------------------------------------------------------
// changeSlug
// ---------------------------------------------------------------------------

describe('Studio.changeSlug', () => {
  it('updates the slug and advances updatedAt', () => {
    const s = makeStudio({ slug: 'old-slug' });
    const before = s.updatedAt;
    s.changeSlug('new-slug');
    expect(s.slug).toBe('new-slug');
    expect(s.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('throws EntitySlugInvalidError for invalid slug', () => {
    const s = makeStudio();
    expect(() => s.changeSlug('--invalid')).toThrow(EntitySlugInvalidError);
  });
});

// ---------------------------------------------------------------------------
// setExternalIds
// ---------------------------------------------------------------------------

describe('Studio.setExternalIds', () => {
  it('replaces the entire external-id set', () => {
    const s = makeStudio({ externalIds: [{ source: 'vimeo', externalId: 'old' }] });
    s.setExternalIds([{ source: 'udemy', externalId: 'u-1' }]);
    expect(s.externalIds).toHaveLength(1);
    expect(s.externalIds[0]!.source).toBe('udemy');
  });

  it('dedupes accidentally-duplicated input — last occurrence wins', () => {
    const s = makeStudio();
    s.setExternalIds([
      { source: 'yt', externalId: 'abc', url: 'https://old.example.com' },
      { source: 'yt', externalId: 'abc', url: 'https://new.example.com' },
    ]);
    expect(s.externalIds).toHaveLength(1);
    expect(s.externalIds[0]!.url).toBe('https://new.example.com');
  });

  it('clears all external ids when called with empty array', () => {
    const s = makeStudio({ externalIds: [{ source: 'yt', externalId: 'abc' }] });
    s.setExternalIds([]);
    expect(s.externalIds).toHaveLength(0);
  });

  it('advances updatedAt even when clearing', () => {
    const s = makeStudio();
    const before = s.updatedAt;
    s.setExternalIds([]);
    expect(s.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

// ---------------------------------------------------------------------------
// addExternalId
// ---------------------------------------------------------------------------

describe('Studio.addExternalId', () => {
  it('appends a new external-id ref and advances updatedAt', () => {
    const s = makeStudio();
    const before = s.updatedAt;
    s.addExternalId({ source: 'vimeo', externalId: 'V123' });
    expect(s.externalIds).toHaveLength(1);
    expect(s.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('is idempotent — does not add a duplicate (source, externalId) pair', () => {
    const s = makeStudio();
    s.addExternalId({ source: 'vimeo', externalId: 'V123' });
    const afterFirst = s.updatedAt;
    s.addExternalId({ source: 'vimeo', externalId: 'V123' });
    expect(s.updatedAt).toEqual(afterFirst);
    expect(s.externalIds).toHaveLength(1);
  });

  it('preserves insertion order across multiple adds', () => {
    const s = makeStudio();
    s.addExternalId({ source: 'a', externalId: '1' });
    s.addExternalId({ source: 'b', externalId: '2' });
    s.addExternalId({ source: 'c', externalId: '3' });
    expect(s.externalIds.map((r) => r.source)).toEqual(['a', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// removeExternalId
// ---------------------------------------------------------------------------

describe('Studio.removeExternalId', () => {
  it('removes the matching pair and advances updatedAt', () => {
    const s = makeStudio({ externalIds: [{ source: 'vimeo', externalId: 'V123' }] });
    const before = s.updatedAt;
    s.removeExternalId({ source: 'vimeo', externalId: 'V123' });
    expect(s.externalIds).toHaveLength(0);
    expect(s.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('is a no-op when the pair is absent — updatedAt does not advance', () => {
    const s = makeStudio();
    const before = s.updatedAt;
    s.removeExternalId({ source: 'vimeo', externalId: 'MISSING' });
    expect(s.updatedAt).toEqual(before);
    expect(s.externalIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Error class smoke tests
// ---------------------------------------------------------------------------

describe('Studio domain errors', () => {
  it('StudioNotFoundError has correct code and status', () => {
    const e = new StudioNotFoundError('studio-99');
    expect(e.code).toBe('studio-not-found');
    expect(e.status).toBe(404);
  });

  it('StudioSlugAlreadyTakenError has correct code and status', () => {
    const e = new StudioSlugAlreadyTakenError('acme-studio');
    expect(e.code).toBe('studio-slug-already-taken');
    expect(e.status).toBe(409);
  });
});
