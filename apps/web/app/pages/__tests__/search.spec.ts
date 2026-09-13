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
import type { SearchResultDto, SearchTranscriptHitDto } from '@app/api-client-ts';
import type { SearchStatus } from '../../composables/useSearch';

const route = reactive<{ query: LocationQuery }>({ query: { q: 'hooks' } });

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => route);

const searchData = ref<SearchResultDto | null>(null) as Ref<SearchResultDto | null>;
const searchStatus = ref<SearchStatus>('success');

vi.mock('~/composables/useSearch', () => ({
  useSearch: () => ({
    data: searchData,
    status: searchStatus,
    error: ref(null),
    errorStatus: ref(null),
    retry: vi.fn(),
  }),
}));

vi.mock('@app/ui', () => ({
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
  AppSkeleton: { name: 'AppSkeleton', props: ['width', 'height', 'radius'], template: '<div />' },
  AppRow: {
    name: 'AppRow',
    template: '<div><slot name="leading" /><slot /><slot name="trailing" /></div>',
  },
  IconCS: { name: 'IconCS', props: ['name', 'size'], template: '<i />' },
}));

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
