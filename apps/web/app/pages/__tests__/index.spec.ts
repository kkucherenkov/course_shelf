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
 *
 * #633: "recently added" got the same access check #623 gave its two
 * siblings — a member with zero library grants used to see the "ask an
 * admin to add courses" copy (false: there's no library to add them to),
 * one row below the honest no-access message on continue-watching. Access
 * is now checked before the role split, so the role split only applies once
 * there's a real (possibly empty) library to be a member or admin of.
 *
 * #666: the three per-row no-access messages (#623/#633 above) plus a
 * "0 min watched" scoreboard in the rail added up to the same explanation
 * repeated three times over a table of zeros. Zero library grants now gates
 * the whole three-row block (and the rail) behind one `AppNoPermission`
 * instead — see the "no library access" describe block below.
 *
 * tuxedo 249: "zero library grants" stopped meaning "zero access" once the
 * admin UI could hand out COURSE-level grants — those never put a row in
 * `GET /libraries`. The access check is now `useLibraries` OR'd with
 * `useCourseCatalogAccess`'s own unfiltered `GET /courses` probe; see the
 * regression case in the "#666" describe block below.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type {
  ContinueWatchingDto,
  FlashcardDto,
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
const refreshLibraries = vi.fn();
vi.mock('~/composables/useLibraries', () => ({
  useLibraries: () => ({
    data: librariesData,
    status: librariesStatus,
    error: ref(null),
    refresh: refreshLibraries,
    register: vi.fn(),
    registerErrorDetail: ref(null),
  }),
}));

// The unfiltered `GET /courses` access probe — independent from
// `librariesData` above. tuxedo 249: a course-level grant makes THIS
// non-empty while `librariesData` stays empty.
const hasAnyCatalogCourse = ref(false);
const catalogAccessStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');
const refetchCatalogAccess = vi.fn();
vi.mock('~/composables/useCoursesList', () => ({
  useCourseCatalogAccess: () => ({
    hasAnyCourse: hasAnyCatalogCourse,
    status: catalogAccessStatus,
    refetch: refetchCatalogAccess,
  }),
}));

const recentlyAddedData = ref<RecentlyAddedDto | undefined>({ items: [] });
const recentlyCompletedData = ref<RecentlyCompletedDto | undefined>({ items: [] });
const recentlyCompletedStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');
const continueWatchingData = ref<ContinueWatchingDto | undefined>({ items: [] });
const continueWatchingErrorStatus = ref<number | null>(null);
vi.mock('~/composables/useHome', () => ({
  useContinueWatching: () => ({
    data: continueWatchingData,
    status: ref('success'),
    error: ref(null),
    errorStatus: continueWatchingErrorStatus,
    refetch: vi.fn(),
  }),
  useRecentlyAdded: () => ({
    data: recentlyAddedData,
    status: ref('success'),
    error: ref(null),
    errorStatus: ref(null),
    refetch: vi.fn(),
  }),
  useRecentlyCompleted: () => ({
    data: recentlyCompletedData,
    status: recentlyCompletedStatus,
    error: ref(null),
    errorStatus: ref(null),
    refetch: vi.fn(),
  }),
  useYourWeek: () => ({
    data: ref<YourWeekDto | undefined>(undefined),
    status: ref('success'),
    error: ref(null),
    errorStatus: ref(null),
    refetch: vi.fn(),
  }),
}));

// Due-flashcard queue (E29-F01-S03) — same-key `useAsyncData` composable the
// review screen also calls; mocked here so the page's own top-level call
// doesn't need the real Nuxt auto-import.
const dueQueueData = ref<FlashcardDto[]>([]);
const dueQueueStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');
vi.mock('~/composables/useFlashcards', () => ({
  useFlashcardReviewQueue: () => ({
    queue: computed(() => dueQueueData.value),
    status: dueQueueStatus,
    error: ref(null),
    current: computed(() => dueQueueData.value[0] ?? null),
    total: ref(dueQueueData.value.length),
    grading: ref(false),
    gradeError: ref(null),
    grade: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock('@app/ui', () => ({
  CourseWideCard: {
    name: 'CourseWideCard',
    props: ['course', 'interactive', 'resumeLabel'],
    template: '<div />',
  },
  CoursePosterCard: {
    name: 'CoursePosterCard',
    props: ['course', 'interactive', 'state'],
    template: '<div />',
  },
  AppNoPermission: {
    name: 'AppNoPermission',
    props: ['title', 'body'],
    template: '<div class="no-permission-probe">{{ title }}::{{ body }}</div>',
  },
  AppErrorState: {
    name: 'AppErrorState',
    props: ['title', 'body'],
    template: '<div class="error-state-probe">{{ title }}::{{ body }}<slot name="action" /></div>',
  },
  AppButton: {
    name: 'AppButton',
    props: ['variant', 'size', 'label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
}));

const HomeRowProbe = {
  name: 'HomeRowProbe',
  props: [
    'heading',
    'status',
    'empty',
    'emptyTitle',
    'emptyBody',
    'errorTitle',
    'errorBody',
    'collapsibleMeta',
  ],
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
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
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

  it('tells a member with library access courses will show up once an admin adds them', async () => {
    authUser.value = { role: 'USER' };
    // Has a real (empty) library — distinct from the zero-grants case below.
    librariesData.value = {
      items: [{ id: 'lib-1', name: 'CS' } as LibraryListDto['items'][number]],
    };
    const wrapper = await mountPage();

    const rows = wrapper.findAllComponents(HomeRowProbe);
    const recentlyAdded = rows.find(
      (r) => r.props('heading') === 'pages.home.recentlyAdded.heading',
    );

    expect(recentlyAdded?.props('emptyTitle')).toBe('pages.home.recentlyAdded.empty');
    expect(recentlyAdded?.props('emptyBody')).toBe('pages.home.recentlyAdded.emptyBodyMember');
  });

  it('an admin with zero libraries still sees the "add courses" copy, not no-access', async () => {
    authUser.value = { role: 'ADMIN' };
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
    const wrapper = await mountPage();

    const rows = wrapper.findAllComponents(HomeRowProbe);
    const recentlyAdded = rows.find(
      (r) => r.props('heading') === 'pages.home.recentlyAdded.heading',
    );

    expect(recentlyAdded?.props('emptyTitle')).toBe('pages.home.recentlyAdded.empty');
    expect(recentlyAdded?.props('emptyBody')).toBe('pages.home.recentlyAdded.emptyBody');
  });
});

function findRow(wrapper: Awaited<ReturnType<typeof mountPage>>, headingKey: string) {
  return wrapper.findAllComponents(HomeRowProbe).find((r) => r.props('heading') === headingKey);
}

describe('pages/index.vue — no-access copy on continue watching / recently completed (#623)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recentlyAddedData.value = { items: [] };
    recentlyCompletedData.value = { items: [] };
    recentlyCompletedStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
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

// #666: zero library grants used to produce the same no-access message once
// per row (continue-watching, recently-added, recently-completed) plus a
// "0 min watched" scoreboard in the rail. Now it gates the entire three-row
// block (and the rail) behind a single `AppNoPermission`.
describe('pages/index.vue — no library access renders one explanation (#666)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recentlyAddedData.value = { items: [] };
    recentlyCompletedData.value = { items: [] };
    recentlyCompletedStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
  });

  it('shows a single no-access block instead of the three rows', async () => {
    authUser.value = { role: 'USER' };
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
    const wrapper = await mountPage();

    const noAccess = wrapper.find('.no-permission-probe');
    expect(noAccess.exists()).toBe(true);
    expect(noAccess.text()).toBe('pages.browse.emptyNoAccessTitle::pages.browse.emptyNoAccessBody');
    expect(wrapper.findAllComponents(HomeRowProbe)).toHaveLength(0);
  });

  it('renders the normal three-row layout once access is confirmed', async () => {
    authUser.value = { role: 'USER' };
    librariesData.value = {
      items: [{ id: 'lib-1', name: 'CS' } as LibraryListDto['items'][number]],
    };
    librariesStatus.value = 'success';
    const wrapper = await mountPage();

    expect(wrapper.find('.no-permission-probe').exists()).toBe(false);
    expect(wrapper.findAllComponents(HomeRowProbe)).toHaveLength(3);
  });

  // tuxedo 249: a COURSE-level grant (the admin UI offers those) puts
  // courses in `GET /courses` without ever putting a row in `GET /libraries`
  // — `AuthorizationService.canSee`'s library-grant-implies-course-access
  // rule doesn't run in reverse. A member holding only that grant must see
  // the three-row layout, not the access denial.
  it('renders the normal three-row layout for a member with only a course-level grant', async () => {
    authUser.value = { role: 'USER' };
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
    hasAnyCatalogCourse.value = true;
    catalogAccessStatus.value = 'success';
    const wrapper = await mountPage();

    expect(wrapper.find('.no-permission-probe').exists()).toBe(false);
    expect(wrapper.findAllComponents(HomeRowProbe)).toHaveLength(3);
  });
});

// `HomeRow` renders `collapsibleMeta` in its header, outside the row's own
// loading gate (`!collapsible || expanded`) — so an unguarded label is the
// only thing standing between a `pending` fetch and a flashed "0 courses".
describe('pages/index.vue — recently-completed count label respects loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Access itself is not what these tests probe — pin ADMIN so the block
    // renders independent of whatever the previous describe block's tests
    // last left `authUser`/`librariesData`/`hasAnyCatalogCourse` at.
    authUser.value = { role: 'ADMIN' };
    recentlyAddedData.value = { items: [] };
    recentlyCompletedData.value = { items: [] };
    recentlyCompletedStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
  });

  it('shows no count while the request is still pending', async () => {
    recentlyCompletedStatus.value = 'pending';
    const wrapper = await mountPage();

    const recentlyCompleted = findRow(wrapper, 'pages.home.recentlyCompleted.heading');
    expect(recentlyCompleted?.props('collapsibleMeta')).toBe('');
  });

  it('shows the real count once loaded', async () => {
    recentlyCompletedStatus.value = 'success';
    recentlyCompletedData.value = {
      items: [{ courseId: 'c-1' } as RecentlyCompletedDto['items'][number]],
    };
    const wrapper = await mountPage();

    const recentlyCompleted = findRow(wrapper, 'pages.home.recentlyCompleted.heading');
    expect(recentlyCompleted?.props('collapsibleMeta')).toBe('pages.home.recentlyCompleted.count');
  });
});

// A 429 says "check your connection and try again" — wrong advice: the
// connection is fine, and retrying only extends the block (#701).
describe('pages/index.vue — 429 gets different advice than a network error (#701)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser.value = { role: 'ADMIN' };
    recentlyAddedData.value = { items: [] };
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
    continueWatchingErrorStatus.value = null;
  });

  it('shows the shared rate-limited body on a 429', async () => {
    continueWatchingErrorStatus.value = 429;
    const wrapper = await mountPage();

    const row = findRow(wrapper, 'pages.home.continueWatching.heading');
    expect(row?.props('errorBody')).toBe('ui.errors.rateLimitedBody');
  });

  it('keeps the generic body on a non-429 error', async () => {
    continueWatchingErrorStatus.value = 500;
    const wrapper = await mountPage();

    const row = findRow(wrapper, 'pages.home.continueWatching.heading');
    expect(row?.props('errorBody')).toBe('pages.home.continueWatching.errorBody');
  });
});

