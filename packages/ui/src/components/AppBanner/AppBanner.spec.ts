import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import IconCS from '../IconCS/IconCS.vue';
import AppBanner from './AppBanner.vue';

// Only stub AppIconButton — IconCS is a pure SVG component and is safe to mount.
const global = { stubs: { AppIconButton: true } } as const;

const VARIANTS = ['info', 'success', 'warning', 'error'] as const;

describe('AppBanner', () => {
  it('renders with default variant (info)', () => {
    const wrapper = mount(AppBanner, { global, props: { body: 'Hello' } });
    expect(wrapper.find('.app-banner--info').exists()).toBe(true);
  });

  it.each(VARIANTS)('applies the correct BEM modifier class for variant=%s', (variant) => {
    const wrapper = mount(AppBanner, { global, props: { variant } });
    expect(wrapper.find(`.app-banner--${variant}`).exists()).toBe(true);
  });

  it('renders role="alert" for error variant', () => {
    const wrapper = mount(AppBanner, { global, props: { variant: 'error' } });
    expect(wrapper.find('.app-banner').attributes('role')).toBe('alert');
  });

  it.each(['info', 'success', 'warning'] as const)(
    'renders role="status" for variant=%s',
    (variant) => {
      const wrapper = mount(AppBanner, { global, props: { variant } });
      expect(wrapper.find('.app-banner').attributes('role')).toBe('status');
    },
  );

  it('renders the title when provided', () => {
    const wrapper = mount(AppBanner, {
      global,
      props: { title: 'Important', body: 'Something happened' },
    });
    expect(wrapper.find('.app-banner__title').text()).toBe('Important');
  });

  it('does not render the title element when title is not provided', () => {
    const wrapper = mount(AppBanner, { global, props: { body: 'Body text' } });
    expect(wrapper.find('.app-banner__title').exists()).toBe(false);
  });

  it('renders the body prop as fallback when no slot is provided', () => {
    const wrapper = mount(AppBanner, { global, props: { body: 'My body text' } });
    expect(wrapper.find('.app-banner__body').text()).toBe('My body text');
  });

  it('slot content wins over the body prop', () => {
    const wrapper = mount(AppBanner, {
      global,
      props: { body: 'Ignored body' },
      slots: { default: 'Slot content wins' },
    });
    expect(wrapper.find('.app-banner__body').text()).toBe('Slot content wins');
  });

  it('does not render the actions container when no actions slot is provided', () => {
    const wrapper = mount(AppBanner, { global, props: { body: 'Body' } });
    expect(wrapper.find('.app-banner__actions').exists()).toBe(false);
  });

  it('renders the actions slot when provided', () => {
    const wrapper = mount(AppBanner, {
      global,
      props: { body: 'Body' },
      slots: { actions: '<button class="my-action">Retry</button>' },
    });
    expect(wrapper.find('.app-banner__actions').exists()).toBe(true);
    expect(wrapper.find('.app-banner__actions .my-action').exists()).toBe(true);
  });

  it('does not render the dismiss button when dismissible=false (default)', () => {
    const wrapper = mount(AppBanner, { global, props: {} });
    expect(wrapper.find('.app-banner__dismiss').exists()).toBe(false);
  });

  it('renders the dismiss button when dismissible=true', () => {
    const wrapper = mount(AppBanner, { global, props: { dismissible: true } });
    expect(wrapper.find('.app-banner__dismiss').exists()).toBe(true);
  });

  it('emits "dismiss" when the dismiss button is clicked', async () => {
    const wrapper = mount(AppBanner, { global, props: { dismissible: true } });
    await wrapper.find('.app-banner__dismiss').trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('passes the custom dismissLabel to the dismiss button', () => {
    const wrapper = mount(AppBanner, {
      global,
      props: { dismissible: true, dismissLabel: 'Close banner' },
    });
    const btn = wrapper.find('.app-banner__dismiss');
    expect(btn.attributes('arialabel')).toBe('Close banner');
  });

  it('passes the correct icon name for info variant', () => {
    const wrapper = mount(AppBanner, { global, props: { variant: 'info' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('info');
  });

  it('passes the correct icon name for success variant', () => {
    const wrapper = mount(AppBanner, { global, props: { variant: 'success' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('check-circle');
  });

  it('passes the correct icon name for warning variant', () => {
    const wrapper = mount(AppBanner, { global, props: { variant: 'warning' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('alert');
  });

  it('passes the correct icon name for error variant', () => {
    const wrapper = mount(AppBanner, { global, props: { variant: 'error' } });
    expect(wrapper.findComponent(IconCS).props('name')).toBe('alert');
  });
});
