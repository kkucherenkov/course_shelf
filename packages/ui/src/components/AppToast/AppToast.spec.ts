import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppToast from './AppToast.vue';

// Stub AppIconButton so we avoid rendering its internal icon/svg dependency.
const global = { stubs: { AppIconButton: true } } as const;

const VARIANTS = ['success', 'info', 'error'] as const;

describe('AppToast', () => {
  it('renders with default variant (info)', () => {
    const wrapper = mount(AppToast, { global, props: { message: 'Hello' } });
    expect(wrapper.find('.app-toast--info').exists()).toBe(true);
  });

  it.each(VARIANTS)('applies the correct BEM modifier class for variant=%s', (variant) => {
    const wrapper = mount(AppToast, { global, props: { variant, message: 'Hello' } });
    expect(wrapper.find(`.app-toast--${variant}`).exists()).toBe(true);
  });

  it('renders the message text', () => {
    const wrapper = mount(AppToast, { global, props: { message: 'File saved!' } });
    expect(wrapper.find('.app-toast__message').text()).toBe('File saved!');
  });

  it('renders the dot element', () => {
    const wrapper = mount(AppToast, { global, props: { message: 'test' } });
    expect(wrapper.find('.app-toast__dot').exists()).toBe(true);
  });

  it.each(VARIANTS)('dot has the correct variant modifier class for variant=%s', (variant) => {
    const wrapper = mount(AppToast, { global, props: { variant, message: 'test' } });
    expect(wrapper.find(`.app-toast__dot--${variant}`).exists()).toBe(true);
  });

  it('dot has aria-hidden="true"', () => {
    const wrapper = mount(AppToast, { global, props: { message: 'test' } });
    expect(wrapper.find('.app-toast__dot').attributes('aria-hidden')).toBe('true');
  });

  it('renders role="alert" for error variant', () => {
    const wrapper = mount(AppToast, { global, props: { variant: 'error', message: 'Error' } });
    expect(wrapper.find('.app-toast').attributes('role')).toBe('alert');
  });

  it.each(['info', 'success'] as const)('renders role="status" for variant=%s', (variant) => {
    const wrapper = mount(AppToast, { global, props: { variant, message: 'test' } });
    expect(wrapper.find('.app-toast').attributes('role')).toBe('status');
  });

  it('does not render the dismiss button when dismissible=false (default)', () => {
    const wrapper = mount(AppToast, { global, props: { message: 'test' } });
    expect(wrapper.find('.app-toast__dismiss').exists()).toBe(false);
  });

  it('renders the dismiss button when dismissible=true', () => {
    const wrapper = mount(AppToast, { global, props: { message: 'test', dismissible: true } });
    expect(wrapper.find('.app-toast__dismiss').exists()).toBe(true);
  });

  it('emits "dismiss" when the dismiss button is clicked', async () => {
    const wrapper = mount(AppToast, { global, props: { message: 'test', dismissible: true } });
    await wrapper.find('.app-toast__dismiss').trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('passes the custom dismissLabel to the dismiss button', () => {
    const wrapper = mount(AppToast, {
      global,
      props: { message: 'test', dismissible: true, dismissLabel: 'Close notification' },
    });
    const btn = wrapper.find('.app-toast__dismiss');
    expect(btn.attributes('arialabel')).toBe('Close notification');
  });
});
