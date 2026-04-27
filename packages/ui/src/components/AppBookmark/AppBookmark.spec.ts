import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppBookmark from './AppBookmark.vue';

const baseProps = { time: 305, label: 'Quorum reads worked example' };

describe('AppBookmark', () => {
  it('formats time as M:SS in the time chip', () => {
    const wrapper = mount(AppBookmark, { props: baseProps });
    expect(wrapper.find('.app-bookmark__time').text()).toBe('5:05');
  });

  it('formats hour-long times as H:MM:SS', () => {
    const wrapper = mount(AppBookmark, { props: { ...baseProps, time: 3725 } });
    expect(wrapper.find('.app-bookmark__time').text()).toBe('1:02:05');
  });

  it('renders the label and exposes a descriptive aria-label', () => {
    const wrapper = mount(AppBookmark, { props: baseProps });
    expect(wrapper.find('.app-bookmark__label').text()).toBe('Quorum reads worked example');
    expect(wrapper.find('.app-bookmark').attributes('aria-label')).toBe(
      'Bookmark at 5:05: Quorum reads worked example',
    );
  });

  it('falls back to a time-only aria-label when no label is provided', () => {
    const wrapper = mount(AppBookmark, { props: { time: 60 } });
    expect(wrapper.find('.app-bookmark').attributes('aria-label')).toBe('Bookmark at 1:00');
  });

  it('renders the edit + delete actions when editable (default)', () => {
    const wrapper = mount(AppBookmark, { props: baseProps });
    expect(wrapper.find('button[aria-label="Edit bookmark"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Delete bookmark"]').exists()).toBe(true);
  });

  it('omits the action row when editable=false', () => {
    const wrapper = mount(AppBookmark, { props: { ...baseProps, editable: false } });
    expect(wrapper.find('.app-bookmark__actions').exists()).toBe(false);
  });

  it('emits select on row click and on Enter / Space', async () => {
    const wrapper = mount(AppBookmark, { props: baseProps });
    await wrapper.find('.app-bookmark').trigger('click');
    await wrapper.find('.app-bookmark').trigger('keydown', { key: 'Enter' });
    await wrapper.find('.app-bookmark').trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('select')).toEqual([[], [], []]);
  });

  it('edit / delete buttons emit their event without bubbling select', async () => {
    const wrapper = mount(AppBookmark, { props: baseProps });
    await wrapper.find('button[aria-label="Edit bookmark"]').trigger('click');
    await wrapper.find('button[aria-label="Delete bookmark"]').trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[]]);
    expect(wrapper.emitted('delete')).toEqual([[]]);
    expect(wrapper.emitted('select')).toBeUndefined();
  });
});
