/**
 * Spec for apps/web/app/pages/browse.vue (E31-F01-S01).
 *
 * One case per filter the card asks for, plus the round trip: a filter chosen
 * in the UI has to land in the URL, and a URL loaded cold has to reproduce the
 * selection. A real reactive route object stands in for vue-router so both
 * directions are exercised against the same state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed, reactive, ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

import type { LocationQuery } from 'vue-router';
import type { CourseListDto, InstructorListDto, LibraryListDto } from '@app/api-client-ts';
import type * as CoursesListModule from '../../composables/useCoursesList';

// ── Route / router ─────────────────────────────────────────────────────────
const route = reactive<{ query: LocationQuery }>({ query: {} });
const replace = vi.fn((to: { query: LocationQuery }) => {
  route.query = to.query;
  return Promise.resolve();
});
// The real useRouter() always returns the same singleton — useQueryStringState
// batches same-tick writes off router identity, so the mock has to match.
const router = { replace };

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => route);
vi.stubGlobal('useRouter', () => router);
vi.stubGlobal('computed', computed);

// ── Data composables ───────────────────────────────────────────────────────
// The list is stubbed so the page's filter wiring is what is under test, not
// the fetch. `lastOptions` captures the refs the page handed over, which is
// how the assertions read the live filter state.
const courses = ref<CourseListDto>({ items: [] });
const fetchStatus = ref('success');
const errorStatus = ref<number | null>(null);
let lastOptions: Record<string, { value: string }> = {};

// Independent from the filtered `courses`/`fetchStatus` pair above — the
// unfiltered `GET /courses` access probe (tuxedo 249: a course-level grant
// makes THIS one non-empty while `libraries` below stays empty).
const hasAnyCatalogCourse = ref(false);
const catalogAccessStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');

vi.mock('~/composables/useCoursesList', async () => {
  const actual = await vi.importActual<typeof CoursesListModule>(
    '../../composables/useCoursesList',
  );
  return {
    ...actual,
    useCoursesList: (options: Record<string, { value: string }>) => {
      lastOptions = options;
      return {
        data: courses,
        status: fetchStatus,
        error: ref(null),
        errorStatus,
        refetch: vi.fn(),
      };
    },
    useCourseCatalogAccess: () => ({
      hasAnyCourse: hasAnyCatalogCourse,
      status: catalogAccessStatus,
    }),
  };
});

const libraries = ref<LibraryListDto>({
  items: [
    {
      id: 'lib-1',
      name: 'Backend',
      rootPath: '/srv/backend',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
});
const librariesStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');
vi.mock('~/composables/useLibraries', () => ({
  useLibraries: () => ({ data: libraries, status: librariesStatus }),
}));

// Default to admin so every pre-existing test below (none of which cares
// which empty-state copy renders) keeps seeing exactly the message it did
// before #579 — the no-access / no-courses split only matters once a test
// deliberately sets a non-admin role.
const authUser = ref<{ role?: string } | null>({ role: 'admin' });
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ user: authUser.value }),
}));

const instructors = ref<InstructorListDto>({ items: [], total: 0, offset: 0, limit: 100 });
vi.mock('~/composables/useInstructors', () => ({
  useInstructors: () => ({ data: instructors }),
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'title', 'body'],
    template: '<div>{{ title }}::{{ body }}</div>',
  },
  AppButton: {
    name: 'AppButton',
    props: ['variant', 'size'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  AppChip: {
    name: 'AppChip',
    props: ['label', 'variant', 'selected', 'removeLabel'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppEmptyState: {
    name: 'AppEmptyState',
    props: ['icon', 'title', 'body'],
    template: '<div>{{ title }}<slot name="action" /></div>',
  },
  AppNoPermission: {
    name: 'AppNoPermission',
    props: ['icon', 'title', 'body'],
    template: '<div class="no-permission">{{ title }}</div>',
  },
  AppSelect: {
    name: 'AppSelect',
    props: ['modelValue', 'options', 'size'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)">' +
      '<option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option></select>',
  },
  AppSkeleton: { name: 'AppSkeleton', props: ['width', 'height', 'radius'], template: '<div />' },
  CoursePosterCard: {
    name: 'CoursePosterCard',
    props: ['course', 'interactive'],
    // Exposes course.cover as a data attribute so #496's toCourse() mapping
    // (CourseDto.posterUrl → the card's CSS background) is inspectable.
    template: '<div :data-cover="course.cover" />',
  },
}));

async function mountBrowse(): Promise<VueWrapper> {
  const mod = await import('../browse.vue');
  return mount(mod.default, { global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } } });
}

async function select(wrapper: VueWrapper, testId: string, value: string): Promise<void> {
  const el = wrapper.find(`[data-testid="${testId}"]`);
  await el.setValue(value);
}

describe('browse page filters', () => {
  beforeEach(() => {
    route.query = {};
    courses.value = { items: [] };
    fetchStatus.value = 'success';
    errorStatus.value = null;
    instructors.value = { items: [], total: 0, offset: 0, limit: 100 };
    lastOptions = {};
    replace.mockClear();
    librariesStatus.value = 'success';
    hasAnyCatalogCourse.value = false;
    catalogAccessStatus.value = 'success';
    authUser.value = { role: 'admin' };
  });

  it('renders the library, duration and sort controls', async () => {
    const wrapper = await mountBrowse();

    expect(wrapper.find('[data-testid="browse-filter-library"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="browse-filter-duration"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="browse-sort"]').exists()).toBe(true);
  });

  it('offers sort by duration', async () => {
    const wrapper = await mountBrowse();
    const options = wrapper.find('[data-testid="browse-sort"]').findAll('option');

    expect(options.map((o) => o.attributes('value'))).toContain('duration');
  });

  it('lists every duration bucket from the design bundle', async () => {
    const wrapper = await mountBrowse();
    const values = wrapper
      .find('[data-testid="browse-filter-duration"]')
      .findAll('option')
      .map((o) => o.attributes('value'));

    expect(values).toEqual(['all', 'lt5', '5to10', '10to20', 'gt20']);
  });

  it('hides the instructor filter when nobody is credited', async () => {
    const wrapper = await mountBrowse();
    expect(wrapper.find('[data-testid="browse-filter-instructor"]').exists()).toBe(false);
  });

  it('shows the instructor filter once instructors exist', async () => {
    instructors.value = {
      items: [
        {
          id: 'i-1',
          slug: 'ada',
          displayName: 'Ada Lovelace',
          externalIds: [],
          coursesTotal: 3,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      offset: 0,
      limit: 100,
    };
    const wrapper = await mountBrowse();

    const el = wrapper.find('[data-testid="browse-filter-instructor"]');
    expect(el.exists()).toBe(true);
    expect(el.text()).toContain('Ada Lovelace');
  });

  it('writes the library filter to the query string', async () => {
    const wrapper = await mountBrowse();
    await select(wrapper, 'browse-filter-library', 'lib-1');

    expect(route.query['library']).toBe('lib-1');
  });

  it('writes the duration bucket to the query string', async () => {
    const wrapper = await mountBrowse();
    await select(wrapper, 'browse-filter-duration', '10to20');

    expect(route.query['duration']).toBe('10to20');
  });

  it('writes the sort to the query string', async () => {
    const wrapper = await mountBrowse();
    await select(wrapper, 'browse-sort', 'duration');

    expect(route.query['sort']).toBe('duration');
  });

  it('writes the status chip to the query string', async () => {
    const wrapper = await mountBrowse();
    await wrapper.find('[data-testid="browse-filter-completed"]').trigger('click');

    expect(route.query['status']).toBe('completed');
  });

  it('restores every filter from the URL on a cold load — the reload case', async () => {
    route.query = {
      status: 'in-progress',
      sort: 'duration',
      duration: 'gt20',
      library: 'lib-1',
      instructor: 'i-1',
    };
    await mountBrowse();

    expect(lastOptions['status']?.value).toBe('in-progress');
    expect(lastOptions['sort']?.value).toBe('duration');
    expect(lastOptions['durationBucket']?.value).toBe('gt20');
    expect(lastOptions['libraryId']?.value).toBe('lib-1');
    expect(lastOptions['instructorId']?.value).toBe('i-1');
  });

  it('clears every filter at once and leaves a clean URL', async () => {
    route.query = { status: 'completed', duration: 'gt20', library: 'lib-1', sort: 'newest' };
    const wrapper = await mountBrowse();

    await wrapper.find('[data-testid="browse-clear-filters"]').trigger('click');

    // Sort is not a filter — clearing narrows nothing back, it does not reorder.
    expect(route.query).toEqual({ sort: 'newest' });
  });

  it('offers no clear action when nothing is filtered', async () => {
    const wrapper = await mountBrowse();
    expect(wrapper.find('[data-testid="browse-clear-filters"]').exists()).toBe(false);
  });

  it('explains an empty shelf as filtered when a non-status filter is active', async () => {
    route.query = { duration: 'gt20' };
    const wrapper = await mountBrowse();

    expect(wrapper.text()).toContain('pages.browse.emptyFilteredTitle');
    expect(wrapper.find('[data-testid="browse-empty-clear"]').exists()).toBe(true);
  });

  // #579: an unfiltered empty shelf means something different depending on
  // who's asking — the copy (and whether it's even actionable) must follow.
  describe('empty shelf — no active filter', () => {
    it('tells an admin with zero libraries to add one and scan it', async () => {
      authUser.value = { role: 'admin' };
      libraries.value = { items: [] };
      const wrapper = await mountBrowse();

      expect(wrapper.text()).toContain('pages.browse.emptyTitle');
      expect(wrapper.find('.no-permission').exists()).toBe(false);
    });

    it("tells a member with no grants it's an access problem, not a library one", async () => {
      authUser.value = { role: 'member' };
      libraries.value = { items: [] };
      const wrapper = await mountBrowse();

      expect(wrapper.find('.no-permission').text()).toContain('pages.browse.emptyNoAccessTitle');
      // The admin-only "add a library" copy must not leak to a member who
      // cannot reach /admin at all.
      expect(wrapper.text()).not.toContain('pages.browse.emptyTitle');
    });

    // #701: a full filter bar (4 chips + 3 selects) rendering above "you have
    // no access" was 13 interactive controls operating on nothing.
    it('hides the filter bar and the "0 courses" count for a denied member (#701)', async () => {
      authUser.value = { role: 'member' };
      libraries.value = { items: [] };
      const wrapper = await mountBrowse();

      expect(wrapper.find('[data-testid="browse-filter-library"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="browse-sort"]').exists()).toBe(false);
      expect(wrapper.find('[role="group"]').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('pages.browse.subtitle');
    });

    // A stale filter in a bookmarked URL must not mask the denial behind the
    // "filtered" empty state — access is checked independently of the query
    // string (#701).
    it('still shows the access denial when a denied member has a stale filter in the URL', async () => {
      authUser.value = { role: 'member' };
      libraries.value = { items: [] };
      route.query = { duration: 'gt20' };
      const wrapper = await mountBrowse();

      expect(wrapper.find('.no-permission').text()).toContain('pages.browse.emptyNoAccessTitle');
      expect(wrapper.text()).not.toContain('pages.browse.emptyFilteredTitle');
    });

    it('tells a member with a granted-but-empty library to check back, not to add a library', async () => {
      authUser.value = { role: 'member' };
      libraries.value = {
        items: [{ id: 'lib-1', name: 'Backend', rootPath: '/srv/backend' }],
      } as unknown as LibraryListDto;
      const wrapper = await mountBrowse();

      expect(wrapper.text()).toContain('pages.browse.emptyNoCoursesTitle');
      expect(wrapper.find('.no-permission').exists()).toBe(false);
    });

    // tuxedo 249: a COURSE-level grant (the admin UI offers those) puts
    // courses in `GET /courses` without ever putting a row in `GET
    // /libraries` — `AuthorizationService.canSee`'s library-grant-implies-
    // course-access rule doesn't run in reverse. A member holding only that
    // grant must see the catalogue, not the access denial.
    it('shows the catalogue for a member with only a course-level grant (tuxedo 249)', async () => {
      authUser.value = { role: 'member' };
      libraries.value = { items: [] };
      hasAnyCatalogCourse.value = true;
      courses.value = {
        items: [
          {
            id: 'c-course-grant',
            title: 'Granted Course',
            instructors: [],
            progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 5 },
          },
        ],
      } as unknown as CourseListDto;
      const wrapper = await mountBrowse();

      expect(wrapper.find('.no-permission').exists()).toBe(false);
      expect(wrapper.find('[data-testid="browse-filter-library"]').exists()).toBe(true);
      expect(wrapper.findAll('.page-browse__card-link')).toHaveLength(1);
    });
  });

  // #496: a course with a downloaded poster shows it; one without falls back
  // to the accent placeholder CoursePosterCard already renders on undefined.
  // #212: a 429 got the same "check your connection" copy as a genuine
  // failure — wrong advice when the connection is fine and retrying only
  // extends the block.
  it('shows rate-limit copy on a 429, not the generic connection-check body', async () => {
    fetchStatus.value = 'error';
    errorStatus.value = 429;
    const wrapper = await mountBrowse();

    expect(wrapper.text()).toContain('ui.errors.rateLimitedBody');
    expect(wrapper.text()).not.toContain('pages.browse.errorBody');
  });

  it('keeps the generic connection-check body on a non-429 failure', async () => {
    fetchStatus.value = 'error';
    errorStatus.value = 500;
    const wrapper = await mountBrowse();

    expect(wrapper.text()).toContain('pages.browse.errorBody');
  });

  it('passes a background-image cover for a course with a stored poster, and none without', async () => {
    courses.value = {
      items: [
        {
          id: 'c-poster',
          title: 'Has Poster',
          posterUrl: '/api/v1/courses/c-poster/poster?token=tok',
        },
        { id: 'c-none', title: 'No Poster', posterUrl: null },
      ].map(
        (course) =>
          ({
            ...course,
            instructors: [],
            progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
          }) as unknown as CourseListDto['items'][number],
      ),
    };
    const wrapper = await mountBrowse();

    const cards = wrapper.findAll('[data-cover]');
    expect(cards[0]?.attributes('data-cover')).toBe(
      'url(/api/v1/courses/c-poster/poster?token=tok) center / cover no-repeat',
    );
    expect(cards[1]?.attributes('data-cover')).toBeUndefined();
  });
});
