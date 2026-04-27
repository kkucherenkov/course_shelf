import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppBookmarkList from './AppBookmarkList.vue';
import type { BookmarkEntry } from './AppBookmarkList.vue';

const sample: BookmarkEntry[] = [
  { id: 'a', time: 60, label: 'Intro' },
  { id: 'b', time: 305, label: 'Worked example' },
  { id: 'c', time: 612 },
];

describe('AppBookmarkList', () => {
  it('renders one AppBookmark per entry', () => {
    const wrapper = mount(AppBookmarkList, { props: { bookmarks: sample } });
    expect(wrapper.findAll('.app-bookmark')).toHaveLength(3);
  });

  it('renders the empty state when no bookmarks and no add row', () => {
    const wrapper = mount(AppBookmarkList, { props: { bookmarks: [] } });
    expect(wrapper.find('.app-empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('No bookmarks yet');
  });

  it('omits the empty state when an add row is shown', () => {
    const wrapper = mount(AppBookmarkList, {
      props: { bookmarks: [], addTime: 90 },
    });
    expect(wrapper.find('.app-empty-state').exists()).toBe(false);
    expect(wrapper.find('.app-bookmark-add').exists()).toBe(true);
  });

  it('mounts the add row above the list when addTime is provided', () => {
    const wrapper = mount(AppBookmarkList, {
      props: { bookmarks: sample, addTime: 90 },
    });
    const root = wrapper.find('.app-bookmark-list').element as HTMLElement;
    const first = root.firstElementChild;
    expect(first?.className).toContain('app-bookmark-add');
  });

  it('forwards select / edit / delete with the entry id', async () => {
    const wrapper = mount(AppBookmarkList, { props: { bookmarks: sample } });
    const rows = wrapper.findAll('.app-bookmark');
    await rows[0]!.trigger('click');
    await rows[1]!.find('button[aria-label="Edit bookmark"]').trigger('click');
    await rows[2]!.find('button[aria-label="Delete bookmark"]').trigger('click');
    expect(wrapper.emitted('select')).toEqual([['a']]);
    expect(wrapper.emitted('edit')).toEqual([['b']]);
    expect(wrapper.emitted('delete')).toEqual([['c']]);
  });

  it('forwards addSave / addCancel from the add row', async () => {
    const wrapper = mount(AppBookmarkList, {
      props: { bookmarks: [], addTime: 305 },
    });
    const input = wrapper.find('input');
    await input.setValue('Recap');
    await input.trigger('keydown', { key: 'Enter' });
    await input.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('addSave')).toEqual([[{ time: 305, label: 'Recap' }]]);
    expect(wrapper.emitted('addCancel')).toEqual([[]]);
  });

  it('hides row actions when editable=false', () => {
    const wrapper = mount(AppBookmarkList, {
      props: { bookmarks: sample, editable: false },
    });
    expect(wrapper.findAll('.app-bookmark__actions')).toHaveLength(0);
  });
});
