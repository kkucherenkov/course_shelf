import { describe, expect, it } from 'vitest';

import { Course } from './course';
import type { CourseLevel } from './course';
import {
  CourseLanguageInvalidError,
  CourseRatingInvalidError,
  CourseSlugInvalidError,
  CourseTitleInvalidError,
  SectionNotFoundError,
  SectionPositionConflictError,
  SectionPositionOutOfRangeError,
} from './course.errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCourse(
  overrides: Partial<{
    id: string;
    libraryId: string;
    slug: string;
    title: string;
    description: string;
  }> = {},
): Course {
  const base = {
    id: overrides.id ?? 'course-1',
    libraryId: overrides.libraryId ?? 'lib-1',
    slug: overrides.slug ?? 'my-course',
    title: overrides.title ?? 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
  };
  if (overrides.description !== undefined) {
    return Course.create({ ...base, description: overrides.description });
  }
  return Course.create(base);
}

// ---------------------------------------------------------------------------
// Course.create invariants
// ---------------------------------------------------------------------------

describe('Course.create', () => {
  it('creates a course with valid props', () => {
    const c = makeCourse();
    expect(c.slug).toBe('my-course');
    expect(c.title).toBe('My Course');
    expect(c.sections).toHaveLength(0);
  });

  it('throws CourseSlugInvalidError for invalid slug', () => {
    expect(() => makeCourse({ slug: '-bad-slug' })).toThrow(CourseSlugInvalidError);
  });

  it('throws CourseTitleInvalidError for blank title', () => {
    expect(() => makeCourse({ title: '   ' })).toThrow(CourseTitleInvalidError);
  });
});

// ---------------------------------------------------------------------------
// addSection
// ---------------------------------------------------------------------------

describe('Course.addSection', () => {
  it('appends at next position when position omitted', () => {
    const c = makeCourse();
    c.addSection({ id: 's1', title: 'Intro' });
    c.addSection({ id: 's2', title: 'Advanced' });

    expect(c.sections).toHaveLength(2);
    expect(c.sections[0]!.position).toBe(1);
    expect(c.sections[1]!.position).toBe(2);
  });

  it('respects an explicit position', () => {
    const c = makeCourse();
    c.addSection({ id: 's1', title: 'Intro', position: 3 });
    expect(c.sections[0]!.position).toBe(3);
  });

  it('throws SectionPositionConflictError on duplicate id', () => {
    const c = makeCourse();
    c.addSection({ id: 's1', title: 'Intro' });
    expect(() => c.addSection({ id: 's1', title: 'Duplicate' })).toThrow(
      SectionPositionConflictError,
    );
  });

  it('throws SectionPositionConflictError on duplicate position', () => {
    const c = makeCourse();
    c.addSection({ id: 's1', title: 'Intro', position: 2 });
    expect(() => c.addSection({ id: 's2', title: 'Other', position: 2 })).toThrow(
      SectionPositionConflictError,
    );
  });
});

function makeCourseWithSections(): Course {
  const c = makeCourse();
  c.addSection({ id: 's1', title: 'A' });
  c.addSection({ id: 's2', title: 'B' });
  c.addSection({ id: 's3', title: 'C' });
  return c;
}

// ---------------------------------------------------------------------------
// reorderSection
// ---------------------------------------------------------------------------

