/**
 * Spec for pages/courses/[id].vue's load-error copy (#701).
 *
 * The generic `loadingError` body says "check your connection and try
 * again" — wrong advice for a 429, where the connection is fine and
 * retrying only extends the block. A 403 keeps its own dedicated
 * `AppNoPermission` branch (unrelated, pre-existing) and is unaffected.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { ContinueWatchingDto, CourseOutlineDto } from '@app/api-client-ts';

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' }, name: 'courses-id' }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.stubGlobal('useHead', () => undefined);

const outlineStatus = ref<'idle' | 'pending' | 'success' | 'error'>('error');
const outlineErrorStatus = ref<number | null>(null);
vi.mock('~/composables/useCourseOutline', () => ({
  useCourseOutline: () => ({
    data: ref<CourseOutlineDto | undefined>(undefined),
    status: outlineStatus,
    errorStatus: outlineErrorStatus,
    refetch: vi.fn(),
    markComplete: vi.fn(),
    resetProgress: vi.fn(),
    mutating: ref(false),
  }),
}));
vi.mock('~/composables/useMaterialDownload', () => ({
  useMaterialDownload: () => ({ download: vi.fn() }),
}));
vi.mock('~/composables/useHome', () => ({
  useContinueWatching: () => ({
    data: ref<ContinueWatchingDto | undefined>(undefined),
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
}));
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ user: { role: 'member' } }),
}));

vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'to'],
    template: '<button>{{ label }}</button>',
  },
  AppNoPermission: {
    name: 'AppNoPermission',
    props: ['title', 'body'],
    template: '<div class="no-permission">{{ title }}::{{ body }}</div>',
  },
  AppErrorState: {
    name: 'AppErrorState',
    props: ['title', 'body'],
    template: '<div class="error-state">{{ title }}::{{ body }}<slot name="action" /></div>',
  },
  AppSkeleton: { name: 'AppSkeleton', template: '<div />' },
}));

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

describe('pages/courses/[id].vue — load-error copy (#701)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outlineStatus.value = 'error';
    outlineErrorStatus.value = null;
  });

  it('shows the shared rate-limited body on a 429, not "check your connection"', async () => {
    outlineErrorStatus.value = 429;
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('ui.errors.rateLimitedBody');
    expect(wrapper.text()).not.toContain('pages.courseDetail.loadingError');
  });

  it('keeps the generic body on a non-429, non-403 error', async () => {
    outlineErrorStatus.value = 500;
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('pages.courseDetail.loadingError');
  });

  it('renders the non-403 branch through the shared AppErrorState (#196)', async () => {
    outlineErrorStatus.value = 500;
    const wrapper = await mountPage();

    expect(wrapper.find('.error-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('pages.courseDetail.loadErrorTitle');
  });

  it('keeps the dedicated no-access branch on a 403, unaffected', async () => {
    outlineErrorStatus.value = 403;
    const wrapper = await mountPage();

    expect(wrapper.find('.no-permission').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('ui.errors.rateLimitedBody');
  });
});
