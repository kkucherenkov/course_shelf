import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppProgressLinear from './AppProgressLinear.vue';

describe('AppProgressLinear', () => {
  // --- ARIA structure ---

  it('has role="progressbar"', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 50 } });
    expect(wrapper.attributes('role')).toBe('progressbar');
  });

  it('sets aria-valuemin=0 and aria-valuemax=100', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 50 } });
    expect(wrapper.attributes('aria-valuemin')).toBe('0');
    expect(wrapper.attributes('aria-valuemax')).toBe('100');
  });

  it('sets aria-valuenow to the clamped value', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 75 } });
    expect(wrapper.attributes('aria-valuenow')).toBe('75');
  });

  it('sets aria-label when label prop is provided', () => {
    const wrapper = mount(AppProgressLinear, {
      props: { value: 30, label: 'Upload progress' },
    });
    expect(wrapper.attributes('aria-label')).toBe('Upload progress');
  });

  it('does not set aria-label when label is not provided', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 30 } });
    expect(wrapper.attributes('aria-label')).toBeUndefined();
  });

  // --- fill width ---

  it('sets fill width to the value percentage', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 40 } });
    expect(wrapper.find('.app-progress-linear__fill').attributes('style')).toContain('width: 40%');
  });

  it('clamps value below 0 to 0%', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: -10 } });
    expect(wrapper.find('.app-progress-linear__fill').attributes('style')).toContain('width: 0%');
    expect(wrapper.attributes('aria-valuenow')).toBe('0');
  });

  it('clamps value above 100 to 100%', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 120 } });
    expect(wrapper.find('.app-progress-linear__fill').attributes('style')).toContain('width: 100%');
    expect(wrapper.attributes('aria-valuenow')).toBe('100');
  });

  // --- indeterminate ---

  it('applies indeterminate modifier and no fill width when value is undefined', () => {
    const wrapper = mount(AppProgressLinear);
    expect(wrapper.classes()).toContain('app-progress-linear--indeterminate');
    expect(wrapper.find('.app-progress-linear__fill').attributes('style')).toBeUndefined();
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined();
  });

  it('does NOT apply indeterminate modifier when value is defined', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 0 } });
    expect(wrapper.classes()).not.toContain('app-progress-linear--indeterminate');
  });

  // --- thin modifier ---

  it('applies thin modifier when thin=true', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 50, thin: true } });
    expect(wrapper.classes()).toContain('app-progress-linear--thin');
  });

  it('does not apply thin modifier by default', () => {
    const wrapper = mount(AppProgressLinear, { props: { value: 50 } });
    expect(wrapper.classes()).not.toContain('app-progress-linear--thin');
  });
});
