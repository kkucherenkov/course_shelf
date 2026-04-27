import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppSearchField from './AppSearchField.vue';

function mountField(props: Record<string, unknown> = {}) {
  return mount(AppSearchField, {
    props: { modelValue: '', label: 'Search', ...props },
  });
}

describe('AppSearchField', () => {
  it('renders a search input', () => {
    const wrapper = mountField();
    expect(wrapper.find('input[type="search"]').exists()).toBe(true);
  });

  it('reflects modelValue', () => {
    const wrapper = mountField({ modelValue: 'vue' });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('vue');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mountField();
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = 'react';
    await input.trigger('input');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['react']);
  });

  it('shows the leading search icon', () => {
    const wrapper = mountField();
    expect(wrapper.find('.app-search-field__icon-leading').exists()).toBe(true);
  });

  it('does not render clear button when value is empty', () => {
    const wrapper = mountField({ modelValue: '' });
    expect(wrapper.find('[aria-label="Clear"]').exists()).toBe(false);
  });

  it('renders clear button when value is non-empty', () => {
    const wrapper = mountField({ modelValue: 'query' });
    expect(wrapper.find('[aria-label="Clear"]').exists()).toBe(true);
  });

  it('clear button emits empty string', async () => {
    const wrapper = mountField({ modelValue: 'query' });
    await wrapper.find('[aria-label="Clear"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
  });

  it('renders error text and sets aria-invalid on input', () => {
    const wrapper = mountField({ error: 'Invalid search' });
    expect(wrapper.find('.app-field__error').text()).toBe('Invalid search');
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
  });

  it('sets aria-required when required=true', () => {
    const wrapper = mountField({ required: true });
    expect(wrapper.find('input').attributes('aria-required')).toBe('true');
  });

  it('disables input when disabled=true', () => {
    const wrapper = mountField({ disabled: true });
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });

  it('uses a custom clearLabel', () => {
    const wrapper = mountField({ modelValue: 'q', clearLabel: 'Очистить' });
    expect(wrapper.find('[aria-label="Очистить"]').exists()).toBe(true);
  });

  it('wires label for to input id', () => {
    const wrapper = mountField();
    const inputId = wrapper.find('input').attributes('id');
    expect(wrapper.find('label').attributes('for')).toBe(inputId);
  });
});
