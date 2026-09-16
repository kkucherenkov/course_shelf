import { readFileSync } from 'node:fs';
import path from 'node:path';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, type Component } from 'vue';

import AppField from '../AppField/AppField.vue';

import AppInput from './AppInput.vue';

function renderInsideField(params: {
  label: string;
  required?: boolean;
  error?: string;
  modelValue?: string;
  type?: string;
}) {
  return mount(AppField, {
    props: {
      label: params.label,
      required: params.required ?? false,
      error: params.error,
    },
    slots: {
      default: (slotProps: Record<string, unknown>) =>
        h(AppInput as Component, {
          ...slotProps,
          modelValue: params.modelValue ?? '',
          type: params.type,
        }),
    },
  });
}

describe('AppInput', () => {
  it('renders a native <input> element', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '' } });
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('input.app-input').exists()).toBe(true);
  });

  it('reflects modelValue into the input value', () => {
    const wrapper = mount(AppInput, { props: { modelValue: 'hello' } });
    const input = wrapper.find('input').element as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppInput, { props: { modelValue: '' } });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = 'typed';
    await input.trigger('input');
    const events = wrapper.emitted('update:modelValue');
    expect(events).toBeTruthy();
    expect(events?.[0]).toEqual(['typed']);
  });

  it('defaults to type=text', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '' } });
    expect(wrapper.find('input').attributes('type')).toBe('text');
  });

  it('forwards type prop to the input', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '', type: 'email' } });
    expect(wrapper.find('input').attributes('type')).toBe('email');
  });

  it('forwards placeholder to the input', () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '', placeholder: 'Enter phone' },
    });
    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter phone');
  });

  it('defaults to size=md', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '' } });
    expect(wrapper.find('.app-input--md').exists()).toBe(true);
  });

  it.each(['sm', 'md', 'lg'] as const)('applies size modifier for size=%s', (size) => {
    const wrapper = mount(AppInput, { props: { modelValue: '', size } });
    expect(wrapper.find(`.app-input--${size}`).exists()).toBe(true);
  });

  it('sets disabled attribute and class', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '', disabled: true } });
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
    expect(wrapper.find('.app-input--disabled').exists()).toBe(true);
  });

  it('sets readonly attribute without disabling the control', () => {
    const wrapper = mount(AppInput, { props: { modelValue: 'ro', readonly: true } });
    const input = wrapper.find('input');
    expect(input.attributes('readonly')).toBeDefined();
    expect(input.attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.app-input--readonly').exists()).toBe(true);
  });

  it('forwards arbitrary aria-* and data-* attrs onto the input via $attrs', () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '' },
      attrs: {
        id: 'phone-field',
        'aria-describedby': 'phone-desc',
        'aria-invalid': 'true',
        'aria-required': 'true',
        'data-testid': 'phone-input',
      },
    });
    const input = wrapper.find('input');
    expect(input.attributes('id')).toBe('phone-field');
    expect(input.attributes('aria-describedby')).toBe('phone-desc');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-required')).toBe('true');
    expect(input.attributes('data-testid')).toBe('phone-input');
  });

  it('composes inside AppField: slot attrs reach the input', () => {
    const wrapper = renderInsideField({ label: 'Phone', required: true });
    const input = wrapper.find('input');
    expect(input.attributes('id')).toBeTruthy();
    expect(input.attributes('aria-required')).toBe('true');
    const labelFor = wrapper.find('label').attributes('for');
    expect(labelFor).toBe(input.attributes('id'));
  });

  it('composes inside AppField: error state sets aria-invalid + wires describedby', () => {
    const wrapper = renderInsideField({
      label: 'Phone',
      error: 'Invalid phone number',
    });
    const input = wrapper.find('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    const error = wrapper.find('.app-field__error');
    expect(error.exists()).toBe(true);
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'));
  });

  it('has a focus-visible class that resolves to the app-input block', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '' } });
    expect(wrapper.classes()).toContain('app-input');
  });

  // Regression guard for #622: `:global(sel)` followed by a descendant
  // combinator to a scoped class (`:global([data-density='compact']) .foo`)
  // compiles, but the Vue SFC compiler drops everything after `:global(...)`
  // from the emitted rule — verified by building the package and inspecting
  // dist/index.css, which showed a bare `[data-density=compact]{height:30px}`
  // landing on `<html>` instead of `.app-input--md`. Wrapping the *whole*
  // selector in `:global(...)` keeps the descendant.
  // ponytail: source-pattern guard, not a compiled-CSS check — pulling in
  // `@vue/compiler-sfc` (indirect via @vitejs/plugin-vue, not a direct
  // dependency here) to compile SCSS→CSS→scoped-CSS just for this one rule
  // isn't worth a new dependency. Re-verify with
  // `pnpm --filter @app/ui build && grep data-density dist/index.css` if
  // this selector ever moves again.
  it('keeps the compact-density selector fully inside :global(), not split by a combinator', () => {
    const source = readFileSync(path.join(import.meta.dirname, 'AppInput.vue'), 'utf8');
    const style = source.slice(source.indexOf('<style'), source.lastIndexOf('</style>'));
    // Strip `//` comments first — the rule's own doc comment describes the
    // broken pattern in prose, which would otherwise trip this guard too.
    const rules = style.replaceAll(/\/\/.*$/gm, '');
    expect(rules).toContain(":global([data-density='compact'] .app-input--md)");
    expect(rules).not.toMatch(/:global\([^)]*\)\s+\./);
  });
});
