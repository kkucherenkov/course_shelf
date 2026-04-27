import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import IconCS from '../IconCS/IconCS.vue';
import AppAlert from './AppAlert.vue';

// IconCS is a pure SVG component — no network requests, safe to mount directly.
const global = {} as const;

const VARIANTS = ['info', 'success', 'warning', 'error'] as const;

describe('AppAlert', () => {
  it('renders with default variant (info)', () => {
    const wrapper = mount(AppAlert, { global, props: { message: 'Something happened' } });
    expect(wrapper.find('.app-alert--info').exists()).toBe(true);
  });

  it.each(VARIANTS)('applies the correct BEM modifier class for variant=%s', (variant) => {
    const wrapper = mount(AppAlert, { global, props: { variant, message: 'test' } });
    expect(wrapper.find(`.app-alert--${variant}`).exists()).toBe(true);
  });

  it('always renders role="alert"', () => {
    const wrapper = mount(AppAlert, { global, props: { message: 'test' } });
    expect(wrapper.find('.app-alert').attributes('role')).toBe('alert');
  });

  it.each(VARIANTS)('renders role="alert" for variant=%s', (variant) => {
    const wrapper = mount(AppAlert, { global, props: { variant, message: 'test' } });
    expect(wrapper.find('.app-alert').attributes('role')).toBe('alert');
  });

  it('renders the message text', () => {
    const wrapper = mount(AppAlert, { global, props: { message: 'Field is required' } });
    expect(wrapper.find('.app-alert__message').text()).toBe('Field is required');
  });

  it('renders an icon element', () => {
    const wrapper = mount(AppAlert, { global, props: { message: 'test' } });
    expect(wrapper.find('.app-alert__icon').exists()).toBe(true);
  });

  it('passes the correct icon name for info variant', () => {
    const wrapper = mount(AppAlert, { global, props: { variant: 'info', message: 'test' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('info');
  });

  it('passes the correct icon name for success variant', () => {
    const wrapper = mount(AppAlert, { global, props: { variant: 'success', message: 'test' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('check-circle');
  });

  it('passes the correct icon name for warning variant', () => {
    const wrapper = mount(AppAlert, { global, props: { variant: 'warning', message: 'test' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('alert');
  });

  it('passes the correct icon name for error variant', () => {
    const wrapper = mount(AppAlert, { global, props: { variant: 'error', message: 'test' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('alert');
  });
});
