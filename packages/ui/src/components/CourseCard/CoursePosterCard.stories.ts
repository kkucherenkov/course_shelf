import type { Meta, StoryObj } from '@storybook/vue3';

import CoursePosterCard from './CoursePosterCard.vue';
import type { Course } from './types';

const sampleCourse: Course = {
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: 'teal',
};

const meta: Meta<typeof CoursePosterCard> = {
  title: 'Domain/CourseCard/CoursePosterCard',
  component: CoursePosterCard,
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
    components: { CoursePosterCard },
    setup() {
      return { args };
    },
    template: `<div style="width: 200px;"><CoursePosterCard v-bind="args" /></div>`,
  }),
};

export default meta;

type Story = StoryObj<typeof CoursePosterCard>;

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
    components: { CoursePosterCard },
    setup() {
      const accents = ['teal', 'amber', 'indigo', 'warm', 'coral', 'neutral'] as const;
      const courses: Course[] = accents.map((accent, i) => ({
        id: String(i),
        title: `${accent.charAt(0).toUpperCase() + accent.slice(1)} Course`,
        instructor: 'Instructor Name',
        lessons: 10,
        completed: i * 2,
        accent,
      }));
      return { courses };
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(6, 160px); gap: 16px; padding: 16px;">
        <CoursePosterCard v-for="c in courses" :key="c.id" :course="c" />
      </div>
    `,
  }),
};

export const HoverFocus: Story = {
  render: () => ({
    components: { CoursePosterCard },
    setup() {
      const course = sampleCourse;
      return { course };
    },
    template: `
      <div style="display: flex; gap: 16px; padding: 16px;">
        <div style="width: 180px;">
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Hover me</p>
          <CoursePosterCard :course="course" />
        </div>
        <div style="width: 180px;">
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Focus (Tab to reach)</p>
          <CoursePosterCard :course="course" />
        </div>
      </div>
    `,
  }),
};
