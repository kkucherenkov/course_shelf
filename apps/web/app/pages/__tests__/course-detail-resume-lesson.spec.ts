/**
 * Spec for pages/courses/[id].vue's "resume lesson" pick (#573, #596).
 *
 * Before the #573 fix, the course page derived "resume" from a purely local
 * heuristic (the furthest-along in-progress lesson by position) while the
 * home page's "Continue watching" row used the server's own
 * `lastSeenLessonId`. Watch lesson 40, then glance at lesson 5, and the two
 * "Resume" buttons pointed at different lessons. This covers that the course
 * page now prefers the same server field, falling back to the old heuristic
 * only when the course isn't in that list.
 *
 * #596: that fix over-applied. `GET /home/continue-watching` isn't filtered
 * by completion — a fully finished course stays in the list as long as
 * `lastSeenAt` is recent — so a completed course's "Rewatch" button followed
 * the stale `lastSeenLessonId` back into the middle of the course instead of
 * opening lesson 1.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { ContinueWatchingDto, CourseOutlineDto } from '@app/api-client-ts';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' }, name: 'courses-id' }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.stubGlobal('useHead', () => undefined);

// ── Composables ────────────────────────────────────────────────────────────
const outlineData = ref<CourseOutlineDto | undefined>(undefined);
vi.mock('~/composables/useCourseOutline', () => ({
  useCourseOutline: () => ({
    data: outlineData,
    status: ref('success'),
    errorStatus: ref(null),
    refetch: vi.fn(),
    markComplete: vi.fn(),
    resetProgress: vi.fn(),
    mutating: ref(false),
  }),
}));
vi.mock('~/composables/useMaterialDownload', () => ({
  useMaterialDownload: () => ({ download: vi.fn() }),
}));

const continueWatchingData = ref<ContinueWatchingDto | undefined>(undefined);
const continueWatchingRefetch = vi.fn();
vi.mock('~/composables/useHome', () => ({
  useContinueWatching: () => ({
    data: continueWatchingData,
    status: ref('success'),
    error: ref(null),
    refetch: continueWatchingRefetch,
  }),
}));

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ user: { role: 'member' } }),
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'to'],
    template: '<button>{{ label }}</button>',
  },
  AppNoPermission: { name: 'AppNoPermission', template: '<div />' },
  AppSkeleton: { name: 'AppSkeleton', template: '<div />' },
}));

/** Two lessons, both `in-progress` — position order deliberately mismatches
 * watch order, mirroring the bug report (watched 40, then opened 5). */
function makeOutline(): CourseOutlineDto {
  return {
    course: {
      id: 'course-1',
      title: 'Course One',
      lessonsTotal: 2,
      totalDurationSeconds: 0,
      progress: { percent: 50, lessonsCompleted: 0, lessonsTotal: 2 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    sections: [
      {
        id: 's1',
        position: 1,
        title: 'Section 1',
        totalDurationSeconds: 0,
        lessons: [
          {
            id: 'lesson-5',
            position: 5,
            title: 'Lesson 5',
            durationSeconds: 0,
            hasMaterials: false,
            hasTranscript: false,
            state: 'in-progress',
            progressPercent: 30,
          },
          {
            id: 'lesson-40',
            position: 40,
            title: 'Lesson 40',
            durationSeconds: 0,
            hasMaterials: false,
            hasTranscript: false,
            state: 'in-progress',
            progressPercent: 80,
          },
        ],
      },
    ],
    materials: [],
  };
}

/** A course where every lesson is `completed` — courseState === 'completed'. */
function makeCompletedOutline(): CourseOutlineDto {
  return {
    course: {
      id: 'course-1',
      title: 'Course One',
      lessonsTotal: 2,
      totalDurationSeconds: 0,
      progress: { percent: 100, lessonsCompleted: 2, lessonsTotal: 2 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    sections: [
      {
        id: 's1',
        position: 1,
        title: 'Section 1',
        totalDurationSeconds: 0,
        lessons: [
          {
            id: 'lesson-1',
            position: 1,
            title: 'Lesson 1',
            durationSeconds: 0,
            hasMaterials: false,
            hasTranscript: false,
            state: 'completed',
            progressPercent: 100,
          },
          {
            id: 'lesson-2',
            position: 2,
            title: 'Lesson 2',
            durationSeconds: 0,
            hasMaterials: false,
            hasTranscript: false,
            state: 'completed',
            progressPercent: 100,
          },
        ],
      },
    ],
    materials: [],
  };
}

async function mountPage() {
  const mod = await import('../courses/[id].vue');
  return mount(mod.default, {
    global: {
      stubs: {
        CourseHero: true,
        CourseActions: true,
        CourseSectionsList: true,
        CourseMaterialsRail: true,
        CourseCompletedBanner: true,
        NuxtPage: true,
      },
    },
  });
}

function primaryHref(wrapper: Awaited<ReturnType<typeof mountPage>>): unknown {
  return wrapper.findComponent({ name: 'CourseActions' }).props('primaryHref');
}

describe('pages/courses/[id].vue — resume lesson (#573)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outlineData.value = makeOutline();
    continueWatchingData.value = undefined;
  });

  it('resumes at the server-reported lastSeenLessonId, not the furthest-along lesson by position', async () => {
    continueWatchingData.value = {
      items: [
        {
          courseId: 'course-1',
          courseTitle: 'Course One',
          percent: 50,
          lessonsCompleted: 0,
          lessonsTotal: 2,
          lastSeenAt: '2024-02-01T00:00:00Z',
          lastSeenLessonId: 'lesson-5',
        },
      ],
    };

    const wrapper = await mountPage();

    expect(primaryHref(wrapper)).toBe('/courses/course-1/lessons/lesson-5');
  });

  it('refetches continue-watching on mount instead of trusting a stale cache', async () => {
    await mountPage();
    expect(continueWatchingRefetch).toHaveBeenCalled();
  });

  it('falls back to the last in-progress lesson by position when the course is not in that list', async () => {
    continueWatchingData.value = { items: [] };

    const wrapper = await mountPage();

    expect(primaryHref(wrapper)).toBe('/courses/course-1/lessons/lesson-40');
  });

  it('sends a completed course to lesson 1, ignoring a stale continue-watching entry (#596)', async () => {
    outlineData.value = makeCompletedOutline();
    continueWatchingData.value = {
      items: [
        {
          courseId: 'course-1',
          courseTitle: 'Course One',
          percent: 100,
          lessonsCompleted: 2,
          lessonsTotal: 2,
          lastSeenAt: '2024-02-01T00:00:00Z',
          lastSeenLessonId: 'lesson-2',
        },
      ],
    };

    const wrapper = await mountPage();

    expect(primaryHref(wrapper)).toBe('/courses/course-1/lessons/lesson-1');
  });
});
