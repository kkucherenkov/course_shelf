/**
 * Spec for SearchTranscriptGroup (E27-F02-S02).
 *
 * Covers what the card's Tests section asks for: grouping, the link target
 * including the seconds-converted timestamp, the matched-substring
 * highlight, and the empty-array case — what `transcripts === undefined`
 * becomes once the page defaults it before handing it down.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { SearchTranscriptHitDto } from '@app/api-client-ts';
import SearchTranscriptGroup from '../SearchTranscriptGroup.vue';

// Real @app/ui pulls in Nuxt UI components that rely on Nuxt build-time
// aliases (`#build/ui/badge`) unavailable under plain Vitest — mock the
// module rather than stub it, so the component's `import ... from '@app/ui'`
// never resolves the real package. `vi.mock` calls are hoisted above the
// static import above, so the mock is in place before it runs.
// AppRow/IconCS stand in for their slot/prop contract; visual rendering is
// @app/ui's concern, not this one's.
vi.mock('@app/ui', () => ({
  AppRow: { template: '<div><slot name="leading" /><slot /><slot name="trailing" /></div>' },
  IconCS: { props: ['name', 'size'], template: '<i />' },
}));

const globalStubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
};

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

describe('SearchTranscriptGroup', () => {
  it('renders the translated title and one row per hit', () => {
    const wrapper = mount(SearchTranscriptGroup, {
      props: {
        hits: [hit({ lessonId: 'l1' }), hit({ lessonId: 'l2' })],
        query: 'hooks',
        title: 'Transcripts',
      },
      global: { stubs: globalStubs },
    });
    expect(wrapper.find('.search-transcript-group__title').text()).toBe('Transcripts');
    expect(wrapper.findAll('.search-transcript-group__list-item')).toHaveLength(2);
  });

  it('links each entry to the lesson at the cue timestamp, in seconds', () => {
    const wrapper = mount(SearchTranscriptGroup, {
      props: {
        hits: [hit({ courseId: 'c9', lessonId: 'l9', startMs: 142_500 })],
        query: 'hooks',
        title: 'Transcripts',
      },
      global: { stubs: globalStubs },
    });
    expect(wrapper.find('.search-transcript-group__link').attributes('href')).toBe(
      '/courses/c9/lessons/l9?t=142.5',
    );
  });

  it('highlights the matched substring in the cue text, case-insensitively', () => {
    const wrapper = mount(SearchTranscriptGroup, {
      props: {
        hits: [hit({ text: 'Today we cover Hooks in depth' })],
        query: 'hooks',
        title: 'Transcripts',
      },
      global: { stubs: globalStubs },
    });
    const mark = wrapper.find('.search-transcript-group__highlight');
    expect(mark.exists()).toBe(true);
    expect(mark.text()).toBe('Hooks');
  });

  it('renders nothing for an empty hit list', () => {
    const wrapper = mount(SearchTranscriptGroup, {
      props: { hits: [], query: 'hooks', title: 'Transcripts' },
      global: { stubs: globalStubs },
    });
    expect(wrapper.find('.search-transcript-group').exists()).toBe(false);
  });
});
