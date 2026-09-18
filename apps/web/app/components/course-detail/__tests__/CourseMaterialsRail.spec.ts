/**
 * Spec for CourseMaterialsRail's per-kind icon and byte-size formatting.
 * Both `kindIcon` and `fmtSize` used to disagree with what they rendered:
 * `image` showed a folder glyph, `slide` (and any future kind) showed a
 * cloud glyph, and the size suffix was a bare "B"/"KB"/"MB" string bypassing
 * `t()`.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CourseMaterialsRail from '../CourseMaterialsRail.vue';
import type { CourseMaterialItem } from '@app/api-client-ts';

vi.mock('@app/ui', () => ({
  IconCS: {
    name: 'IconCS',
    props: ['name', 'size'],
    template: '<svg class="stub-icon" :data-name="name" />',
  },
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${String(params.n)}` : key,
  }),
}));

function material(overrides: Partial<CourseMaterialItem> = {}): CourseMaterialItem {
  return {
    id: 'm-1',
    lessonId: 'l-1',
    sectionId: 's-1',
    sectionTitle: 'Section One',
    kind: 'doc',
    label: 'Slides.pdf',
    sizeBytes: 100,
    ...overrides,
  } as CourseMaterialItem;
}

const baseProps = {
  heading: 'Course materials',
  emptyLabel: 'No materials for this course.',
  downloadAriaLabel: 'Download material',
};

describe('CourseMaterialsRail — kindIcon', () => {
  it.each([
    ['doc', 'pdf'],
    ['note', 'note'],
    ['image', 'grid'],
    ['slide', 'circle-stack'],
  ] as const)('renders the %s icon for kind %s', (kind, icon) => {
    const wrapper = mount(CourseMaterialsRail, {
      props: { ...baseProps, materials: [material({ kind })] },
    });
    expect(wrapper.find('.stub-icon').attributes('data-name')).toBe(icon);
  });
});

describe('CourseMaterialsRail — fmtSize', () => {
  it.each([
    [500, 'pages.courseDetail.materialSizeBytes:500'],
    [2048, 'pages.courseDetail.materialSizeKb:2'],
    [5 * 1024 * 1024, 'pages.courseDetail.materialSizeMb:5'],
  ])('formats %i bytes through t()', (sizeBytes, expected) => {
    const wrapper = mount(CourseMaterialsRail, {
      props: { ...baseProps, materials: [material({ sizeBytes })] },
    });
    expect(wrapper.find('.course-materials-rail__item-size').text()).toBe(expected);
  });
});
