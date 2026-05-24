import { describe, expect, it } from 'vitest';

import { computeMergedPatch, type CurrentCourseView } from './merge';
import { defaultMergePolicy } from './merge-policy';

import type { ScrapedCourseFragment } from '../scraper/scraper.types';

function makeCurrent(overrides: Partial<CurrentCourseView> = {}): CurrentCourseView {
  const base: CurrentCourseView = {
    title: 'Existing Title',
    description: undefined,
    level: undefined,
    language: undefined,
    posterUrl: undefined,
    releaseDate: undefined,
    ratingAverage: undefined,
    ratingCount: undefined,
    instructors: [],
    studios: [],
    tags: [],
    externalIds: [],
  };
  return { ...base, ...overrides };
}

describe('computeMergedPatch', () => {
  it('merge fills an empty scalar but leaves a present one untouched', () => {
    const current = makeCurrent({ title: 'Keep Me' }); // description absent → treated as empty
    const fragment: ScrapedCourseFragment = { title: 'Scraped Title', description: 'Scraped Desc' };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.description).toBe('Scraped Desc'); // was empty → filled
    expect(patch.title).toBeUndefined(); // already present → omitted
  });

  it('overwrite replaces a present scalar', () => {
    const current = makeCurrent({ title: 'Old' });
    const fragment: ScrapedCourseFragment = { title: 'New' };
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      title: 'overwrite',
    });
    expect(patch.title).toBe('New');
  });

  it('ignore omits the field even when scraped has a value', () => {
    const current = makeCurrent();
    const fragment: ScrapedCourseFragment = { description: 'X' };
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      description: 'ignore',
    });
    expect(patch.description).toBeUndefined();
  });

  it('merge unions instructor names by slug, appending only new ones', () => {
    const current = makeCurrent({ instructors: [{ displayName: 'Jane Doe' }] });
    const fragment: ScrapedCourseFragment = { instructorNames: ['Jane Doe', 'John Roe'] };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.instructorNames).toEqual(['Jane Doe', 'John Roe']);
  });

  it('overwrite arrays replace with scraped names', () => {
    const current = makeCurrent({ tags: [{ displayName: 'old' }] });
    const fragment: ScrapedCourseFragment = { tags: ['new'] };
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      tags: 'overwrite',
    });
    expect(patch.tagNames).toEqual(['new']);
  });

  it('merge unions externalIds by (source, externalId)', () => {
    const current = makeCurrent({ externalIds: [{ source: 'a', externalId: '1' }] });
    const fragment: ScrapedCourseFragment = {
      externalIds: [
        { source: 'a', externalId: '1' },
        { source: 'b', externalId: '2' },
      ],
    };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.externalIds).toEqual([
      { source: 'a', externalId: '1' },
      { source: 'b', externalId: '2' },
    ]);
  });

  it('does not clear an array when scraped provides nothing (even on overwrite)', () => {
    const current = makeCurrent({ tags: [{ displayName: 'keep' }] });
    const fragment: ScrapedCourseFragment = {};
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      tags: 'overwrite',
    });
    expect(patch.tagNames).toBeUndefined();
  });

  it('maps studioName (single) into studioNames union', () => {
    const current = makeCurrent({ studios: [] });
    const fragment: ScrapedCourseFragment = { studioName: 'Acme' };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.studioNames).toEqual(['Acme']);
  });

  it('merge: blank/empty scraped instructor names are dropped, valid ones kept, no throw', () => {
    const current = makeCurrent({ instructors: [{ displayName: 'Alice' }] });
    const fragment: ScrapedCourseFragment = { instructorNames: ['', '   ', 'Bob'] };
    // Must not throw; empty/blank entries are silently dropped
    expect(() => computeMergedPatch(current, fragment, defaultMergePolicy())).not.toThrow();
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.instructorNames).toEqual(['Alice', 'Bob']);
  });

  it('symbol-only scraped tag name does not throw and is included without error', () => {
    const current = makeCurrent({ tags: [] });
    const fragment: ScrapedCourseFragment = { tags: ['---'] };
    // slugify throws on '---'; mergeNames must catch and fall back, never propagate
    expect(() => computeMergedPatch(current, fragment, defaultMergePolicy())).not.toThrow();
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    // '---' trims to '---' (non-empty), so it is kept with a fallback key
    expect(patch.tagNames).toEqual(['---']);
  });
});
