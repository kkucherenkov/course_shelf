/**
 * Spec for pages/courses/[id].vue's document title (#701).
 *
 * Every one of the 68 audited courses shared the static "Course Shelf" tab
 * title — bookmarks, history and tab switching couldn't tell them apart.
 * This covers that the page now sets a `useHead` title from the loaded
 * course, falling back to a generic label before the outline resolves (or
 * when it never does) — the same pattern `[lessonId].vue` uses for #623.
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

const headCalls: { title?: string }[] = [];
vi.stubGlobal('useHead', (source: () => { title?: string }) => {
  headCalls.push(source());
});

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
vi.mock('~/composables/useHome', () => ({
  useContinueWatching: () => ({
    data: continueWatchingData,
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
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

function makeOutline(title: string): CourseOutlineDto {
  return {
    course: {
      id: 'course-1',
      title,
      lessonsTotal: 0,
      totalDurationSeconds: 0,
      progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    sections: [],
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

describe('pages/courses/[id].vue — document title (#701)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headCalls.length = 0;
    outlineData.value = undefined;
    continueWatchingData.value = undefined;
  });

  it('uses the loaded course title as the document title', async () => {
    outlineData.value = makeOutline('Design Fundamentals');
    await mountPage();
    expect(headCalls.at(-1)?.title).toBe('Design Fundamentals');
  });

  it('falls back to a generic title before the outline loads', async () => {
    await mountPage();
    expect(headCalls.at(-1)?.title).toBe('pages.courseDetail.title');
  });
});
