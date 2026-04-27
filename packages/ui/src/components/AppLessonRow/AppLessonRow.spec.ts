import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppLessonRow from './AppLessonRow.vue';

const baseProps = {
  num: 1,
  title: 'Intro to TypeScript generics',
  duration: 425, // 7:05
};

describe('AppLessonRow', () => {
  it('renders the padded lesson number, title and mono duration', () => {
    const wrapper = mount(AppLessonRow, { props: baseProps });
    expect(wrapper.find('.app-lesson-row__num').text()).toBe('01');
    expect(wrapper.find('.app-lesson-row__title').text()).toBe('Intro to TypeScript generics');
    expect(wrapper.find('.app-lesson-row__duration').text()).toBe('7:05');
  });

  it('formats hour-long durations as H:MM:SS', () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, duration: 3725 },
    });
    expect(wrapper.find('.app-lesson-row__duration').text()).toBe('1:02:05');
  });

  it('uses the circle icon and not-started state by default', () => {
    const wrapper = mount(AppLessonRow, { props: baseProps });
    const root = wrapper.find('.app-lesson-row');
    expect(root.attributes('data-state')).toBe('not-started');
    expect(root.attributes('data-current')).toBe('false');
  });

  it('shows the check-circle icon and success colour when completed', () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, state: 'completed' },
    });
    expect(wrapper.find('.app-lesson-row').attributes('data-state')).toBe('completed');
    expect(wrapper.find('.app-lesson-row__icon').attributes('data-state')).toBe('completed');
  });

  it('shows the lock icon when locked and disables activation', async () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, state: 'locked' },
    });
    const root = wrapper.find('.app-lesson-row');
    expect(root.attributes('data-state')).toBe('locked');
    expect(root.attributes('aria-disabled')).toBe('true');
    expect(root.attributes('tabindex')).toBe('-1');
    await root.trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('renders the underline progress bar and "<n>% watched" meta when in-progress', () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, state: 'in-progress', progress: 42 },
    });
    expect(wrapper.find('.app-lesson-row__progress').exists()).toBe(true);
    const fill = wrapper.find('.app-lesson-row__progress-fill');
    expect((fill.element as HTMLElement).style.width).toBe('42%');
    expect(wrapper.find('.app-lesson-row__meta').text()).toBe('42% watched');
  });

  it('omits the progress bar when in-progress with progress=0 but still shows meta', () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, state: 'in-progress', progress: 0 },
    });
    expect(wrapper.find('.app-lesson-row__progress').exists()).toBe(false);
    expect(wrapper.find('.app-lesson-row__meta').text()).toBe('0% watched');
  });

  it('clamps progress to 0..100', () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, state: 'in-progress', progress: 250 },
    });
    expect(
      (wrapper.find('.app-lesson-row__progress-fill').element as HTMLElement).style.width,
    ).toBe('100%');
    expect(wrapper.find('.app-lesson-row__meta').text()).toBe('100% watched');
  });

  it('flips the leading icon to play and applies the current modifier when current=true', () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, current: true },
    });
    const root = wrapper.find('.app-lesson-row');
    expect(root.classes()).toContain('app-lesson-row--current');
    expect(root.attributes('aria-current')).toBe('true');
    expect(wrapper.find('.app-lesson-row__icon').attributes('data-state')).toBe('current');
  });

  it('renders a PDF icon when materials=true and omits it otherwise', () => {
    const without = mount(AppLessonRow, { props: baseProps });
    expect(without.find('.app-lesson-row__materials').exists()).toBe(false);

    const withMaterials = mount(AppLessonRow, {
      props: { ...baseProps, materials: true },
    });
    expect(withMaterials.find('.app-lesson-row__materials').exists()).toBe(true);
  });

  it('emits select on click and on Enter / Space keydown', async () => {
    const wrapper = mount(AppLessonRow, { props: baseProps });
    await wrapper.find('.app-lesson-row').trigger('click');
    await wrapper.find('.app-lesson-row').trigger('keydown', { key: 'Enter' });
    await wrapper.find('.app-lesson-row').trigger('keydown', { key: ' ' });
    await wrapper.find('.app-lesson-row').trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('select')).toEqual([[], [], []]);
  });

  it('renders the skeleton variant when loading=true', () => {
    const wrapper = mount(AppLessonRow, {
      props: { ...baseProps, loading: true },
    });
    const root = wrapper.find('.app-lesson-row');
    expect(root.classes()).toContain('app-lesson-row--loading');
    expect(root.attributes('aria-busy')).toBe('true');
    expect(wrapper.findAll('.app-skeleton').length).toBeGreaterThanOrEqual(4);
    expect(wrapper.find('.app-lesson-row__title').exists()).toBe(false);
  });
});
