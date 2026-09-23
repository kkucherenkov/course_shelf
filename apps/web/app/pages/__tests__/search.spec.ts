/**
 * Spec for apps/web/app/pages/search.vue's transcript wiring (E27-F02-S02).
 *
 * `SearchTranscriptGroup` itself is covered by its own colocated spec — this
 * file is about the page: `transcripts` defaulting when the backend response
 * omits the optional field, and `isEmpty`/`totalCount` correctly counting
 * transcript hits so a transcript-only match doesn't fall into the
 * "no results" empty state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactive, ref, type Ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

import type { LocationQuery } from 'vue-router';
import type {
  LibraryListDto,
  SearchCourseHit,
  SearchLessonHit,
  SearchResultDto,
  SearchTranscriptHitDto,
} from '@app/api-client-ts';
import type { SearchStatus } from '../../composables/useSearch';

const route = reactive<{ query: LocationQuery }>({ query: { q: 'hooks' } });

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => route);

const searchData = ref<SearchResultDto | null>(null) as Ref<SearchResultDto | null>;
const searchStatus = ref<SearchStatus>('success');
const searchErrorStatus = ref<number | null>(null);
const retry = vi.fn();

vi.mock('~/composables/useSearch', () => ({
  useSearch: () => ({
    data: searchData,
    status: searchStatus,
    error: ref(null),
    errorStatus: searchErrorStatus,
    retry,
  }),
}));

// ── Catalog-access probe (audit run22 finding 6/#801) ─────────────────────
// Same two-probe check browse.spec.ts stubs. Defaults to "granted" so every
// pre-existing test below (none of which cares about access) keeps seeing
// exactly what it did before — only the dedicated describe block flips these.
const hasAnyCatalogCourse = ref(false);
const catalogAccessStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');
vi.mock('~/composables/useCoursesList', () => ({
  useCourseCatalogAccess: () => ({
    hasAnyCourse: hasAnyCatalogCourse,
    status: catalogAccessStatus,
    refetch: vi.fn(),
  }),
}));

const grantedLibrary: LibraryListDto['items'][number] = {
  id: 'lib-1',
  name: 'Backend',
  rootPath: '/srv/backend',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};
const libraries = ref<LibraryListDto>({ items: [grantedLibrary] });
const librariesStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success');
vi.mock('~/composables/useLibraries', () => ({
  useLibraries: () => ({ data: libraries, status: librariesStatus, refresh: vi.fn() }),
}));

const authUser = ref<{ role?: string } | null>({ role: 'member' });
vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ user: authUser.value }) }));

vi.mock('@app/ui', async () => {
  // `initials`/`COVER` are the actual fix under test (#569: search.vue must
  // consume the one shared implementation, not a local copy) — keep them
  // real, pulled from the dependency-free submodule directly (the full
  // `@app/ui` barrel drags in Nuxt UI components this test environment
  // can't resolve). Only the presentational components below are stubbed.
  const { initials, COVER } = await import('@app/ui/components/CourseCard/cover-map.ts');
  return {
    initials,
    COVER,
    AppButton: {
      name: 'AppButton',
      props: ['variant', 'size', 'label', 'to'],
      template: '<button />',
    },
    AppEmptyState: {
      name: 'AppEmptyState',
      props: ['icon', 'title', 'body'],
      template: '<div class="empty-state">{{ title }}<slot name="action" /></div>',
    },
    AppErrorState: {
      name: 'AppErrorState',
      props: ['icon', 'title', 'body'],
      template:
        '<div class="error-state" role="alert">{{ title }}<p>{{ body }}</p><slot name="action" /></div>',
    },
    AppNoPermission: {
      name: 'AppNoPermission',
      props: ['icon', 'title', 'body'],
      template: '<div class="no-permission">{{ title }}::{{ body }}</div>',
    },
    AppSkeleton: {
      name: 'AppSkeleton',
      props: ['width', 'height', 'radius'],
      template: '<div />',
    },
    AppRow: {
      name: 'AppRow',
      template: '<div><slot name="leading" /><slot /><slot name="trailing" /></div>',
    },
    IconCS: { name: 'IconCS', props: ['name', 'size'], template: '<i />' },
  };
});

function courseHit(overrides: Partial<SearchCourseHit> = {}): SearchCourseHit {
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    title: 'Advanced Vue Patterns',
    slug: 'advanced-vue-patterns',
    lessonsTotal: 12,
    ...overrides,
  };
}

function lessonHit(overrides: Partial<SearchLessonHit> = {}): SearchLessonHit {
  return {
    id: 'lesson-1',
    courseId: 'course-1',
    courseTitle: 'Advanced Vue Patterns',
    sectionTitle: 'Section 1',
    title: 'Composables',
    position: 1,
    ...overrides,
  };
}

function hit(overrides: Partial<SearchTranscriptHitDto> = {}): SearchTranscriptHitDto {
  return {
    lessonId: 'l1',
    lessonTitle: 'Intro to hooks',
    courseId: 'c1',
    courseTitle: 'React Deep Dive',
    sectionTitle: 'Section 1 · Basics',
    language: 'en',
    startMs: 4000,
    text: 'Today we cover hooks',
    ...overrides,
  };
}

async function mountSearch(): Promise<VueWrapper> {
  const mod = await import('../search.vue');
  return mount(mod.default, {
    global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  });
}

// Reset the access probes to "granted" before every test — only the
// dedicated describe block below sets them to a denied shape.
beforeEach(() => {
  hasAnyCatalogCourse.value = false;
  catalogAccessStatus.value = 'success';
  libraries.value = { items: [grantedLibrary] };
  librariesStatus.value = 'success';
  authUser.value = { role: 'member' };
});

describe('search page — transcript wiring', () => {
  beforeEach(() => {
    route.query = { q: 'hooks' };
    searchStatus.value = 'success';
  });

  it('renders no transcript group when transcripts is undefined', async () => {
    searchData.value = { query: 'hooks', courses: [], lessons: [] };
    const wrapper = await mountSearch();
    expect(wrapper.find('.search-transcript-group').exists()).toBe(false);
  });

  it('shows results, not the empty state, when only transcripts match', async () => {
    searchData.value = { query: 'hooks', courses: [], lessons: [], transcripts: [hit()] };
    const wrapper = await mountSearch();
    expect(wrapper.find('.empty-state').exists()).toBe(false);
    expect(wrapper.find('.search-transcript-group').exists()).toBe(true);
  });
});

// Regression coverage for #569: a course hit and a lesson hit for the same
// course used to render two different sets of initials (this page split
// `title` on raw whitespace; @app/ui's CourseCard filtered by word length)
// on a flat `--brand-accent` fill, instead of the catalog's per-course hue.
describe('search page — course/lesson cover identity', () => {
  beforeEach(() => {
    route.query = { q: 'vue' };
    searchStatus.value = 'success';
  });

  it('renders the course thumb with @app/ui initials() and the per-course COVER accent', async () => {
    searchData.value = {
      query: 'vue',
      courses: [courseHit({ title: 'Основы Vue' })],
      lessons: [],
    };
    const wrapper = await mountSearch();
    expect(wrapper.find('.page-search__item-initials').text()).toBe('VU');
    const thumb = wrapper.find('.page-search__item-thumb');
    expect(thumb.attributes('style')).toMatch(/var\(--media-cover-[a-z]+\)/);
    expect(thumb.attributes('style')).not.toContain('brand-accent');
  });

  it('gives a lesson thumb the same cover accent as its parent course', async () => {
    searchData.value = {
      query: 'vue',
      courses: [],
      lessons: [lessonHit({ courseId: 'course-42', courseTitle: 'Advanced Vue Patterns' })],
    };
    const wrapper = await mountSearch();
    expect(wrapper.find('.page-search__item-initials').text()).toBe('AV');
    const thumb = wrapper.find('.page-search__item-thumb');
    expect(thumb.attributes('style')).toMatch(/var\(--media-cover-[a-z]+\)/);
  });
});

// Regression coverage for #624: the error state used to be a hand-rolled
// `role="alert"` div — the only bespoke error markup in the app, instead of
// the shared `AppErrorState` every other error state renders through.
describe('search page — error state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    route.query = { q: 'hooks' };
    searchErrorStatus.value = null;
  });

  it('renders through AppErrorState with a retry action, not bespoke markup', async () => {
    searchStatus.value = 'error';
    const wrapper = await mountSearch();

    expect(wrapper.find('.error-state').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('.error-state').text()).toContain('pages.search.errorBody');

    await wrapper.find('.error-state button').trigger('click');
    expect(retry).toHaveBeenCalled();
  });

  it('shows the rate-limit body on a 429, not the generic one', async () => {
    searchStatus.value = 'error';
    searchErrorStatus.value = 429;
    const wrapper = await mountSearch();

    expect(wrapper.find('.error-state').text()).toContain('pages.search.errorBodyRateLimited');
  });
});

// Audit run22 finding 6/#801: a zero-grant account used to get "Ничего не
// найдено… проверьте написание" — the same wrong advice /browse fixed for
// itself in #701, now reused here instead of re-invented.
describe('search page — zero-grant account blames access, not spelling', () => {
  beforeEach(() => {
    route.query = { q: 'физика' };
    searchStatus.value = 'success';
    searchData.value = { query: 'физика', courses: [], lessons: [] };
  });

  it('shows the access-denied state, not "no matches", when the account has zero grants', async () => {
    libraries.value = { items: [] };
    hasAnyCatalogCourse.value = false;
    const wrapper = await mountSearch();

    expect(wrapper.find('.no-permission').text()).toContain('pages.browse.emptyNoAccessTitle');
    expect(wrapper.text()).not.toContain('pages.search.emptyNoMatches');
  });

  it('shows the ordinary no-matches state when the account has access', async () => {
    const wrapper = await mountSearch();

    expect(wrapper.find('.no-permission').exists()).toBe(false);
    expect(wrapper.text()).toContain('pages.search.emptyNoMatches');
  });

  it('never shows access-denied for an admin session — admins have no grant gate', async () => {
    // isAdmin short-circuits hasCatalogAccess to true in the page's own
    // logic; an admin's zero-course result is a genuine empty catalog, not a
    // denial, so this must NOT show the access-denied copy.
    authUser.value = { role: 'admin' };
    libraries.value = { items: [] };
    hasAnyCatalogCourse.value = false;
    const wrapper = await mountSearch();

    expect(wrapper.find('.no-permission').exists()).toBe(false);
  });

  it('does not repeat the empty-state title as a subtitle above it', async () => {
    const wrapper = await mountSearch();
    expect(wrapper.find('.page-search__subtitle').exists()).toBe(false);
  });
});
