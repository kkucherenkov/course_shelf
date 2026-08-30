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
});

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => route);
vi.stubGlobal('useRouter', () => ({ replace }));
vi.stubGlobal('computed', computed);

// ── Data composables ───────────────────────────────────────────────────────
// The list is stubbed so the page's filter wiring is what is under test, not
// the fetch. `lastOptions` captures the refs the page handed over, which is
// how the assertions read the live filter state.
const courses = ref<CourseListDto>({ items: [] });
const fetchStatus = ref('success');
let lastOptions: Record<string, { value: string }> = {};

vi.mock('~/composables/useCoursesList', async () => {
  const actual = await vi.importActual<typeof CoursesListModule>(
    '../../composables/useCoursesList',
  );
  return {
    ...actual,
    useCoursesList: (options: Record<string, { value: string }>) => {
      lastOptions = options;
      return { data: courses, status: fetchStatus, error: ref(null), refetch: vi.fn() };
    },
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
vi.mock('~/composables/useLibraries', () => ({
  useLibraries: () => ({ data: libraries }),
}));

const instructors = ref<InstructorListDto>({ items: [], total: 0, offset: 0, limit: 100 });
vi.mock('~/composables/useInstructors', () => ({
  useInstructors: () => ({ data: instructors }),
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppBanner: { name: 'AppBanner', props: ['variant', 'title', 'body'], template: '<div />' },
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
    template: '<div />',
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
    instructors.value = { items: [], total: 0, offset: 0, limit: 100 };
    lastOptions = {};
    replace.mockClear();
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
});
