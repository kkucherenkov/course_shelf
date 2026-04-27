import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppBookmarkAdd from './AppBookmarkAdd.vue';

describe('AppBookmarkAdd', () => {
  it('renders the time chip with M:SS formatting', () => {
    const wrapper = mount(AppBookmarkAdd, { props: { time: 305 } });
    expect(wrapper.find('.app-bookmark-add__time').text()).toBe('5:05');
  });

  it('emits save with the trimmed label and current time when Save clicked', async () => {
    const wrapper = mount(AppBookmarkAdd, { props: { time: 90 } });
    const input = wrapper.find('input');
    await input.setValue('  Quorum recap  ');
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Save')!
      .trigger('click');
    expect(wrapper.emitted('save')).toEqual([[{ time: 90, label: 'Quorum recap' }]]);
  });

  it('saves with an empty label when none is typed', async () => {
    const wrapper = mount(AppBookmarkAdd, { props: { time: 42 } });
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Save')!
      .trigger('click');
    expect(wrapper.emitted('save')).toEqual([[{ time: 42, label: '' }]]);
  });

  it('clears the label after a save', async () => {
    const wrapper = mount(AppBookmarkAdd, { props: { time: 90 } });
    const input = wrapper.find('input');
    await input.setValue('Recap');
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Save')!
      .trigger('click');
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('Enter inside the input fires save', async () => {
    const wrapper = mount(AppBookmarkAdd, { props: { time: 90 } });
    const input = wrapper.find('input');
    await input.setValue('From keyboard');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('save')).toEqual([[{ time: 90, label: 'From keyboard' }]]);
  });

  it('Escape inside the input emits cancel and clears the label', async () => {
    const wrapper = mount(AppBookmarkAdd, { props: { time: 90 } });
    const input = wrapper.find('input');
    await input.setValue('Discard me');
    await input.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('cancel')).toEqual([[]]);
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('does not emit save while submitting=true', async () => {
    const wrapper = mount(AppBookmarkAdd, {
      props: { time: 90, submitting: true },
    });
    const input = wrapper.find('input');
    await input.setValue('In flight');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('disables the input while submitting', () => {
    const wrapper = mount(AppBookmarkAdd, {
      props: { time: 90, submitting: true },
    });
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true);
  });
});
