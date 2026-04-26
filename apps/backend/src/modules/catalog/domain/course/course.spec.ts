import { describe, expect, it } from 'vitest';

import { Course } from './course';
import {
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
