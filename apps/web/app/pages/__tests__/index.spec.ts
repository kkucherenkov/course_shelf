/**
 * Spec for pages/index.vue's role/access-aware empty-row copy.
 *
 * "Add courses to a library and they will appear here" is an admin-only
 * action — a member has no `/admin` nav entry to act on it with. #579 covers
 * that the "recently added" empty body switches on role instead of
 * asserting the same instruction to everyone.
 *
 * #623: a user with zero library grants used to see "start a course"/
 * "finish a course" on "continue watching"/"recently completed" — the same
 * misleading advice `browse.vue` already stopped giving. Both rows now
 * reuse `browse.vue`'s own no-access copy once `useLibraries` resolves to
 * zero items for a non-admin.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type {
  ContinueWatchingDto,
  LibraryListDto,
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

const librariesData = ref<LibraryListDto | undefined>({ items: [] });
const librariesStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');
vi.mock('~/composables/useLibraries', () => ({
  useLibraries: () => ({
    data: librariesData,
    status: librariesStatus,
    error: ref(null),
    refresh: vi.fn(),
    register: vi.fn(),
    registerErrorDetail: ref(null),
  }),
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
  props: ['heading', 'status', 'empty', 'emptyTitle', 'emptyBody', 'errorTitle', 'errorBody'],
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
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
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

function findRow(wrapper: Awaited<ReturnType<typeof mountPage>>, headingKey: string) {
  return wrapper.findAllComponents(HomeRowProbe).find((r) => r.props('heading') === headingKey);
}

describe('pages/index.vue — no-access copy on continue watching / recently completed (#623)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recentlyAddedData.value = { items: [] };
  });

  it('a member with zero library grants sees the no-access copy, not "start a course"', async () => {
    authUser.value = { role: 'USER' };
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
    const wrapper = await mountPage();

    const continueWatching = findRow(wrapper, 'pages.home.continueWatching.heading');
    expect(continueWatching?.props('emptyTitle')).toBe('pages.browse.emptyNoAccessTitle');
    expect(continueWatching?.props('emptyBody')).toBe('pages.browse.emptyNoAccessBody');

    const recentlyCompleted = findRow(wrapper, 'pages.home.recentlyCompleted.heading');
    expect(recentlyCompleted?.props('emptyTitle')).toBe('pages.browse.emptyNoAccessTitle');
    expect(recentlyCompleted?.props('emptyBody')).toBe('pages.browse.emptyNoAccessBody');
  });

  it('a member with a library grant keeps the normal "nothing yet" copy', async () => {
    authUser.value = { role: 'USER' };
    librariesData.value = {
      items: [{ id: 'lib-1', name: 'CS' } as LibraryListDto['items'][number]],
    };
    librariesStatus.value = 'success';
    const wrapper = await mountPage();

    const continueWatching = findRow(wrapper, 'pages.home.continueWatching.heading');
    expect(continueWatching?.props('emptyTitle')).toBe('pages.home.continueWatching.empty');

    const recentlyCompleted = findRow(wrapper, 'pages.home.recentlyCompleted.heading');
    expect(recentlyCompleted?.props('emptyTitle')).toBe('pages.home.recentlyCompleted.empty');
  });

  it('an admin never sees the no-access copy, even with zero libraries', async () => {
    authUser.value = { role: 'ADMIN' };
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
    const wrapper = await mountPage();

    const continueWatching = findRow(wrapper, 'pages.home.continueWatching.heading');
    expect(continueWatching?.props('emptyTitle')).toBe('pages.home.continueWatching.empty');
  });

  it('defaults to the safe "nothing yet" copy while libraries are still loading', async () => {
    authUser.value = { role: 'USER' };
    librariesData.value = { items: [] };
    librariesStatus.value = 'pending';
    const wrapper = await mountPage();

    const continueWatching = findRow(wrapper, 'pages.home.continueWatching.heading');
    expect(continueWatching?.props('emptyTitle')).toBe('pages.home.continueWatching.empty');
  });
});
