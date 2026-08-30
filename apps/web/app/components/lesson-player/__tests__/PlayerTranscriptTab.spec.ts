/**
 * Spec for PlayerTranscriptTab component.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayerTranscriptTab from '../PlayerTranscriptTab.vue';
import type { TranscriptCue } from '~/composables/useTranscriptCues';

const CUES: TranscriptCue[] = [
  { start: 0, end: 4, text: 'Welcome to the lesson' },
  { start: 4, end: 65, text: 'Today we cover hooks' },
  { start: 65, end: 130, text: 'Let us look at an example' },
];

const baseProps = {
  cues: CUES,
  activeIndex: -1,
  emptyLabel: 'No transcript for this lesson.',
  noMatchLabel: 'No lines match your search.',
  filterPlaceholder: 'Filter transcript',
};

describe('PlayerTranscriptTab', () => {
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

  it('shows the empty state and hides the filter box when there is no transcript', () => {
    const wrapper = mount(PlayerTranscriptTab, { props: { ...baseProps, cues: [] } });
    expect(wrapper.find('.player-transcript-tab__empty').text()).toBe(baseProps.emptyLabel);
    expect(wrapper.find('.player-transcript-tab__filter').exists()).toBe(false);
  });
});
