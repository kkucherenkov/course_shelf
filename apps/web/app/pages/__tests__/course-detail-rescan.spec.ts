/**
 * Spec for the rescan button on pages/courses/[id].vue (E32-F01-S02).
 *
 * Scope: only the rescan affordance — admin-only visibility and that it
 * calls POST /courses/{id}/rescan with the page's courseId. The rest of the
 * page (hero, sections, materials) is stubbed out; it is not this card's
 * concern.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { CourseOutlineDto } from '@app/api-client-ts';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' }, name: 'courses-id' }));
const toastAdd = vi.fn();
vi.stubGlobal('useToast', () => ({ add: toastAdd }));

// ── SDK mock ───────────────────────────────────────────────────────────────
const mockRunCourseRescan = vi.fn().mockResolvedValue({ data: { id: 'scan-1' }, error: undefined });
vi.mock('@app/api-client-ts', () => ({
  runCourseRescan: (...args: unknown[]) => mockRunCourseRescan(...args),
  client: {},
}));

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

// ── Auth store ─────────────────────────────────────────────────────────────
const authUser = ref<{ role?: string } | null>(null);
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ user: authUser.value }),
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'to', 'variant', 'size', 'loading', 'iconLeading'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppNoPermission: { name: 'AppNoPermission', template: '<div />' },
  AppSkeleton: { name: 'AppSkeleton', template: '<div />' },
}));

function makeOutline(): CourseOutlineDto {
  return {
    course: {
      id: 'course-1',
      title: 'Course One',
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

describe('pages/courses/[id].vue — rescan button (E32-F01-S02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outlineData.value = makeOutline();
    authUser.value = null;
  });

  it('is absent for a non-admin', async () => {
    authUser.value = { role: 'member' };
    const wrapper = await mountPage();
    expect(wrapper.find('.page-course-detail__rescan-cta').exists()).toBe(false);
  });

  it('is present for an admin and calls POST /courses/{id}/rescan on click', async () => {
    authUser.value = { role: 'admin' };
    const wrapper = await mountPage();

    const button = wrapper.find('.page-course-detail__rescan-cta');
    expect(button.exists()).toBe(true);

    await button.trigger('click');
    await Promise.resolve();

    expect(mockRunCourseRescan).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'course-1' } }),
    );
  });
});
