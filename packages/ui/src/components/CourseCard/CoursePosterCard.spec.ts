import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { Course } from './types';
import CoursePosterCard from './CoursePosterCard.vue';
import { COVER } from './cover-map';

const base: Course = {
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: 'teal',
};

describe('CoursePosterCard', () => {
  // --- basic rendering ---

  it('renders title and instructor', () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base } });
    expect(wrapper.find('.course-poster-card__title').text()).toBe('Advanced Vue Patterns');
    expect(wrapper.find('.course-poster-card__instructor').text()).toBe('Jane Doe');
  });

  // --- cover background ---

  it('uses COVER[accent] as background when course.cover is undefined', () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base } });
    const cover = wrapper.find('.course-poster-card__cover');
    expect(cover.attributes('style')).toContain(COVER['teal']);
  });

  it('uses course.cover override when set', () => {
    const withCover: Course = { ...base, cover: 'url(/custom.jpg)' };
    const wrapper = mount(CoursePosterCard, { props: { course: withCover } });
    const cover = wrapper.find('.course-poster-card__cover');
    expect(cover.attributes('style')).toContain('url(');
  });

  // --- state auto derivation ---

  it('state=auto + completed===lessons → shows completed badge', () => {
    const completed: Course = { ...base, completed: 12, lessons: 12 };
    const wrapper = mount(CoursePosterCard, { props: { course: completed } });
    expect(wrapper.find('.course-poster-card__badge--completed').exists()).toBe(true);
    expect(wrapper.find('.course-poster-card__scrim').exists()).toBe(false);
  });

  it('state=auto + partial progress → shows progress strip', () => {
    const inProgress: Course = { ...base, completed: 4, lessons: 12 };
    const wrapper = mount(CoursePosterCard, { props: { course: inProgress } });
    expect(wrapper.find('.course-poster-card__strip').exists()).toBe(true);
    expect(wrapper.find('.course-poster-card__badge--completed').exists()).toBe(false);
  });

  it('state=auto + zero progress → shows strip with 0% fill', () => {
    const notStarted: Course = { ...base, completed: 0, lessons: 12 };
    const wrapper = mount(CoursePosterCard, { props: { course: notStarted } });
    const fill = wrapper.find('.course-poster-card__strip-fill');
    expect(fill.exists()).toBe(true);
    expect(fill.attributes('style')).toContain('width: 0%');
  });

  it('state=completed → shows completed badge', () => {
    const wrapper = mount(CoursePosterCard, {
      props: { course: base, state: 'completed' },
    });
    expect(wrapper.find('.course-poster-card__badge--completed').exists()).toBe(true);
  });

  it('state=locked → shows scrim with lock icon', () => {
    const wrapper = mount(CoursePosterCard, {
      props: { course: base, state: 'locked' },
    });
    expect(wrapper.find('.course-poster-card__scrim').exists()).toBe(true);
    expect(wrapper.find('.course-poster-card__badge--completed').exists()).toBe(false);
    expect(wrapper.find('.course-poster-card__strip').exists()).toBe(false);
  });

  it('state=not-started → shows strip with 0% fill', () => {
    const wrapper = mount(CoursePosterCard, {
      props: { course: base, state: 'not-started' },
    });
    const fill = wrapper.find('.course-poster-card__strip-fill');
    expect(fill.attributes('style')).toContain('width: 0%');
  });

  // --- a11y ---

  it('has tabindex=0, role=button, aria-label=title on root', () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base } });
    const root = wrapper.find('.course-poster-card');
    expect(root.attributes('tabindex')).toBe('0');
    expect(root.attributes('role')).toBe('button');
    expect(root.attributes('aria-label')).toBe('Advanced Vue Patterns');
  });

  // --- click / keyboard emit ---

  it('emits click with course on mouse click', async () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base } });
    await wrapper.find('.course-poster-card').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    const emitted = wrapper.emitted<Course[]>('click');
    expect(emitted?.[0]?.[0]).toStrictEqual(base);
  });

  it('emits click with course on Enter keydown', async () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base } });
    await wrapper.find('.course-poster-card').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits click with course on Space keydown', async () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base } });
    await wrapper.find('.course-poster-card').trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click on other keys', async () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base } });
    await wrapper.find('.course-poster-card').trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  // --- loading state ---

  it('renders skeleton variant when loading=true', () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base, loading: true } });
    expect(wrapper.find('.course-poster-card--loading').exists()).toBe(true);
    expect(wrapper.find('.course-poster-card__title').exists()).toBe(false);
  });

  it('loading skeleton is not focusable (no tabindex, no role=button)', () => {
    const wrapper = mount(CoursePosterCard, { props: { course: base, loading: true } });
    const root = wrapper.find('.course-poster-card--loading');
    expect(root.attributes('tabindex')).toBeUndefined();
    expect(root.attributes('role')).toBeUndefined();
  });

  it('does not emit click when loading', async () => {
    const handler = vi.fn();
    const wrapper = mount(CoursePosterCard, {
      props: { course: base, loading: true },
      attrs: { onClick: handler },
    });
    await wrapper.trigger('click');
    expect(handler).not.toHaveBeenCalled();
  });
});
