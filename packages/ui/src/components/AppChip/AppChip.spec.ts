import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppChip from './AppChip.vue';

// IconCS renders inline SVG — no network requests, no stub needed.

const VARIANTS = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

describe('AppChip', () => {
  it('renders the label prop', () => {
    const wrapper = mount(AppChip, { props: { label: 'Hello' } });
    expect(wrapper.find('.app-chip__label').text()).toBe('Hello');
  });

  it('prefers slot content over the label prop', () => {
    const wrapper = mount(AppChip, {
      props: { label: 'Ignored' },
      slots: { default: 'Slotted' },
    });
    expect(wrapper.find('.app-chip__label').text()).toBe('Slotted');
  });

  it.each(VARIANTS)('applies variant=%s modifier class', (variant) => {
    const wrapper = mount(AppChip, { props: { variant, label: 'x' } });
    expect(wrapper.find(`.app-chip--${variant}`).exists()).toBe(true);
  });

  it.each(SIZES)('applies size=%s modifier class', (size) => {
    const wrapper = mount(AppChip, { props: { size, label: 'x' } });
    expect(wrapper.find(`.app-chip--${size}`).exists()).toBe(true);
  });

  it('defaults to variant=default, size=md', () => {
    const wrapper = mount(AppChip, { props: { label: 'x' } });
    expect(wrapper.find('.app-chip--default').exists()).toBe(true);
    expect(wrapper.find('.app-chip--md').exists()).toBe(true);
  });

  it('renders the leading IconCS when `icon` is provided', () => {
    const wrapper = mount(AppChip, { props: { label: 'Verified', icon: 'check' } });
    expect(wrapper.find('.app-chip__icon').exists()).toBe(true);
  });

  it('does not render leading icon when no `icon` is passed', () => {
    const wrapper = mount(AppChip, { props: { label: 'Plain' } });
    expect(wrapper.find('.app-chip__icon').exists()).toBe(false);
  });

  it('does not render the remove button by default', () => {
    const wrapper = mount(AppChip, { props: { label: 'x' } });
    expect(wrapper.find('.app-chip__remove').exists()).toBe(false);
  });

  it('renders the remove button when `removable` is true', () => {
    const wrapper = mount(AppChip, { props: { label: 'x', removable: true } });
    expect(wrapper.find('.app-chip__remove').exists()).toBe(true);
  });

  it('emits `remove` when remove button is clicked and does not bubble into `click`', async () => {
    const wrapper = mount(AppChip, { props: { label: 'x', removable: true } });
    await wrapper.find('.app-chip__remove').trigger('click');

    expect(wrapper.emitted('remove')).toHaveLength(1);
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('emits `click` when the chip body is clicked', async () => {
    const wrapper = mount(AppChip, { props: { label: 'x' } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('applies the `--selected` modifier and aria-pressed="true" when selected', () => {
    const wrapper = mount(AppChip, { props: { label: 'x', selected: true } });
    expect(wrapper.find('.app-chip--selected').exists()).toBe(true);
    expect(wrapper.attributes('aria-pressed')).toBe('true');
  });

  it('omits the `--selected` modifier and aria-pressed by default', () => {
    const wrapper = mount(AppChip, { props: { label: 'x' } });
    expect(wrapper.find('.app-chip--selected').exists()).toBe(false);
    expect(wrapper.attributes('aria-pressed')).toBeUndefined();
  });

  it('blocks `click` when disabled', async () => {
    const wrapper = mount(AppChip, { props: { label: 'x', disabled: true } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
    expect(wrapper.find('.app-chip--disabled').exists()).toBe(true);
    expect(wrapper.attributes('aria-disabled')).toBe('true');
  });

  it('blocks `remove` when disabled', async () => {
    const wrapper = mount(AppChip, { props: { label: 'x', removable: true, disabled: true } });
    await wrapper.find('.app-chip__remove').trigger('click');
    expect(wrapper.emitted('remove')).toBeUndefined();
  });

  it('renders as button element by default', () => {
    const wrapper = mount(AppChip, { props: { label: 'x' } });
    expect(wrapper.element.tagName.toLowerCase()).toBe('button');
  });

  it('remove button has aria-label="Remove"', () => {
    const wrapper = mount(AppChip, { props: { label: 'x', removable: true } });
    expect(wrapper.find('.app-chip__remove').attributes('aria-label')).toBe('Remove');
  });
});
