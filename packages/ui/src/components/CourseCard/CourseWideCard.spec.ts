import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { Course } from './types';
import CourseWideCard from './CourseWideCard.vue';
import { COVER, fmtTime } from './cover-map';

const base: Course = {
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: 'teal',
};

describe('CourseWideCard', () => {
  // --- basic rendering ---

  it('renders title and instructor', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    expect(wrapper.find('.course-wide-card__title').text()).toBe('Advanced Vue Patterns');
    expect(wrapper.find('.course-wide-card__instructor').text()).toBe('Jane Doe');
  });

  it('renders completed/lessons count', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    expect(wrapper.find('.course-wide-card__meta-count').text()).toBe('4/12');
  });

  // --- cover background ---

  it('uses COVER[accent] as background when course.cover is undefined', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    const thumb = wrapper.find('.course-wide-card__thumb');
    expect(thumb.attributes('style')).toContain(COVER['teal']);
  });

  it('uses course.cover override when set', () => {
    const withCover: Course = { ...base, cover: 'url(/custom.jpg)' };
    const wrapper = mount(CourseWideCard, { props: { course: withCover } });
    const thumb = wrapper.find('.course-wide-card__thumb');
    expect(thumb.attributes('style')).toContain('url(');
  });

  // --- resumeAt meta ---

  it('shows Resume <fmtTime> when resumeAt is set', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base, resumeAt: 125 } });
    const resume = wrapper.find('.course-wide-card__meta-resume');
    expect(resume.text()).toBe(`Resume ${fmtTime(125)}`);
  });

  it('shows pct% when resumeAt is not set', () => {
    const wrapper = mount(CourseWideCard, {
      props: { course: { ...base, completed: 4, lessons: 12 } },
    });
    const resume = wrapper.find('.course-wide-card__meta-resume');
    expect(resume.text()).toBe('33%');
  });

  it('play icon is present in meta row', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    const metaIcon = wrapper.find('.course-wide-card__meta-icon');
    expect(metaIcon.exists()).toBe(true);
    // IconCS renders as svg
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  // --- state derivation ---

  it('state=auto + completed===lessons → strip fill=100%', () => {
    const completed: Course = { ...base, completed: 12, lessons: 12 };
    const wrapper = mount(CourseWideCard, { props: { course: completed } });
    const fill = wrapper.find('.course-wide-card__strip-fill');
    expect(fill.attributes('style')).toContain('width: 100%');
  });

  it('state=auto + partial → strip fill proportional', () => {
    const wrapper = mount(CourseWideCard, {
      props: { course: { ...base, completed: 6, lessons: 12 } },
    });
    const fill = wrapper.find('.course-wide-card__strip-fill');
    expect(fill.attributes('style')).toContain('width: 50%');
  });

  it('state=auto + zero → strip fill=0%', () => {
    const wrapper = mount(CourseWideCard, {
      props: { course: { ...base, completed: 0, lessons: 12 } },
    });
    const fill = wrapper.find('.course-wide-card__strip-fill');
    expect(fill.attributes('style')).toContain('width: 0%');
  });

  it('state=locked → strip fill=0%', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base, state: 'locked' } });
    const fill = wrapper.find('.course-wide-card__strip-fill');
    expect(fill.attributes('style')).toContain('width: 0%');
  });

  // --- a11y ---

  it('has tabindex=0, role=button, aria-label=title on root', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    const root = wrapper.find('.course-wide-card');
    expect(root.attributes('tabindex')).toBe('0');
    expect(root.attributes('role')).toBe('button');
    expect(root.attributes('aria-label')).toBe('Advanced Vue Patterns');
  });

  // --- click / keyboard emit ---

  it('emits click with course on mouse click', async () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    await wrapper.find('.course-wide-card').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    const emitted = wrapper.emitted<Course[]>('click');
    expect(emitted?.[0]?.[0]).toStrictEqual(base);
  });

  it('emits click on Enter keydown', async () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    await wrapper.find('.course-wide-card').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits click on Space keydown', async () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    await wrapper.find('.course-wide-card').trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click on other keys', async () => {
    const wrapper = mount(CourseWideCard, { props: { course: base } });
    await wrapper.find('.course-wide-card').trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  // --- loading state ---

  it('renders skeleton variant when loading=true', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base, loading: true } });
    expect(wrapper.find('.course-wide-card--loading').exists()).toBe(true);
    expect(wrapper.find('.course-wide-card__title').exists()).toBe(false);
  });

  it('loading skeleton is not focusable', () => {
    const wrapper = mount(CourseWideCard, { props: { course: base, loading: true } });
    const root = wrapper.find('.course-wide-card--loading');
    expect(root.attributes('tabindex')).toBeUndefined();
    expect(root.attributes('role')).toBeUndefined();
  });

  it('does not emit click when loading', async () => {
    const handler = vi.fn();
    const wrapper = mount(CourseWideCard, {
      props: { course: base, loading: true },
      attrs: { onClick: handler },
    });
    await wrapper.trigger('click');
    expect(handler).not.toHaveBeenCalled();
  });
});