// tuxedo 182: a half-finished course used to show 50% on "continue watching"
// and 0% on "recently added" — the same course disagreeing with itself.
describe('pages/index.vue — recently-added shows real progress (tuxedo 182)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser.value = { role: 'ADMIN' };
    recentlyCompletedData.value = { items: [] };
    recentlyCompletedStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
  });

  it('passes the real lessonsCompleted through to the card, not a hardcoded 0', async () => {
    recentlyAddedData.value = {
      items: [
        {
          courseId: 'c-1',
          courseTitle: 'Aggregates',
          lessonCount: 10,
          lessonsCompleted: 4,
          totalDurationSeconds: 3600,
          createdAt: '2026-04-26T08:14:00Z',
        },
      ],
    };
    const wrapper = await mountPage();

    const card = wrapper.findComponent({ name: 'CoursePosterCard' });
    expect(card.props('course')).toMatchObject({ completed: 4, lessons: 10 });
  });
});

// tuxedo 200: the resume CTA can show a real position instead of only a
// percentage once the backend supplies one.
describe('pages/index.vue — continue-watching resume label (tuxedo 200)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser.value = { role: 'ADMIN' };
    recentlyAddedData.value = { items: [] };
    recentlyCompletedData.value = { items: [] };
    recentlyCompletedStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
  });

  it('formats resumePositionSeconds into the resume-label prop', async () => {
    continueWatchingData.value = {
      items: [
        {
          courseId: 'c-1',
          courseTitle: 'Aggregates',
          percent: 15,
          lessonsCompleted: 1,
          lessonsTotal: 10,
          lastSeenAt: '2026-04-25T14:32:00Z',
          lastSeenLessonId: 'lesson-1',
          resumePositionSeconds: 125,
        },
      ],
    };
    const wrapper = await mountPage();

    const card = wrapper.findComponent({ name: 'CourseWideCard' });
    expect(card.props('resumeLabel')).toBe('pages.home.continueWatching.resumeLabel');
  });

  it('leaves resume-label undefined when no position was recorded', async () => {
    continueWatchingData.value = {
      items: [
        {
          courseId: 'c-1',
          courseTitle: 'Aggregates',
          percent: 15,
          lessonsCompleted: 1,
          lessonsTotal: 10,
          lastSeenAt: '2026-04-25T14:32:00Z',
          lastSeenLessonId: 'lesson-1',
        },
      ],
    };
    const wrapper = await mountPage();

    const card = wrapper.findComponent({ name: 'CourseWideCard' });
    expect(card.props('resumeLabel')).toBeUndefined();
  });
});

