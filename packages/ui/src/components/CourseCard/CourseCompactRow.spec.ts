import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { Course } from './types';
import CourseCompactRow from './CourseCompactRow.vue';
import { COVER } from './cover-map';

const base: Course = {
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: 'teal',
};

describe('CourseCompactRow', () => {
  // --- basic rendering ---

  it('renders the title', () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base } });
    expect(wrapper.find('.course-compact-row__title').text()).toBe('Advanced Vue Patterns');
  });

  it('renders pct label', () => {
    const wrapper = mount(CourseCompactRow, {
      props: { course: { ...base, completed: 4, lessons: 12 } },
    });
    expect(wrapper.find('.course-compact-row__pct').text()).toBe('33%');
  });

  // --- cover background ---

  it('uses COVER[accent] as thumb background when course.cover is undefined', () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base } });
    const thumb = wrapper.find('.course-compact-row__thumb');
    expect(thumb.attributes('style')).toContain(COVER['teal']);
  });

  it('uses course.cover override when set', () => {
    const withCover: Course = { ...base, cover: 'url(/custom.jpg)' };
    const wrapper = mount(CourseCompactRow, { props: { course: withCover } });
    const thumb = wrapper.find('.course-compact-row__thumb');
    expect(thumb.attributes('style')).toContain('url(');
  });

  // --- state derivation ---

  it('state=auto + completed===lessons → bar fill=100%', () => {
    const completed: Course = { ...base, completed: 12, lessons: 12 };
    const wrapper = mount(CourseCompactRow, { props: { course: completed } });
    expect(wrapper.find('.course-compact-row__bar-fill').attributes('style')).toContain(
      'width: 100%',
    );
    expect(wrapper.find('.course-compact-row__pct').text()).toBe('100%');
  });

  it('state=auto + partial → bar fill proportional', () => {
    const wrapper = mount(CourseCompactRow, {
      props: { course: { ...base, completed: 6, lessons: 12 } },
    });
    expect(wrapper.find('.course-compact-row__bar-fill').attributes('style')).toContain(
      'width: 50%',
    );
    expect(wrapper.find('.course-compact-row__pct').text()).toBe('50%');
  });

  it('state=auto + zero → bar fill=0%', () => {
    const wrapper = mount(CourseCompactRow, {
      props: { course: { ...base, completed: 0, lessons: 12 } },
    });
    expect(wrapper.find('.course-compact-row__bar-fill').attributes('style')).toContain(
      'width: 0%',
    );
    expect(wrapper.find('.course-compact-row__pct').text()).toBe('0%');
  });

  it('state=not-started → bar fill=0%', () => {
    const wrapper = mount(CourseCompactRow, {
      props: { course: base, state: 'not-started' },
    });
    expect(wrapper.find('.course-compact-row__bar-fill').attributes('style')).toContain(
      'width: 0%',
    );
  });

  it('state=locked → bar fill=0%', () => {
    const wrapper = mount(CourseCompactRow, {
      props: { course: base, state: 'locked' },
    });
    expect(wrapper.find('.course-compact-row__bar-fill').attributes('style')).toContain(
      'width: 0%',
    );
  });

  it('state=in-progress explicit → bar fill matches completed/lessons', () => {
    const wrapper = mount(CourseCompactRow, {
      props: { course: { ...base, completed: 3, lessons: 12 }, state: 'in-progress' },
    });
    expect(wrapper.find('.course-compact-row__bar-fill').attributes('style')).toContain(
      'width: 25%',
    );
  });

  // --- a11y ---

  it('has tabindex=0, role=button, aria-label=title on root', () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base } });
    const root = wrapper.find('.course-compact-row');
    expect(root.attributes('tabindex')).toBe('0');
    expect(root.attributes('role')).toBe('button');
    expect(root.attributes('aria-label')).toBe('Advanced Vue Patterns');
  });

  // --- click / keyboard emit ---

  it('emits click with course on mouse click', async () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base } });
    await wrapper.find('.course-compact-row').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    const emitted = wrapper.emitted<Course[]>('click');
    expect(emitted?.[0]?.[0]).toStrictEqual(base);
  });

  it('emits click on Enter keydown', async () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base } });
    await wrapper.find('.course-compact-row').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits click on Space keydown', async () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base } });
    await wrapper.find('.course-compact-row').trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click on other keys', async () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base } });
    await wrapper.find('.course-compact-row').trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  // --- loading state ---

  it('renders skeleton variant when loading=true', () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base, loading: true } });
    expect(wrapper.find('.course-compact-row--loading').exists()).toBe(true);
    expect(wrapper.find('.course-compact-row__title').exists()).toBe(false);
  });

  it('loading skeleton is not focusable', () => {
    const wrapper = mount(CourseCompactRow, { props: { course: base, loading: true } });
    const root = wrapper.find('.course-compact-row--loading');
    expect(root.attributes('tabindex')).toBeUndefined();
    expect(root.attributes('role')).toBeUndefined();
  });

  it('does not emit click when loading', async () => {
    const handler = vi.fn();
    const wrapper = mount(CourseCompactRow, {
      props: { course: base, loading: true },
      attrs: { onClick: handler },
    });
    await wrapper.trigger('click');
    expect(handler).not.toHaveBeenCalled();
  });
});
