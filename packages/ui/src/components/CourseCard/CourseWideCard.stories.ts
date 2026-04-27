import type { Meta, StoryObj } from '@storybook/vue3';

import CourseWideCard from './CourseWideCard.vue';
import type { Course } from './types';

const sampleCourse: Course = {
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: 'teal',
};

const meta: Meta<typeof CourseWideCard> = {
  title: 'Domain/CourseCard/CourseWideCard',
  component: CourseWideCard,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: { type: 'select' },
      options: ['auto', 'not-started', 'in-progress', 'completed', 'locked'],
    },
    resumeAt: { control: { type: 'number' } },
  },
  args: {
    course: sampleCourse,
    state: 'auto',
    loading: false,
  },
  render: (args) => ({
    components: { CourseWideCard },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 480px;"><CourseWideCard v-bind="args" /></div>`,
  }),
};

export default meta;

type Story = StoryObj<typeof CourseWideCard>;

export const Default: Story = {
  args: { resumeAt: 125 },
};

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

export const WithResumeAt: Story = {
  args: {
    course: { ...sampleCourse, completed: 5 },
    resumeAt: 4370,
  },
};

export const Variants: Story = {
  render: () => ({
    components: { CourseWideCard },
    setup() {
      const accents = ['teal', 'amber', 'indigo', 'warm', 'coral', 'neutral'] as const;
      const courses: Course[] = accents.map((accent, i) => ({
        id: String(i),
        title: `${accent.charAt(0).toUpperCase() + accent.slice(1)} Course Example`,
        instructor: 'Instructor Name',
        lessons: 10,
        completed: i * 2,
        accent,
      }));
      return { courses };
    },
    template: `
      <div style="max-width: 480px; display: flex; flex-direction: column; gap: 8px; padding: 16px;">
        <CourseWideCard v-for="c in courses" :key="c.id" :course="c" :resume-at="c.completed * 60" />
      </div>
    `,
  }),
};

export const HoverFocus: Story = {
  render: () => ({
    components: { CourseWideCard },
    setup() {
      return { course: sampleCourse };
    },
    template: `
      <div style="max-width: 480px; display: flex; flex-direction: column; gap: 8px; padding: 16px;">
        <p style="font-size: 12px; color: var(--text-secondary);">Hover or Tab to these cards to see focus/hover state.</p>
        <CourseWideCard :course="course" :resume-at="125" />
        <CourseWideCard :course="course" />
      </div>
    `,
  }),
};
