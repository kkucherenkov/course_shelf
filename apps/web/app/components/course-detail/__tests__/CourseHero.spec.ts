/**
 * Spec for CourseHero's description handling — a real scraped description
 * can run well past CourseDto.description's wire cap (8000 chars; see
 * openapi.yaml). The hero must never render that whole blob.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CourseHero from '../CourseHero.vue';
import { DESCRIPTION_LEAD_MAX_CHARS } from '~/utils/description-lead';
import { COVER } from '@app/ui';
import type { CourseOutlineSummary } from '@app/api-client-ts';

vi.mock('@app/ui', () => ({
  AppProgressLinear: {
    name: 'AppProgressLinear',
    props: ['value', 'thin', 'label'],
    template: '<div />',
  },
  COVER: {
    teal: '#0f766e',
    amber: '#b45309',
    indigo: '#4338ca',
    warm: '#c2410c',
    coral: '#be123c',
    neutral: '#404040',
  },
}));

function makeCourse(overrides: Partial<CourseOutlineSummary> = {}): CourseOutlineSummary {
  return {
    id: 'course-1',
    title: 'Course One',
    lessonsTotal: 10,
    totalDurationSeconds: 0,
    progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 10 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

const baseProps = {
  accent: 'teal' as const,
  resumeLabel: 'Start',
  instructorLabel: 'By',
  lessonsLabel: '10 lessons',
  progressLabel: 'Progress',
};

describe('CourseHero — description', () => {
  it('renders a short single-line description as-is', () => {
    const wrapper = mount(CourseHero, {
      props: { course: makeCourse({ description: 'A concise summary.' }), ...baseProps },
    });
    expect(wrapper.find('.course-hero__description').text()).toBe('A concise summary.');
  });

  it('stays readable with a 4000+ character description — shows the capped lead only', () => {
    const huge = `Intro paragraph.\nЧему вы научитесь\n${'- bullet\n'.repeat(500)}`;
    expect(huge.length).toBeGreaterThan(4000);

    const wrapper = mount(CourseHero, {
      props: { course: makeCourse({ description: huge }), ...baseProps },
    });

    const rendered = wrapper.find('.course-hero__description').text();
    expect(rendered).toBe('Intro paragraph.');
    expect(rendered.length).toBeLessThanOrEqual(DESCRIPTION_LEAD_MAX_CHARS + 1);
  });

  it('hides the description paragraph when there is none', () => {
    const wrapper = mount(CourseHero, { props: { course: makeCourse(), ...baseProps } });
    expect(wrapper.find('.course-hero__description').exists()).toBe(false);
  });
});

// Regression: the hero rendered the flat accent block even when the course
// had a downloaded poster — CourseOutlineSummary now carries `posterUrl`
// (previously only CourseDto did), and the cover must prefer it.
describe('CourseHero — cover', () => {
  it('uses the poster image as the cover background when posterUrl is set', () => {
    const wrapper = mount(CourseHero, {
      props: {
        course: makeCourse({ posterUrl: '/api/v1/courses/course-1/poster?token=abc' }),
        ...baseProps,
      },
    });

    const style = wrapper.find('.course-hero__cover-inner').attributes('style');
    expect(style).toContain('/api/v1/courses/course-1/poster?token=abc');
  });

  it('falls back to the accent block when the course has no poster', () => {
    const wrapper = mount(CourseHero, {
      props: { course: makeCourse({ posterUrl: null }), ...baseProps },
    });

    const style = wrapper.find('.course-hero__cover-inner').attributes('style');
    expect(style).toContain(COVER.teal);
  });
});
