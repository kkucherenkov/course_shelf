/**
 * Spec for PlayerTranscriptTab component.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayerTranscriptTab from '../PlayerTranscriptTab.vue';
import type { TranscriptCue } from '~/composables/useTranscriptCues';

// The real `@app/ui` barrel drags in Nuxt UI components this test
// environment can't resolve (no Nuxt build context) — same reason
// search.spec.ts stubs it. AppIconButton/AppButton are the only ones this
// file uses.
vi.mock('@app/ui', () => ({
  AppIconButton: {
    name: 'AppIconButton',
    props: ['name', 'variant', 'size', 'ariaLabel'],
    emits: ['click'],
    template: '<button type="button" :aria-label="ariaLabel" @click="$emit(\'click\', $event)" />',
  },
  AppButton: {
    name: 'AppButton',
    props: ['variant', 'size', 'label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\', $event)">{{ label }}</button>',
  },
}));

const CUES: TranscriptCue[] = [
  { start: 0, end: 4, text: 'Welcome to the lesson' },
  { start: 4, end: 65, text: 'Today we cover hooks' },
  { start: 65, end: 130, text: 'Let us look at an example' },
];

const baseProps = {
  cues: CUES,
  activeIndex: -1,
  hasTranscript: true,
  loadError: false,
  emptyLabel: 'This lesson has no transcript.',
  errorLabel: 'Could not load the transcript.',
  loadingLabel: 'Loading transcript…',
  retryLabel: 'Try again',
  noMatchLabel: 'No lines match your search.',
  filterPlaceholder: 'Filter transcript',
  addFlashcardLabel: 'Create a flashcard from this line',
};

describe('PlayerTranscriptTab', () => {
  it('says the lesson has no transcript rather than blaming the search', () => {
    // The panel used to be hidden unless the lesson had cues, so this branch
    // did not exist and the filter's own "no match" line answered instead —
    // telling a reader their search found nothing when they had not searched.
    // Removing that `v-if` (the panel now carries the empty state, since the
    // sidebar tab that used to is gone) is what made this reachable.
    const wrapper = mount(PlayerTranscriptTab, {
      props: { ...baseProps, cues: [], hasTranscript: false },
    });

    expect(wrapper.text()).toContain('This lesson has no transcript.');
    expect(wrapper.text()).not.toContain('No lines match your search.');
    // No filter to offer when there is nothing to filter.
    expect(wrapper.find('input[type="search"]').exists()).toBe(false);
  });

  it('says loading failed, not "no transcript", when the track errored (audit run20 finding 1)', () => {
    // Whether the lesson has a transcript is a server-known signal
    // (`hasTranscript`), independent of `loadError` — a lesson can have one
    // and still fail to load it. The two used to be conflated into a single
    // `cues.length === 0` check, which made a 404 on the subtitle track read
    // as "this lesson has no transcript" — the flagship v2 feature looking
    // unimplemented on any network error.
    const wrapper = mount(PlayerTranscriptTab, {
      props: { ...baseProps, cues: [], hasTranscript: true, loadError: true },
    });

    expect(wrapper.text()).toContain('Could not load the transcript.');
    expect(wrapper.text()).not.toContain('This lesson has no transcript.');
    expect(wrapper.find('input[type="search"]').exists()).toBe(false);
  });

  it('emits retry when the retry action is clicked on the error state', async () => {
    const wrapper = mount(PlayerTranscriptTab, {
      props: { ...baseProps, cues: [], hasTranscript: true, loadError: true },
    });

    await wrapper.find('.player-transcript-tab__error button').trigger('click');

    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('shows a loading line, not "no transcript", while a known transcript has not produced cues yet', () => {
    const wrapper = mount(PlayerTranscriptTab, {
      props: { ...baseProps, cues: [], hasTranscript: true, loadError: false },
    });

    expect(wrapper.text()).toContain('Loading transcript…');
    expect(wrapper.text()).not.toContain('This lesson has no transcript.');
    expect(wrapper.text()).not.toContain('Could not load the transcript.');
  });

  it('renders one row per cue', () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    expect(wrapper.findAll('.player-transcript-tab__row')).toHaveLength(CUES.length);
  });

  it('shows formatted timestamps, minutes:seconds and hours:minutes:seconds', () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    const times = wrapper.findAll('.player-transcript-tab__time').map((n) => n.text());
    expect(times).toEqual(['0:00', '0:04', '1:05']);
  });

  it('marks the cue under the playhead active and aria-current', () => {
    const wrapper = mount(PlayerTranscriptTab, { props: { ...baseProps, activeIndex: 1 } });
    const rows = wrapper.findAll('.player-transcript-tab__row');
    expect(rows[1]?.classes()).toContain('player-transcript-tab__row--active');
    expect(rows[1]?.attributes('aria-current')).toBe('true');
    expect(rows[0]?.attributes('aria-current')).toBeUndefined();
  });

  it('emits seek in seconds when a cue is clicked', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    await wrapper.findAll('.player-transcript-tab__row')[2]?.trigger('click');
    expect(wrapper.emitted('seek')).toEqual([[65]]);
  });

  it('filters cues case-insensitively over the in-memory array', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    await wrapper.find('.player-transcript-tab__filter').setValue('HOOKS');
    const rows = wrapper.findAll('.player-transcript-tab__row');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.text()).toContain('Today we cover hooks');
  });

  it('shows the no-match state when the filter matches nothing', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    await wrapper.find('.player-transcript-tab__filter').setValue('nonexistent');
    expect(wrapper.find('.player-transcript-tab__no-match').text()).toBe(baseProps.noMatchLabel);
    expect(wrapper.find('.player-transcript-tab__row').exists()).toBe(false);
  });

  it("emits createFlashcard with that row's cue when its add button is clicked (E29-F01-S03)", async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    await wrapper.findAll('.player-transcript-tab__add')[1]?.trigger('click');
    expect(wrapper.emitted('createFlashcard')).toEqual([[CUES[1]]]);
  });
});

describe('PlayerTranscriptTab — scroll-into-view', () => {
  it('scrolls the newly active row into view when activeIndex changes', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    const scrollIntoView = vi.fn();
    wrapper.findAll('.player-transcript-tab__row')[1]!.element.scrollIntoView = scrollIntoView;

    await wrapper.setProps({ activeIndex: 1 });

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'nearest', behavior: 'smooth' }),
    );
  });

  it('uses an instant jump under prefers-reduced-motion', async () => {
    vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);

    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    const scrollIntoView = vi.fn();
    wrapper.findAll('.player-transcript-tab__row')[1]!.element.scrollIntoView = scrollIntoView;

    await wrapper.setProps({ activeIndex: 1 });

    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    vi.restoreAllMocks();
  });

  it('stops auto-scrolling once the reader has scrolled the panel themselves', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    const rows = wrapper.findAll('.player-transcript-tab__row');
    const scrollIntoView = vi.fn();
    rows[1]!.element.scrollIntoView = scrollIntoView;
    rows[2]!.element.scrollIntoView = scrollIntoView;

    wrapper.find('.player-transcript-tab').element.dispatchEvent(new Event('wheel'));
    await wrapper.setProps({ activeIndex: 1 });
    await wrapper.setProps({ activeIndex: 2 });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not scroll when there is no active cue', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: { ...baseProps, activeIndex: 0 } });
    const scrollIntoView = vi.fn();
    wrapper.findAll('.player-transcript-tab__row')[0]!.element.scrollIntoView = scrollIntoView;

    await wrapper.setProps({ activeIndex: -1 });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
