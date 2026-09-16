/**
 * Spec for CourseDescription — the full-text section below the hero fold.
 * No markdown renderer/sanitiser (see PR): newlines are the only structure
 * preserved, laid out via `white-space: pre-line` in the scoped style. This
 * spec only asserts the newlines survive interpolation unmangled — the CSS
 * rule itself is what turns them into visible line breaks.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CourseDescription from '../CourseDescription.vue';

// Real @app/ui pulls in the whole barrel (every component, including ones
// that wrap Nuxt UI primitives needing a live Nuxt build context to
// resolve) — same reason every other apps/web component spec that touches
// AppButton mocks this module instead of importing it for real.
vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['variant', 'size'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

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

  it('does not show a "show more" toggle when the paragraph fits within the clamp', () => {
    // jsdom/happy-dom report scrollHeight === clientHeight === 0 by default —
    // no overflow to detect, so no toggle either.
    const wrapper = mount(CourseDescription, {
      props: { heading: 'About this course', description: 'Short text.' },
    });
    expect(wrapper.find('.course-description__toggle').exists()).toBe(false);
  });

  it('shows a toggle once the paragraph overflows the clamp, and expands on click', async () => {
    const wrapper = mount(CourseDescription, {
      props: { heading: 'About this course', description: 'Short text.' },
    });
    // jsdom/happy-dom never actually lay out the clamp box, so scrollHeight
    // and clientHeight are always 0 — stub the overflow directly on the
    // instance, then re-trigger the description watcher's re-check.
    const el = wrapper.find('.course-description__body').element;
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 300 });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: 100 });
    await wrapper.setProps({ description: 'A long description.' });

    const toggle = wrapper.find('.course-description__toggle');
    expect(toggle.exists()).toBe(true);
    expect(wrapper.find('.course-description__body--clamped').exists()).toBe(true);

    await toggle.trigger('click');

    expect(wrapper.find('.course-description__body--clamped').exists()).toBe(false);
    expect(wrapper.find('.course-description__toggle').exists()).toBe(true); // still there — now a "show less"
  });
});
