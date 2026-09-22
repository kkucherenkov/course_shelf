import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppFlashcardEditor from './AppFlashcardEditor.vue';

const LABELS = {
  frontLabel: 'Front',
  backLabel: 'Back',
  saveLabel: 'Save',
  cancelLabel: 'Cancel',
};

describe('AppFlashcardEditor', () => {
  it('disables Save while front or back is empty', () => {
    const wrapper = mount(AppFlashcardEditor, { props: { ...LABELS, front: '', back: '' } });
    const save = wrapper.findAll('button').find((b) => b.text() === 'Save')!;
    expect(save.attributes('disabled')).toBeDefined();
  });

  it('enables Save once both fields have non-whitespace content', () => {
    const wrapper = mount(AppFlashcardEditor, {
      props: { ...LABELS, front: 'Q', back: 'A' },
    });
    const save = wrapper.findAll('button').find((b) => b.text() === 'Save')!;
    expect(save.attributes('disabled')).toBeUndefined();
  });

  it('emits update:front and update:back as the fields change', async () => {
    const wrapper = mount(AppFlashcardEditor, { props: { ...LABELS, front: '', back: '' } });
    await wrapper.find('input').setValue('What is an aggregate?');
    await wrapper.find('textarea').setValue('A cluster of objects.');
    expect(wrapper.emitted('update:front')).toEqual([['What is an aggregate?']]);
    expect(wrapper.emitted('update:back')).toEqual([['A cluster of objects.']]);
  });

  it('emits save with trimmed front/back on click', async () => {
    const wrapper = mount(AppFlashcardEditor, {
      props: { ...LABELS, front: '  Q  ', back: '  A  ' },
    });
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Save')!
      .trigger('click');
    expect(wrapper.emitted('save')).toEqual([[{ front: 'Q', back: 'A' }]]);
  });

  it('emits cancel on click', async () => {
    const wrapper = mount(AppFlashcardEditor, { props: { ...LABELS, front: 'Q', back: 'A' } });
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Cancel')!
      .trigger('click');
    expect(wrapper.emitted('cancel')).toEqual([[]]);
  });

  it('disables both fields and both buttons while submitting', () => {
    const wrapper = mount(AppFlashcardEditor, {
      props: { ...LABELS, front: 'Q', back: 'A', submitting: true },
    });
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true);
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).disabled).toBe(true);
    for (const button of wrapper.findAll('button')) {
      expect(button.attributes('disabled')).toBeDefined();
    }
  });

  it('does not emit save while submitting', async () => {
    const wrapper = mount(AppFlashcardEditor, {
      props: { ...LABELS, front: 'Q', back: 'A', submitting: true },
    });
    const save = wrapper.findAll('button').find((b) => b.text() === 'Save')!;
    await save.trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
  });
});
