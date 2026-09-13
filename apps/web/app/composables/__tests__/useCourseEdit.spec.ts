/**
 * Unit tests for useCourseEdit (E30-F03-S01).
 *
 * `buildUpdatePayload` is the partial-update payload construction the card's
 * acceptance calls out explicitly: a touched field is sent, an untouched one
 * never is, and rating travels as a pair.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { CourseDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetCourse = vi.fn();
const mockUpdateCourse = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  getCourse: (...args: unknown[]) => mockGetCourse(...args),
  updateCourse: (...args: unknown[]) => mockUpdateCourse(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeCourse(overrides: Partial<CourseDto> = {}): CourseDto {
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'intro-to-testing',
    title: 'Intro to Testing',
    description: 'A course.',
    sections: [],
    progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
    instructors: [{ id: 'i1', slug: 'ada', displayName: 'Ada Lovelace' }],
    studios: [{ id: 's1', slug: 'acme', displayName: 'Acme Studio' }],
    tags: [{ id: 't1', slug: 'testing', displayName: 'Testing' }],
    level: 'beginner',
    language: 'en',
    releaseDate: '2024-01-01',
    posterUrl: 'https://example.com/poster.png',
    ratingAverage: 4.5,
    ratingCount: 10,
    externalIds: [{ source: 'udemy', externalId: '123' }],
    sourceUpdatedAt: '2024-01-02T03:04:05.000Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  } as CourseDto;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('courseToFormState', () => {
  beforeEach(() => vi.resetModules());

  it('maps entity refs to ids and nullable fields to their form defaults', async () => {
    const { courseToFormState } = await import('../useCourseEdit');
    const form = courseToFormState(makeCourse());

    expect(form.instructorIds).toEqual(['i1']);
    expect(form.studioIds).toEqual(['s1']);
    expect(form.tagIds).toEqual(['t1']);
    expect(form.sourceUpdatedAt).toBe('2024-01-02T03:04');
  });

  it('turns absent nullable fields into empty-string / null form defaults', async () => {
    const { courseToFormState } = await import('../useCourseEdit');
    const form = courseToFormState(
      makeCourse({
        description: undefined,
        level: undefined,
        language: undefined,
        releaseDate: undefined,
        posterUrl: undefined,
        ratingAverage: undefined,
        ratingCount: undefined,
        instructors: undefined,
        studios: undefined,
        tags: undefined,
        externalIds: undefined,
        sourceUpdatedAt: undefined,
      }),
    );

    expect(form.description).toBe('');
    expect(form.level).toBeNull();
    expect(form.language).toBe('');
    expect(form.releaseDate).toBe('');
    expect(form.posterUrl).toBe('');
    expect(form.ratingAverage).toBeNull();
    expect(form.ratingCount).toBeNull();
    expect(form.instructorIds).toEqual([]);
    expect(form.studioIds).toEqual([]);
    expect(form.tagIds).toEqual([]);
    expect(form.externalIds).toEqual([]);
    expect(form.sourceUpdatedAt).toBe('');
  });
});

describe('buildUpdatePayload', () => {
  it('sends nothing when no field was touched', async () => {
    const { courseToFormState, buildUpdatePayload } = await import('../useCourseEdit');
    const form = courseToFormState(makeCourse());

    const payload = buildUpdatePayload(form, new Set());

    expect(payload).toEqual({});
  });

  it('sends only the one field that was touched', async () => {
    const { courseToFormState, buildUpdatePayload } = await import('../useCourseEdit');
    const form = courseToFormState(makeCourse());
    form.title = 'New Title';

    const payload = buildUpdatePayload(form, new Set(['title']));

    expect(payload).toEqual({ title: 'New Title' });
  });

  it('sends ratingAverage and ratingCount together when either is touched', async () => {
    const { courseToFormState, buildUpdatePayload } = await import('../useCourseEdit');
    const form = courseToFormState(makeCourse());
    form.ratingAverage = 5;

    const payload = buildUpdatePayload(form, new Set(['ratingAverage']));

    expect(payload).toEqual({ ratingAverage: 5, ratingCount: 10 });
  });

  it('clears a nullable field to null when touched and blanked', async () => {
    const { courseToFormState, buildUpdatePayload } = await import('../useCourseEdit');
    const form = courseToFormState(makeCourse());
    form.posterUrl = '';
    form.level = null;

    const payload = buildUpdatePayload(form, new Set(['posterUrl', 'level']));

    expect(payload).toEqual({ posterUrl: null, level: null });
  });

  it('sends an empty instructorIds array as an explicit removal, not omission', async () => {
    const { courseToFormState, buildUpdatePayload } = await import('../useCourseEdit');
    const form = courseToFormState(makeCourse());
    form.instructorIds = [];

    const payload = buildUpdatePayload(form, new Set(['instructorIds']));

    expect(payload).toEqual({ instructorIds: [] });
  });
});

describe('useCourseFormState', () => {
  it('marks a field touched on setField and leaves siblings untouched', async () => {
    const { courseToFormState, useCourseFormState } = await import('../useCourseEdit');
    const { form, touched, setField } = useCourseFormState(courseToFormState(makeCourse()));

    setField('title', 'Changed');

    expect(form.title).toBe('Changed');
    expect(touched.has('title')).toBe(true);
    expect(touched.has('description')).toBe(false);
    expect(touched.size).toBe(1);
  });

  it('setRating touches both rating fields at once', async () => {
    const { courseToFormState, useCourseFormState } = await import('../useCourseEdit');
    const { touched, setRating } = useCourseFormState(courseToFormState(makeCourse()));

    setRating(3, 7);

    expect(touched.has('ratingAverage')).toBe(true);
    expect(touched.has('ratingCount')).toBe(true);
  });
});

describe('useCourseEdit.save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('sends exactly the given payload and syncs data from the response', async () => {
    const updated = makeCourse({ title: 'Saved Title' });
    mockUpdateCourse.mockResolvedValueOnce({
      data: updated,
      error: null,
      response: { status: 200 },
    });

    vi.stubGlobal('useAsyncData', () => ({
      data: ref(undefined),
      status: ref('idle'),
      error: ref(null),
      refresh: vi.fn(),
    }));

    const { useCourseEdit } = await import('../useCourseEdit');
    const { data, save } = useCourseEdit('course-1');

    const err = await save({ title: 'Saved Title' });

    expect(err).toBeNull();
    expect(mockUpdateCourse).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'course-1' }, body: { title: 'Saved Title' } }),
    );
    expect(data.value).toEqual(updated);
  });

  it('returns an error and leaves data untouched on failure', async () => {
    mockUpdateCourse.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Conflict' },
      response: { status: 409 },
    });

    const dataRef = ref<CourseDto | undefined>(undefined);
    vi.stubGlobal('useAsyncData', () => ({
      data: dataRef,
      status: ref('idle'),
      error: ref(null),
      refresh: vi.fn(),
    }));

    const { useCourseEdit } = await import('../useCourseEdit');
    const { save } = useCourseEdit('course-1');

    const err = await save({ slug: 'taken-slug' });

    expect(err).toBeInstanceOf(Error);
    expect(dataRef.value).toBeUndefined();
  });
});
