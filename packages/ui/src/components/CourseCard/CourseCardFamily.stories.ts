import type { Meta, StoryObj } from '@storybook/vue3';

import CoursePosterCard from './CoursePosterCard.vue';
import CourseWideCard from './CourseWideCard.vue';
import CourseCompactRow from './CourseCompactRow.vue';
import type { Course } from './types';

const familyCourse: Course = {
  id: 'family-1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: 'teal',
};

const meta: Meta = {
  title: 'Domain/CourseCard/Family',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Family: Story = {
  render: () => ({
    components: { CoursePosterCard, CourseWideCard, CourseCompactRow },
    setup() {
      return { course: familyCourse };
    },
    template: `
      <div style="padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-6); max-width: 600px;">
        <div>
          <p style="font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 var(--space-3);">CoursePosterCard — 3:4 cover</p>
          <div style="width: 180px;">
            <CoursePosterCard :course="course" />
          </div>
        </div>

        <div>
          <p style="font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 var(--space-3);">CourseWideCard — square thumb + body</p>
          <CourseWideCard :course="course" :resume-at="125" />
        </div>

        <div>
          <p style="font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 var(--space-3);">CourseCompactRow — single-line list row</p>
          <CourseCompactRow :course="course" />
        </div>
      </div>
    `,
  }),
};

export const FamilyAllAccents: Story = {
  render: () => ({
    components: { CoursePosterCard, CourseWideCard, CourseCompactRow },
    setup() {
      const accents = ['teal', 'amber', 'indigo', 'warm', 'coral', 'neutral'] as const;
      const courses: Course[] = accents.map((accent, i) => ({
        id: String(i),
        title: `${accent.charAt(0).toUpperCase() + accent.slice(1)} Course`,
        instructor: 'Instructor Name',
        lessons: 12,
        completed: i * 2,
        accent,
      }));
      return { courses };
    },
    template: `
      <div style="padding: var(--space-5);">
        <p style="font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 var(--space-4);">All 6 accents — Poster</p>
        <div style="display: grid; grid-template-columns: repeat(6, 140px); gap: var(--space-3); margin-bottom: var(--space-6);">
          <CoursePosterCard v-for="c in courses" :key="c.id + '-poster'" :course="c" />
        </div>

        <p style="font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 var(--space-4);">All 6 accents — Wide</p>
        <div style="max-width: 480px; display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-6);">
          <CourseWideCard v-for="c in courses" :key="c.id + '-wide'" :course="c" />
        </div>

        <p style="font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 var(--space-4);">All 6 accents — Compact</p>
        <div style="max-width: 400px; display: flex; flex-direction: column; gap: var(--space-1);">
          <CourseCompactRow v-for="c in courses" :key="c.id + '-compact'" :course="c" />
        </div>
      </div>
    `,
  }),
};
