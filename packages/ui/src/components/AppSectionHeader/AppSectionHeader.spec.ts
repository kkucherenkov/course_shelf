import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppSectionHeader from './AppSectionHeader.vue';

const baseProps = {
  idx: 2,
  title: 'Type narrowing',
  count: 5,
  duration: 4500, // 1h 15m
};

describe('AppSectionHeader', () => {
  it('renders the padded section title', () => {
    const wrapper = mount(AppSectionHeader, { props: baseProps });
    expect(wrapper.find('.app-section-header__title').text()).toBe('Section 02 · Type narrowing');
  });

  it('formats duration as Xh Ym when there are full hours', () => {
    const wrapper = mount(AppSectionHeader, { props: baseProps });
    expect(wrapper.find('.app-section-header__meta').text()).toBe('5 lessons · 1h 15m');
  });

  it('formats duration without minutes when zero', () => {
    const wrapper = mount(AppSectionHeader, {
      props: { ...baseProps, duration: 3600 },
    });
    expect(wrapper.find('.app-section-header__meta').text()).toBe('5 lessons · 1h');
  });

  it('formats sub-hour durations as Ym', () => {
    const wrapper = mount(AppSectionHeader, {
      props: { ...baseProps, duration: 540 },
    });
    expect(wrapper.find('.app-section-header__meta').text()).toBe('5 lessons · 9m');
  });

  it('uses singular "lesson" when count=1', () => {
    const wrapper = mount(AppSectionHeader, {
      props: { ...baseProps, count: 1 },
    });
    expect(wrapper.find('.app-section-header__meta').text()).toBe('1 lesson · 1h 15m');
  });

  it('exposes aria-expanded + data-open mirroring the open prop', async () => {
    const wrapper = mount(AppSectionHeader, {
      props: { ...baseProps, open: true },
    });
    let root = wrapper.find('.app-section-header');
    expect(root.attributes('aria-expanded')).toBe('true');
    expect(root.attributes('data-open')).toBe('true');

    await wrapper.setProps({ open: false });
    root = wrapper.find('.app-section-header');
    expect(root.attributes('aria-expanded')).toBe('false');
    expect(root.attributes('data-open')).toBe('false');
  });

  it('emits toggle on click and on Enter / Space', async () => {
    const wrapper = mount(AppSectionHeader, { props: baseProps });
    await wrapper.find('.app-section-header').trigger('click');
    await wrapper.find('.app-section-header').trigger('keydown', { key: 'Enter' });
    await wrapper.find('.app-section-header').trigger('keydown', { key: ' ' });
    await wrapper.find('.app-section-header').trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('toggle')).toEqual([[], [], []]);
  });
});
