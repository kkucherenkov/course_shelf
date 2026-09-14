/**
 * Spec for CourseDescription — the full-text section below the hero fold.
 * No markdown renderer/sanitiser (see PR): newlines are the only structure
 * preserved, laid out via `white-space: pre-line` in the scoped style. This
 * spec only asserts the newlines survive interpolation unmangled — the CSS
 * rule itself is what turns them into visible line breaks.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CourseDescription from '../CourseDescription.vue';

describe('CourseDescription', () => {
  it('renders the heading and description text', () => {
    const wrapper = mount(CourseDescription, {
      props: { heading: 'About this course', description: 'A single line.' },
    });
    expect(wrapper.find('.course-description__heading').text()).toBe('About this course');
    expect(wrapper.find('.course-description__body').text()).toBe('A single line.');
  });

  it('preserves every newline from a multi-line description — no collapsing into one block', () => {
    const description = [
      'Intro paragraph.',
      'Чему вы научитесь',
      '- Bullet one',
      '- Bullet two',
      '- Bullet three',
    ].join('\n');

    const wrapper = mount(CourseDescription, {
      props: { heading: 'About this course', description },
    });

    expect(wrapper.find('.course-description__body').element.textContent).toBe(description);
  });
});
