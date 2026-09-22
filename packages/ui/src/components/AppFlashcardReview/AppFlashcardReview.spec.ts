import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppFlashcardReview from './AppFlashcardReview.vue';

const PROPS = {
  front: 'What is an aggregate?',
  back: 'A cluster of domain objects treated as a unit for data changes.',
};

describe('AppFlashcardReview', () => {
  it('shows only the front and a reveal button before revealed', () => {
    const wrapper = mount(AppFlashcardReview, { props: { ...PROPS, revealed: false } });
    expect(wrapper.find('.app-flashcard-review__front').text()).toBe(PROPS.front);
    expect(wrapper.find('.app-flashcard-review__back').exists()).toBe(false);
    expect(wrapper.find('.app-flashcard-review__reveal').exists()).toBe(true);
  });

  it('emits reveal when the reveal button is clicked', async () => {
    const wrapper = mount(AppFlashcardReview, { props: { ...PROPS, revealed: false } });
    await wrapper.find('.app-flashcard-review__reveal').trigger('click');
    expect(wrapper.emitted('reveal')).toEqual([[]]);
  });

  it('shows the back and four grade buttons once revealed', () => {
    const wrapper = mount(AppFlashcardReview, { props: { ...PROPS, revealed: true } });
    expect(wrapper.find('.app-flashcard-review__back').text()).toBe(PROPS.back);
    const buttons = wrapper.findAll('.app-flashcard-review__grade-btn');
    expect(buttons).toHaveLength(4);
  });

  it('emits grade with the 0/3/4/5 SM-2 mapping in Again/Hard/Good/Easy order', async () => {
    const wrapper = mount(AppFlashcardReview, { props: { ...PROPS, revealed: true } });
    const buttons = wrapper.findAll('.app-flashcard-review__grade-btn');
    for (const button of buttons) {
      await button.trigger('click');
    }
    expect(wrapper.emitted('grade')).toEqual([[0], [3], [4], [5]]);
  });

  it('disables the reveal button while grading', () => {
    const wrapper = mount(AppFlashcardReview, {
      props: { ...PROPS, revealed: false, grading: true },
    });
    expect(wrapper.find('.app-flashcard-review__reveal').attributes('disabled')).toBeDefined();
  });

  it('disables every grade button while grading', () => {
    const wrapper = mount(AppFlashcardReview, {
      props: { ...PROPS, revealed: true, grading: true },
    });
    const buttons = wrapper.findAll('.app-flashcard-review__grade-btn');
    for (const button of buttons) {
      expect(button.attributes('disabled')).toBeDefined();
    }
  });

  it('renders overridden labels', () => {
    const wrapper = mount(AppFlashcardReview, {
      props: { ...PROPS, revealed: true, gradeAgainLabel: 'Не вспомнил' },
    });
    expect(wrapper.text()).toContain('Не вспомнил');
  });
});