// Audit run20 finding 7/synthesis: a 500 on the unfiltered courses/libraries
// probe used to fall through to the exact same "no access" copy as a
// genuinely empty account, sending the user to bother an administrator about
// a permission problem that does not exist.
describe('pages/index.vue — failed catalog-access probe reads as an error, not a denial (audit run20 finding 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser.value = { role: 'USER' };
    recentlyAddedData.value = { items: [] };
    recentlyCompletedData.value = { items: [] };
    recentlyCompletedStatus.value = 'success';
  });

  it('shows a retryable error, not "no access granted", when both probes fail', async () => {
    librariesData.value = { items: [] };
    librariesStatus.value = 'error';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'error';
    const wrapper = await mountPage();

    const errorState = wrapper.find('.error-state-probe');
    expect(errorState.exists()).toBe(true);
    expect(errorState.text()).toContain('errors.catalogLoadFailedTitle');
    expect(wrapper.find('.no-permission-probe').exists()).toBe(false);
  });

  it('still reads as "no access" when both probes genuinely succeed empty', async () => {
    librariesData.value = { items: [] };
    librariesStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
    const wrapper = await mountPage();

    expect(wrapper.find('.error-state-probe').exists()).toBe(false);
    expect(wrapper.find('.no-permission-probe').exists()).toBe(true);
  });

  it('shows the granted layout when one probe fails but the other already proved access', async () => {
    librariesData.value = {
      items: [{ id: 'lib-1', name: 'CS' } as LibraryListDto['items'][number]],
    };
    librariesStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'error';
    const wrapper = await mountPage();

    expect(wrapper.find('.error-state-probe').exists()).toBe(false);
    expect(wrapper.find('.no-permission-probe').exists()).toBe(false);
  });

  it("retries both probes when the error state's retry action is clicked", async () => {
    librariesData.value = { items: [] };
    librariesStatus.value = 'error';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'error';
    const wrapper = await mountPage();

    await wrapper.find('.error-state-probe button').trigger('click');

    expect(refreshLibraries).toHaveBeenCalledTimes(1);
    expect(refetchCatalogAccess).toHaveBeenCalledTimes(1);
  });
});
