import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

// Stub @app/ui so importing the component doesn't pull the whole barrel — which
// transitively loads @nuxt/ui runtime and its Nuxt-build virtuals (#build/ui/*,
// #imports) that don't resolve outside a Nuxt build. IconCS only renders inside
// the indicator's own spans, so a stub is behaviour-preserving for these tests.
vi.mock('@app/ui', () => ({
  IconCS: { name: 'IconCS', props: ['name', 'size'], template: '<i class="icon-cs" />' },
}));

import SettingSyncIndicator from '../SettingSyncIndicator.vue';

const LABEL_PROPS = {
  labelSaving: 'Saving…',
  labelSaved: 'Saved',
  labelError: 'Error',
};

describe('SettingSyncIndicator', () => {
  it('renders nothing visible in idle state', () => {
    const wrapper = mount(SettingSyncIndicator, {
      props: { state: 'idle', ...LABEL_PROPS },
    });
    expect(wrapper.classes()).toContain('setting-sync-indicator--idle');
    expect(wrapper.text()).toBe('');
  });

  it('renders spinner + saving label in saving state', () => {
    const wrapper = mount(SettingSyncIndicator, {
      props: { state: 'saving', ...LABEL_PROPS },
    });
    expect(wrapper.classes()).toContain('setting-sync-indicator--saving');
    expect(wrapper.find('.setting-sync-indicator__spinner').exists()).toBe(true);
    expect(wrapper.find('.setting-sync-indicator__label').text()).toBe('Saving…');
  });

  it('renders check icon + saved label in saved state', () => {
    const wrapper = mount(SettingSyncIndicator, {
      props: { state: 'saved', ...LABEL_PROPS },
    });
    expect(wrapper.classes()).toContain('setting-sync-indicator--saved');
    expect(wrapper.find('.setting-sync-indicator__icon--check').exists()).toBe(true);
    expect(wrapper.find('.setting-sync-indicator__label').text()).toBe('Saved');
  });

  it('renders error icon + error label in error state', () => {
    const wrapper = mount(SettingSyncIndicator, {
      props: { state: 'error', ...LABEL_PROPS },
    });
    expect(wrapper.classes()).toContain('setting-sync-indicator--error');
    expect(wrapper.find('.setting-sync-indicator__icon--error').exists()).toBe(true);
    expect(wrapper.find('.setting-sync-indicator__label').text()).toBe('Error');
  });

  it('has aria-live="polite" for accessibility', () => {
    const wrapper = mount(SettingSyncIndicator, {
      props: { state: 'saved', ...LABEL_PROPS },
    });
    expect(wrapper.attributes('aria-live')).toBe('polite');
  });
});
