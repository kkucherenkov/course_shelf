import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

// Stub @app/ui for the same reason SettingSyncIndicator.spec.ts does — the
// real barrel pulls in @nuxt/ui runtime and Nuxt build virtuals that don't
// resolve outside a Nuxt build.
vi.mock('@app/ui', () => ({
  AppSkeleton: {
    name: 'AppSkeleton',
    props: ['width', 'height', 'radius'],
    template: '<div class="app-skeleton" />',
  },
  AppNoPermission: {
    name: 'AppNoPermission',
    props: ['title', 'body'],
    template: '<div class="app-no-permission" role="status">{{ title }} — {{ body }}</div>',
  },
}));

import AdminAccessGate from '../AdminAccessGate.vue';

const LABELS = {
  loadingLabel: 'Checking access…',
  deniedTitle: 'No access',
  deniedBody: "You don't have permission.",
};

describe('AdminAccessGate', () => {
  it('renders a loading region and no slot content while state is unknown', () => {
    const wrapper = mount(AdminAccessGate, {
      props: { state: 'unknown', ...LABELS },
      slots: { default: '<div class="real-page">Dashboard</div>' },
    });
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Checking access…');
    expect(wrapper.find('.real-page').exists()).toBe(false);
  });

  it('renders AppNoPermission and no slot content when denied', () => {
    const wrapper = mount(AdminAccessGate, {
      props: { state: 'denied', ...LABELS },
      slots: { default: '<div class="real-page">Dashboard</div>' },
    });
    expect(wrapper.find('.app-no-permission').exists()).toBe(true);
    expect(wrapper.text()).toContain('No access');
    expect(wrapper.find('.real-page').exists()).toBe(false);
  });

  it('renders the slotted page and nothing else when granted', () => {
    const wrapper = mount(AdminAccessGate, {
      props: { state: 'granted', ...LABELS },
      slots: { default: '<div class="real-page">Dashboard</div>' },
    });
    expect(wrapper.find('.real-page').exists()).toBe(true);
    expect(wrapper.find('.app-no-permission').exists()).toBe(false);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });
});
