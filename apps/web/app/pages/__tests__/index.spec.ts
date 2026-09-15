/**
 * Spec for pages/index.vue's "recently added" empty-row copy (#579).
 *
 * "Add courses to a library and they will appear here" is an admin-only
 * action — a member has no `/admin` nav entry to act on it with. This covers
 * that the empty body switches on role instead of asserting the same
 * instruction to everyone.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type {
  ContinueWatchingDto,
  RecentlyAddedDto,
  RecentlyCompletedDto,
  YourWeekDto,
} from '@app/api-client-ts';

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key, locale: ref('en') }));

const authUser = ref<{ role?: string; displayName?: string; name?: string } | null>({
  role: 'ADMIN',
});
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ user: authUser.value }),
}));

const recentlyAddedData = ref<RecentlyAddedDto | undefined>({ items: [] });
vi.mock('~/composables/useHome', () => ({
  useContinueWatching: () => ({
    data: ref<ContinueWatchingDto | undefined>({ items: [] }),
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
  useRecentlyAdded: () => ({
    data: recentlyAddedData,
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
  useRecentlyCompleted: () => ({
    data: ref<RecentlyCompletedDto | undefined>({ items: [] }),
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
  useYourWeek: () => ({
    data: ref<YourWeekDto | undefined>(undefined),
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
}));

vi.mock('@app/ui', () => ({
  CourseWideCard: { name: 'CourseWideCard', props: ['course', 'interactive'], template: '<div />' },
  CoursePosterCard: {
    name: 'CoursePosterCard',
    props: ['course', 'interactive', 'state'],
    template: '<div />',
  },
}));

const HomeRowProbe = {
  name: 'HomeRowProbe',
  props: ['heading', 'status', 'empty', 'emptyTitle', 'emptyBody'],
  template: '<div><slot /></div>',
};

async function mountPage() {
  const mod = await import('../index.vue');
  return mount(mod.default, {
    global: {
      stubs: {
        HomeGreeting: true,
        HomeYourWeek: true,
        HomeRow: HomeRowProbe,
      },
    },
  });
}

describe('pages/index.vue — recently added empty row (#579)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recentlyAddedData.value = { items: [] };
  });

  it('tells an admin to add courses to a library', async () => {
    authUser.value = { role: 'ADMIN' };
    const wrapper = await mountPage();

    const rows = wrapper.findAllComponents(HomeRowProbe);
    const recentlyAdded = rows.find(
      (r) => r.props('heading') === 'pages.home.recentlyAdded.heading',
    );

    expect(recentlyAdded?.props('emptyBody')).toBe('pages.home.recentlyAdded.emptyBody');
  });

  it('tells a member courses will show up once an admin adds them', async () => {
    authUser.value = { role: 'USER' };
    const wrapper = await mountPage();

    const rows = wrapper.findAllComponents(HomeRowProbe);
    const recentlyAdded = rows.find(
      (r) => r.props('heading') === 'pages.home.recentlyAdded.heading',
    );

    expect(recentlyAdded?.props('emptyBody')).toBe('pages.home.recentlyAdded.emptyBodyMember');
  });
});