describe('Course.reorderSection', () => {
  it('moves a section to a new position, repacking others', () => {
    const c = makeCourseWithSections();
    c.reorderSection('s3', 1);

    const ids = c.sections.map((s) => s.id);
    expect(ids).toEqual(['s3', 's1', 's2']);
    expect(c.sections.map((s) => s.position)).toEqual([1, 2, 3]);
  });

  it('is a no-op when section already at target position', () => {
    const c = makeCourseWithSections();
    c.reorderSection('s1', 1);
    expect(c.sections.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
  });

  it('throws SectionNotFoundError for unknown sectionId', () => {
    const c = makeCourseWithSections();
    expect(() => c.reorderSection('unknown', 1)).toThrow(SectionNotFoundError);
  });

  it('throws SectionPositionOutOfRangeError when newPosition < 1', () => {
    const c = makeCourseWithSections();
    expect(() => c.reorderSection('s1', 0)).toThrow(SectionPositionOutOfRangeError);
  });

  it('throws SectionPositionOutOfRangeError when newPosition > sections.length', () => {
    const c = makeCourseWithSections();
    expect(() => c.reorderSection('s1', 4)).toThrow(SectionPositionOutOfRangeError);
  });
});

// ---------------------------------------------------------------------------
// renameSection
// ---------------------------------------------------------------------------

describe('Course.renameSection', () => {
  it('updates the title of an existing section', () => {
    const c = makeCourse();
    c.addSection({ id: 's1', title: 'Old Title' });
    c.renameSection('s1', 'New Title');
    expect(c.sections[0]!.title).toBe('New Title');
  });

  it('throws SectionNotFoundError for unknown sectionId', () => {
    const c = makeCourse();
    expect(() => c.renameSection('unknown', 'Title')).toThrow(SectionNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// removeSection
// ---------------------------------------------------------------------------

describe('Course.removeSection', () => {
  it('removes the section and repacks positions', () => {
    const c = makeCourse();
    c.addSection({ id: 's1', title: 'A' });
    c.addSection({ id: 's2', title: 'B' });
    c.addSection({ id: 's3', title: 'C' });

    c.removeSection('s2');

    expect(c.sections).toHaveLength(2);
    expect(c.sections.map((s) => s.id)).toEqual(['s1', 's3']);
    expect(c.sections.map((s) => s.position)).toEqual([1, 2]);
  });

  it('throws SectionNotFoundError for unknown sectionId', () => {
    const c = makeCourse();
    expect(() => c.removeSection('unknown')).toThrow(SectionNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// rename / setDescription / changeSlug round-trips
// ---------------------------------------------------------------------------

describe('Course metadata mutations', () => {
  it('rename updates the title', () => {
    const c = makeCourse();
    c.rename('Updated Title');
    expect(c.title).toBe('Updated Title');
  });

  it('rename throws CourseTitleInvalidError for blank title', () => {
    const c = makeCourse();
    expect(() => c.rename('')).toThrow(CourseTitleInvalidError);
  });

  it('setDescription updates description', () => {
    const c = makeCourse();
    c.setDescription('A great course');
    expect(c.description).toBe('A great course');
  });

  it('setDescription clears description when undefined', () => {
    const c = makeCourse({ description: 'old' });
    c.setDescription(undefined);
    expect(c.description).toBeUndefined();
  });

  it('setDescription clears description when empty string', () => {
    const c = makeCourse({ description: 'old' });
    c.setDescription('');
    expect(c.description).toBeUndefined();
  });

  it('changeSlug updates the slug', () => {
    const c = makeCourse();
    c.changeSlug('new-slug-123');
    expect(c.slug).toBe('new-slug-123');
  });

  it('changeSlug throws CourseSlugInvalidError for invalid slug', () => {
    const c = makeCourse();
    expect(() => c.changeSlug('-invalid')).toThrow(CourseSlugInvalidError);
  });
});

// ---------------------------------------------------------------------------
// Enrichment metadata: posterUrl / posterStoragePath
// ---------------------------------------------------------------------------

describe('Course.setPosterUrl', () => {
  it('sets and reads back the poster URL', () => {
    const c = makeCourse();
    c.setPosterUrl('https://example.com/poster.jpg');
    expect(c.posterUrl).toBe('https://example.com/poster.jpg');
  });

  it('clears the poster URL when undefined is passed', () => {
    const c = makeCourse();
    c.setPosterUrl('https://example.com/poster.jpg');
    c.setPosterUrl(undefined);
    expect(c.posterUrl).toBeUndefined();
  });

  it('advances updatedAt on set', () => {
    const c = makeCourse();
    const before = c.updatedAt;
    c.setPosterUrl('https://example.com/poster.jpg');
    expect(c.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('Course.setPosterStoragePath', () => {
  it('sets and clears the poster storage path', () => {
    const c = makeCourse();
    c.setPosterStoragePath('/storage/posters/abc.jpg');
    expect(c.posterStoragePath).toBe('/storage/posters/abc.jpg');
    c.setPosterStoragePath(undefined);
    expect(c.posterStoragePath).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Enrichment metadata: level
// ---------------------------------------------------------------------------

describe('Course.setLevel', () => {
  it('sets a valid CourseLevel and reads it back', () => {
    const c = makeCourse();
    c.setLevel('intermediate');
    expect(c.level).toBe('intermediate');
  });

  it('clears the level when undefined is passed', () => {
    const c = makeCourse();
    c.setLevel('beginner');
    c.setLevel(undefined);
    expect(c.level).toBeUndefined();
  });

  it('throws CourseRatingInvalidError for an invalid level string (cast)', () => {
    const c = makeCourse();
    // Cast through unknown to test the runtime guard path
    expect(() => c.setLevel('wizard' as CourseLevel)).toThrow(CourseRatingInvalidError);
  });

  it('accepts all valid levels', () => {
    const c = makeCourse();
    const levels: CourseLevel[] = ['beginner', 'intermediate', 'advanced', 'expert', 'all_levels'];
    for (const level of levels) {
      c.setLevel(level);
      expect(c.level).toBe(level);
    }
  });
});

// ---------------------------------------------------------------------------
// Enrichment metadata: language
// ---------------------------------------------------------------------------

describe('Course.setLanguage', () => {
  it('sets a valid BCP-47 tag and normalises casing ("en-us" → "en-US")', () => {
    const c = makeCourse();
    c.setLanguage('en-us');
    expect(c.language).toBe('en-US');
  });

  it('accepts a simple two-letter tag', () => {
    const c = makeCourse();
    c.setLanguage('fr');
    expect(c.language).toBe('fr');
  });

  it('clears the language when undefined is passed', () => {
    const c = makeCourse();
    c.setLanguage('en');
    c.setLanguage(undefined);
    expect(c.language).toBeUndefined();
  });

  it('throws CourseLanguageInvalidError for a subtag longer than 8 chars', () => {
    const c = makeCourse();
    expect(() => c.setLanguage('xxx-yyy-1234567890')).toThrow(CourseLanguageInvalidError);
  });

  it('throws CourseLanguageInvalidError for a single-char primary tag', () => {
    const c = makeCourse();
    expect(() => c.setLanguage('X')).toThrow(CourseLanguageInvalidError);
  });
});

// ---------------------------------------------------------------------------
// Enrichment metadata: releaseDate
// ---------------------------------------------------------------------------

describe('Course.setReleaseDate', () => {
  it('sets and reads back the release date', () => {
    const c = makeCourse();
    const d = new Date('2024-03-15T00:00:00.000Z');
    c.setReleaseDate(d);
    expect(c.releaseDate).toEqual(d);
  });

  it('clears the release date when undefined is passed', () => {
    const c = makeCourse();
    c.setReleaseDate(new Date());
    c.setReleaseDate(undefined);
    expect(c.releaseDate).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Enrichment metadata: rating
// ---------------------------------------------------------------------------

describe('Course.setRating', () => {
  it('sets a valid rating and reads it back', () => {
    const c = makeCourse();
    c.setRating(4.7, 150);
    expect(c.ratingAverage).toBe(4.7);
    expect(c.ratingCount).toBe(150);
  });

  it('clears both fields when both undefined are passed', () => {
    const c = makeCourse();
    c.setRating(4, 100);
    c.setRating(undefined, undefined);
    expect(c.ratingAverage).toBeUndefined();
    expect(c.ratingCount).toBeUndefined();
  });

  it('accepts boundary values avg=0, count=0', () => {
    const c = makeCourse();
    c.setRating(0, 0);
    expect(c.ratingAverage).toBe(0);
    expect(c.ratingCount).toBe(0);
  });

  it('accepts avg=5 (upper boundary)', () => {
    const c = makeCourse();
    c.setRating(5, 1);
    expect(c.ratingAverage).toBe(5);
  });

  it('throws CourseRatingInvalidError when avg > 5', () => {
    const c = makeCourse();
    expect(() => c.setRating(5.1, 10)).toThrow(CourseRatingInvalidError);
  });

  it('throws CourseRatingInvalidError when avg < 0', () => {
    const c = makeCourse();
    expect(() => c.setRating(-0.1, 10)).toThrow(CourseRatingInvalidError);
  });

  it('throws CourseRatingInvalidError when count is negative', () => {
    const c = makeCourse();
    expect(() => c.setRating(3, -1)).toThrow(CourseRatingInvalidError);
  });

  it('throws CourseRatingInvalidError when count is not an integer', () => {
    const c = makeCourse();
    expect(() => c.setRating(3, 3.7)).toThrow(CourseRatingInvalidError);
  });

  it('throws CourseRatingInvalidError when only one of avg/count is undefined', () => {
    const c = makeCourse();
    expect(() => c.setRating(undefined, 10)).toThrow(CourseRatingInvalidError);
    expect(() => c.setRating(3, undefined)).toThrow(CourseRatingInvalidError);
  });
});

// ---------------------------------------------------------------------------
// Enrichment metadata: instructors / studios / tags
// ---------------------------------------------------------------------------

describe('Course.setInstructors', () => {
  it('replaces instructor links and reads them back', () => {
    const c = makeCourse();
    c.setInstructors([
      { id: 'i-1', slug: 'alice', displayName: 'Alice' },
      { id: 'i-2', slug: 'bob', displayName: 'Bob' },
    ]);
    expect(c.instructors).toHaveLength(2);
    expect(c.instructors[0]!.id).toBe('i-1');
  });

  it('dedupes by id — first occurrence wins', () => {
    const c = makeCourse();
    c.setInstructors([
      { id: 'i-1', slug: 'alice', displayName: 'Alice' },
      { id: 'i-1', slug: 'alice-dup', displayName: 'Alice Dup' },
    ]);
    expect(c.instructors).toHaveLength(1);
    expect(c.instructors[0]!.slug).toBe('alice');
  });

  it('clears links when called with empty array', () => {
    const c = makeCourse();
    c.setInstructors([{ id: 'i-1', slug: 'alice', displayName: 'Alice' }]);
    c.setInstructors([]);
    expect(c.instructors).toHaveLength(0);
  });

  it('advances updatedAt', () => {
    const c = makeCourse();
    const before = c.updatedAt;
    c.setInstructors([]);
    expect(c.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('Course.setStudios', () => {
  it('replaces studio links', () => {
    const c = makeCourse();
    c.setStudios([{ id: 's-1', slug: 'acme', displayName: 'Acme Studio' }]);
    expect(c.studios).toHaveLength(1);
    expect(c.studios[0]!.id).toBe('s-1');
  });
});

describe('Course.setTags', () => {
  it('replaces tag links', () => {
    const c = makeCourse();
    c.setTags([
      { id: 't-1', slug: 'react', displayName: 'React', category: 'framework' },
      { id: 't-2', slug: 'ts', displayName: 'TypeScript', category: null },
    ]);
    expect(c.tags).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Enrichment metadata: externalIds
// ---------------------------------------------------------------------------

describe('Course.setExternalIds', () => {
  it('validates and stores external ids', () => {
    const c = makeCourse();
    c.setExternalIds([
      { source: 'udemy', externalId: 'C-100', url: 'https://udemy.com/course/C-100' },
    ]);
    expect(c.externalIds).toHaveLength(1);
    expect(c.externalIds[0]!.source).toBe('udemy');
  });

  it('dedupes by (source, externalId) — first occurrence wins', () => {
    const c = makeCourse();
    c.setExternalIds([
      { source: 'udemy', externalId: 'C-100' },
      { source: 'udemy', externalId: 'C-100', url: 'https://udemy.com' },
    ]);
    expect(c.externalIds).toHaveLength(1);
    // First-seen wins — no url on first entry
    expect(c.externalIds[0]!.url).toBeUndefined();
  });

  it('clears external ids when called with empty array', () => {
    const c = makeCourse();
    c.setExternalIds([{ source: 'udemy', externalId: 'C-100' }]);
    c.setExternalIds([]);
    expect(c.externalIds).toHaveLength(0);
  });
});
