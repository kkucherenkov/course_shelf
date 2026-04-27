import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppTextField from './AppTextField.vue';

describe('AppTextField', () => {
  it('renders a text input', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Username' },
    });
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('defaults to type=text', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Email' },
    });
    expect(wrapper.find('input').attributes('type')).toBe('text');
  });

  it('forwards type prop', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Email', type: 'email' },
    });
    expect(wrapper.find('input').attributes('type')).toBe('email');
  });

  it('reflects modelValue', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: 'hello', label: 'Name' },
    });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('hello');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name' },
    });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = 'typed';
    await input.trigger('input');
    const events = wrapper.emitted('update:modelValue');
    expect(events).toBeTruthy();
    expect(events?.[0]).toEqual(['typed']);
  });

  it('renders label text', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Full name' },
    });
    expect(wrapper.find('label').text()).toContain('Full name');
  });

  it('renders help text', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name', help: 'Enter full name' },
    });
    expect(wrapper.find('.app-field__help').text()).toBe('Enter full name');
  });

  it('renders error text and sets aria-invalid on input', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name', error: 'Required field' },
    });
    expect(wrapper.find('.app-field__error').text()).toBe('Required field');
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
  });

  it('wires aria-describedby from error id to input', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name', error: 'Oops' },
    });
    const input = wrapper.find('input');
    const error = wrapper.find('.app-field__error');
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'));
  });

  it('sets aria-required on input when required=true', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name', required: true },
    });
    expect(wrapper.find('input').attributes('aria-required')).toBe('true');
  });

  it('disables the input when disabled=true', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name', disabled: true },
    });
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });

  it('wires the label for attribute to the input id', () => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name' },
    });
    const inputId = wrapper.find('input').attributes('id');
    expect(wrapper.find('label').attributes('for')).toBe(inputId);
  });

  it.each(['sm', 'md', 'lg'] as const)('passes size to AppInput for size=%s', (size) => {
    const wrapper = mount(AppTextField, {
      props: { modelValue: '', label: 'Name', size },
    });
    expect(wrapper.find(`.app-input--${size}`).exists()).toBe(true);
  });
});
