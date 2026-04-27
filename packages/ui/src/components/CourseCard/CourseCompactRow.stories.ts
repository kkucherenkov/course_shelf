import type { Meta, StoryObj } from '@storybook/vue3';

import CourseCompactRow from './CourseCompactRow.vue';
import type { Course } from './types';

const sampleCourse: Course = {
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: 'teal',
};

const meta: Meta<typeof CourseCompactRow> = {
  title: 'Domain/CourseCard/CourseCompactRow',
  component: CourseCompactRow,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: { type: 'select' },
      options: ['auto', 'not-started', 'in-progress', 'completed', 'locked'],
    },
  },
  args: {
    course: sampleCourse,
    state: 'auto',
    loading: false,
  },
  render: (args) => ({
    components: { CourseCompactRow },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 400px; padding: var(--space-2);"><CourseCompactRow v-bind="args" /></div>`,
  }),
};

export default meta;

type Story = StoryObj<typeof CourseCompactRow>;

export const Default: Story = {};

export const NotStarted: Story = {
  args: {
    course: { ...sampleCourse, completed: 0 },
    state: 'not-started',
  },
};

export const InProgress: Story = {
  args: {
    course: { ...sampleCourse, completed: 4, lessons: 12 },
    state: 'auto',
  },
};

export const Completed: Story = {
  args: {
    course: { ...sampleCourse, completed: 12, lessons: 12 },
    state: 'completed',
  },
};

export const Locked: Story = {
  args: {
    course: { ...sampleCourse },
    state: 'locked',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Variants: Story = {
  render: () => ({
    components: { CourseCompactRow },
    setup() {
      const accents = ['teal', 'amber', 'indigo', 'warm', 'coral', 'neutral'] as const;
      const courses: Course[] = accents.map((accent, i) => ({
        id: String(i),
        title: `${accent.charAt(0).toUpperCase() + accent.slice(1)} Course`,
        instructor: 'Instructor',
        lessons: 10,
        completed: i * 2,
        accent,
      }));
      return { courses };
    },
    template: `
      <div style="max-width: 400px; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-4);">
        <CourseCompactRow v-for="c in courses" :key="c.id" :course="c" />
      </div>
    `,
  }),
};

export const HoverFocus: Story = {
  render: () => ({
    components: { CourseCompactRow },
    setup() {
      return { course: sampleCourse };
    },
    template: `
      <div style="max-width: 400px; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-4);">
        <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-1);">Tab to rows for focus ring.</p>
        <CourseCompactRow :course="course" />
        <CourseCompactRow :course="{ ...course, id: '2', accent: 'amber', completed: 8 }" />
      </div>
    `,
  }),
};
