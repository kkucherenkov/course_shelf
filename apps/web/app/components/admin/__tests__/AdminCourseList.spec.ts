/**
 * Spec for AdminCourseList component (#510).
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminCourseList, { type AdminCourseListItem } from '../AdminCourseList.vue';

const stubs = { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } };

const baseProps = {
  items: [] as AdminCourseListItem[],
  loading: false,
  emptyLabel: 'No courses yet.',
};

const sampleItems: AdminCourseListItem[] = [
  { id: 'course-1', title: 'Pragmatic Clean Architecture', lessonsLabel: '24 lessons' },
  { id: 'course-2', title: 'Domain-Driven Design', lessonsLabel: '18 lessons' },
];

describe('AdminCourseList', () => {
  it('renders skeleton when loading=true', () => {
    const wrapper = mount(AdminCourseList, {
      props: { ...baseProps, loading: true },
      global: { stubs },
    });
    expect(wrapper.find('.adm-course-list__skeleton-wrap').exists()).toBe(true);
    expect(wrapper.find('.adm-course-list').exists()).toBe(false);
  });

  it('renders the empty label when there are no items', () => {
    const wrapper = mount(AdminCourseList, { props: baseProps, global: { stubs } });
    expect(wrapper.find('.adm-course-list__empty').exists()).toBe(true);
    expect(wrapper.text()).toContain('No courses yet.');
  });

  it('renders a row per item, linking to /courses/:id', () => {
    const wrapper = mount(AdminCourseList, {
      props: { ...baseProps, items: sampleItems },
      global: { stubs },
    });
    const rows = wrapper.findAll('.adm-course-list__item');
    expect(rows).toHaveLength(2);
    const links = wrapper.findAll('a');
    expect(links[0]?.attributes('href')).toBe('/courses/course-1');
    expect(links[1]?.attributes('href')).toBe('/courses/course-2');
  });

  it('shows title and lessons label per row', () => {
    const wrapper = mount(AdminCourseList, {
      props: { ...baseProps, items: sampleItems },
      global: { stubs },
    });
    expect(wrapper.text()).toContain('Pragmatic Clean Architecture');
    expect(wrapper.text()).toContain('24 lessons');
  });

  it('matches snapshot (with items)', () => {
    const wrapper = mount(AdminCourseList, {
      props: { ...baseProps, items: sampleItems },
      global: { stubs },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
