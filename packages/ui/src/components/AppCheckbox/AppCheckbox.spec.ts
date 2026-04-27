import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppCheckbox from './AppCheckbox.vue';

describe('AppCheckbox', () => {
  it('renders a button with role="checkbox"', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } });
    expect(wrapper.find('[role="checkbox"]').exists()).toBe(true);
  });

  it('reflects modelValue=false as aria-checked="false"', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } });
    expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('false');
  });

  it('reflects modelValue=true as aria-checked="true"', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } });
    expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('true');
  });

  it('reflects indeterminate=true as aria-checked="mixed"', () => {
    const wrapper = mount(AppCheckbox, {
      props: { modelValue: false, indeterminate: true },
    });
    expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('mixed');
  });

  it('emits update:modelValue toggling the value on click', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } });
    await wrapper.find('[role="checkbox"]').trigger('click');
    const events = wrapper.emitted('update:modelValue');
    expect(events).toHaveLength(1);
    expect(events?.[0]?.[0]).toBe(true);
  });

  it('emits update:modelValue on Space keydown', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } });
    await wrapper.find('[role="checkbox"]').trigger('keydown', { key: ' ' });
    const events = wrapper.emitted('update:modelValue');
    expect(events).toHaveLength(1);
    expect(events?.[0]?.[0]).toBe(true);
  });

  it('emits update:modelValue on Enter keydown', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } });
    await wrapper.find('[role="checkbox"]').trigger('keydown', { key: 'Enter' });
    const events = wrapper.emitted('update:modelValue');
    expect(events).toHaveLength(1);
    expect(events?.[0]?.[0]).toBe(false);
  });

  it('does not emit when disabled on click', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, disabled: true } });
    await wrapper.find('[role="checkbox"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('does not emit when disabled on Space keydown', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, disabled: true } });
    await wrapper.find('[role="checkbox"]').trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('sets aria-disabled when disabled', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, disabled: true } });
    expect(wrapper.find('[role="checkbox"]').attributes('aria-disabled')).toBe('true');
  });

  it('sets aria-required when required', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, required: true } });
    expect(wrapper.find('[role="checkbox"]').attributes('aria-required')).toBe('true');
  });

  it('renders the label text', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, label: 'Accept terms' } });
    expect(wrapper.find('.app-checkbox__label').text()).toBe('Accept terms');
  });

  it('renders slotted label content', () => {
    const wrapper = mount(AppCheckbox, {
      props: { modelValue: false },
      slots: { default: '<span class="custom-label">Custom</span>' },
    });
    expect(wrapper.find('.custom-label').exists()).toBe(true);
  });

  it('applies --disabled modifier on the label wrapper', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, disabled: true } });
    expect(wrapper.find('.app-checkbox--disabled').exists()).toBe(true);
  });

  it('applies --checked modifier when checked', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } });
    expect(wrapper.find('.app-checkbox__box--checked').exists()).toBe(true);
  });

  it('applies --indeterminate modifier when indeterminate', () => {
    const wrapper = mount(AppCheckbox, {
      props: { modelValue: false, indeterminate: true },
    });
    expect(wrapper.find('.app-checkbox__box--indeterminate').exists()).toBe(true);
    expect(wrapper.find('.app-checkbox__box--checked').exists()).toBe(false);
  });

  it('forwards aria-* attrs from $attrs onto the button via v-bind="$attrs"', () => {
    const wrapper = mount(AppCheckbox, {
      props: { modelValue: false },
      attrs: {
        id: 'cb-1',
        'aria-describedby': 'cb-1-desc',
        'aria-invalid': 'true',
      },
    });
    const btn = wrapper.find('[role="checkbox"]');
    expect(btn.attributes('id')).toBe('cb-1');
    expect(btn.attributes('aria-describedby')).toBe('cb-1-desc');
    expect(btn.attributes('aria-invalid')).toBe('true');
  });

  it('renders checkmark SVG when modelValue=true and not indeterminate', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: true } });
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('renders dash SVG when indeterminate', () => {
    const wrapper = mount(AppCheckbox, {
      props: { modelValue: false, indeterminate: true },
    });
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('renders no SVG when unchecked and not indeterminate', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false } });
    expect(wrapper.find('svg').exists()).toBe(false);
  });
});
