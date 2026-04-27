import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppNumberField from './AppNumberField.vue';

function mountField(props: Record<string, unknown> = {}) {
  return mount(AppNumberField, {
    props: { modelValue: 5, label: 'Quantity', ...props },
  });
}

describe('AppNumberField', () => {
  it('renders a number input', () => {
    const wrapper = mountField();
    expect(wrapper.find('input[type="number"]').exists()).toBe(true);
  });

  it('reflects modelValue in the input', () => {
    const wrapper = mountField({ modelValue: 42 });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('42');
  });

  it('shows empty string for null modelValue', () => {
    const wrapper = mountField({ modelValue: null });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  it('renders a decrement stepper button', () => {
    const wrapper = mountField();
    expect(wrapper.find('[aria-label="Decrement"]').exists()).toBe(true);
  });

  it('renders an increment stepper button', () => {
    const wrapper = mountField();
    expect(wrapper.find('[aria-label="Increment"]').exists()).toBe(true);
  });

  it('increment button emits modelValue + step', async () => {
    const wrapper = mountField({ modelValue: 5, step: 2 });
    await wrapper.find('[aria-label="Increment"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([7]);
  });

  it('decrement button emits modelValue - step', async () => {
    const wrapper = mountField({ modelValue: 5, step: 2 });
    await wrapper.find('[aria-label="Decrement"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3]);
  });

  it('clamps increment to max', async () => {
    const wrapper = mountField({ modelValue: 9, max: 10 });
    await wrapper.find('[aria-label="Increment"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([10]);
  });

  it('clamps decrement to min', async () => {
    const wrapper = mountField({ modelValue: 1, min: 0 });
    await wrapper.find('[aria-label="Decrement"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0]);
  });

  it('disables increment at max', () => {
    const wrapper = mountField({ modelValue: 10, max: 10 });
    const btn = wrapper.find('[aria-label="Increment"]').element as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('disables decrement at min', () => {
    const wrapper = mountField({ modelValue: 0, min: 0 });
    const btn = wrapper.find('[aria-label="Decrement"]').element as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('does not emit from steppers when disabled', async () => {
    const wrapper = mountField({ modelValue: 5, disabled: true });
    await wrapper.find('[aria-label="Increment"]').trigger('click');
    await wrapper.find('[aria-label="Decrement"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('renders error text and sets aria-invalid on input', () => {
    const wrapper = mountField({ error: 'Must be > 0' });
    expect(wrapper.find('.app-field__error').text()).toBe('Must be > 0');
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
  });

  it('sets aria-required when required', () => {
    const wrapper = mountField({ required: true });
    expect(wrapper.find('input').attributes('aria-required')).toBe('true');
  });
});
