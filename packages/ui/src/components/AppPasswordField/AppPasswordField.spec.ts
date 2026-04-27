import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppPasswordField from './AppPasswordField.vue';

describe('AppPasswordField', () => {
  it('renders type=password by default with the given modelValue', () => {
    const wrapper = mount(AppPasswordField, { props: { modelValue: 'secret123' } });
    const input = wrapper.find('input');
    expect(input.attributes('type')).toBe('password');
    expect((input.element as HTMLInputElement).value).toBe('secret123');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppPasswordField, { props: { modelValue: '' } });
    const input = wrapper.find('input');
    await input.setValue('hello');
    expect(wrapper.emitted('update:modelValue')).toEqual([['hello']]);
  });

  it('toggles input type on visibility button click', async () => {
    const wrapper = mount(AppPasswordField, { props: { modelValue: 'secret' } });
    const input = wrapper.find('input');
    expect(input.attributes('type')).toBe('password');
    await wrapper.find('.app-password-field__toggle').trigger('click');
    expect(wrapper.find('input').attributes('type')).toBe('text');
    await wrapper.find('.app-password-field__toggle').trigger('click');
    expect(wrapper.find('input').attributes('type')).toBe('password');
  });

  it('updates aria-label on the visibility button when toggled', async () => {
    const wrapper = mount(AppPasswordField, { props: { modelValue: 'x' } });
    const toggle = wrapper.find('.app-password-field__toggle');
    expect(toggle.attributes('aria-label')).toBe('Show password');
    expect(toggle.attributes('aria-pressed')).toBe('false');
    await toggle.trigger('click');
    expect(toggle.attributes('aria-label')).toBe('Hide password');
    expect(toggle.attributes('aria-pressed')).toBe('true');
  });

  it('blocks toggle when disabled', async () => {
    const wrapper = mount(AppPasswordField, {
      props: { modelValue: 'x', disabled: true },
    });
    await wrapper.find('.app-password-field__toggle').trigger('click');
    expect(wrapper.find('input').attributes('type')).toBe('password');
  });

  it('renders the input as disabled when disabled', () => {
    const wrapper = mount(AppPasswordField, {
      props: { modelValue: '', disabled: true },
    });
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });

  it('aria-invalid set when error is present', () => {
    const wrapper = mount(AppPasswordField, {
      props: { modelValue: '', error: 'Required' },
    });
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('.app-password-field__error').text()).toBe('Required');
    expect(wrapper.find('.app-password-field__error').attributes('role')).toBe('alert');
  });

  it('renders hint when no error', () => {
    const wrapper = mount(AppPasswordField, {
      props: { modelValue: '', hint: 'Use a sentence' },
    });
    expect(wrapper.find('.app-password-field__hint').text()).toBe('Use a sentence');
  });

  // Score heuristic — verbatim from docs/design/shared/auth.jsx §PasswordField
  describe('strength meter', () => {
    it.each([
      ['', 0, 'Empty'],
      ['abc', 1, 'Weak'],
      ['aaaaaaaa', 2, 'Okay'], // 8 chars, all lowercase letters → Okay
      ['abcdefghijkl', 2, 'Okay'], // 12 chars, no symbol, ≤16 → Okay
      ['ab1!', 1, 'Weak'], // 4 chars → Weak (length < 8 branch)
      ['abc!def@', 2, 'Okay'], // 8 chars with symbols, length<12 path → Okay
      ['abcdefghijkl1!', 3, 'Strong'], // 14 chars with symbol → Strong
      ['abcdefghijklmnopq', 3, 'Strong'], // 17 chars no symbol, >16 → Strong
    ] as const)('value %j → score %i (%s)', (value, expectedScore, expectedLabel) => {
      const wrapper = mount(AppPasswordField, {
        props: { modelValue: value, withMeter: true },
      });
      const segments = wrapper.findAll('.app-password-field__meter-seg');
      const filled = segments.filter((s) =>
        s.classes().includes('app-password-field__meter-seg--filled'),
      ).length;
      expect(filled).toBe(expectedScore);
      if (expectedScore === 0) {
        expect(wrapper.find('.app-password-field__meter-label').text()).toContain('Empty');
      } else {
        expect(wrapper.find('.app-password-field__meter-label').text()).toContain(expectedLabel);
      }
    });

    it('does not render the meter when withMeter is false', () => {
      const wrapper = mount(AppPasswordField, { props: { modelValue: 'whatever' } });
      expect(wrapper.find('.app-password-field__meter').exists()).toBe(false);
      expect(wrapper.find('.app-password-field__meter-label').exists()).toBe(false);
    });

    it('error wins over meter label when both could apply', () => {
      const wrapper = mount(AppPasswordField, {
        props: { modelValue: 'x', withMeter: true, error: 'Too weak' },
      });
      expect(wrapper.find('.app-password-field__error').exists()).toBe(true);
      expect(wrapper.find('.app-password-field__meter-label').exists()).toBe(false);
    });
  });
});
