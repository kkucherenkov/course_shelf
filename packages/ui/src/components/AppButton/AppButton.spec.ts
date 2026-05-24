import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppButton from './AppButton.vue';

// IconCS renders inline SVG — no external fetches needed. We stub it to
// keep the test fast and deterministic without losing the "icon rendered"
// signal (stub produces a named stub element we can query).
const global = { stubs: { IconCS: true } } as const;

describe('AppButton', () => {
  it('renders the label', () => {
    const wrapper = mount(AppButton, { global, props: { label: 'Save' } });
    expect(wrapper.text()).toContain('Save');
  });

  it('renders slot content over the label prop when both are provided', () => {
    const wrapper = mount(AppButton, {
      global,
      props: { label: 'Ignored' },
      slots: { default: 'From slot' },
    });
    expect(wrapper.text()).toContain('From slot');
    expect(wrapper.text()).not.toContain('Ignored');
  });

  it('applies app-button--primary class by default', () => {
    const wrapper = mount(AppButton, { global, props: { label: 'X' } });
    expect(wrapper.find('.app-button--primary').exists()).toBe(true);
  });

  it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
    'applies variant class for variant=%s',
    (variant) => {
      const wrapper = mount(AppButton, { global, props: { variant, label: 'X' } });
      expect(wrapper.find(`.app-button--${variant}`).exists()).toBe(true);
    },
  );

  it.each(['sm', 'md', 'lg'] as const)('applies size modifier for size=%s', (size) => {
    const wrapper = mount(AppButton, { global, props: { size, label: 'X' } });
    expect(wrapper.find(`.app-button--${size}`).exists()).toBe(true);
  });

  it('defaults to size=md', () => {
    const wrapper = mount(AppButton, { global, props: { label: 'X' } });
    expect(wrapper.find('.app-button--md').exists()).toBe(true);
  });

  it('adds app-button--block class when block=true', () => {
    const wrapper = mount(AppButton, { global, props: { label: 'X', block: true } });
    expect(wrapper.find('.app-button--block').exists()).toBe(true);
  });

  it('emits click with the original MouseEvent', async () => {
    const wrapper = mount(AppButton, { global, props: { label: 'Click' } });
    await wrapper.find('button').trigger('click');
    const events = wrapper.emitted('click');
    expect(events).toHaveLength(1);
    expect(events?.[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it('blocks clicks when disabled=true', async () => {
    const wrapper = mount(AppButton, { global, props: { label: 'Off', disabled: true } });
    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.attributes('aria-disabled')).toBe('true');
    await button.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('disables button and marks aria-busy while loading=true', () => {
    const wrapper = mount(AppButton, { global, props: { label: 'Saving', loading: true } });
    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.attributes('data-loading')).toBe('true');
  });

  it('blocks clicks when loading=true', async () => {
    const wrapper = mount(AppButton, { global, props: { label: 'Saving', loading: true } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('renders an accessible button element', () => {
    const wrapper = mount(AppButton, { global, props: { label: 'Go' } });
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.element.tagName).toBe('BUTTON');
  });

  it('renders leading IconCS when iconLeading is provided', () => {
    const wrapper = mount(AppButton, {
      global,
      props: { label: 'Confirm', iconLeading: 'check' },
    });
    expect(wrapper.find('.app-button__icon--leading').exists()).toBe(true);
  });

  it('renders trailing IconCS when iconTrailing is provided', () => {
    const wrapper = mount(AppButton, {
      global,
      props: { label: 'Next', iconTrailing: 'arrow-right' },
    });
    expect(wrapper.find('.app-button__icon--trailing').exists()).toBe(true);
  });

  it('hides leading icon while loading', () => {
    const wrapper = mount(AppButton, {
      global,
      props: { label: 'Saving', iconLeading: 'check', loading: true },
    });
    expect(wrapper.find('.app-button__icon--leading').exists()).toBe(false);
  });

  it('hides trailing icon while loading', () => {
    const wrapper = mount(AppButton, {
      global,
      props: { label: 'Saving', iconTrailing: 'arrow-right', loading: true },
    });
    expect(wrapper.find('.app-button__icon--trailing').exists()).toBe(false);
  });

  it('positions icons on both sides of the label when both are provided', () => {
    const wrapper = mount(AppButton, {
      global,
      props: {
        label: 'Go',
        iconLeading: 'arrow-left',
        iconTrailing: 'arrow-right',
      },
    });
    expect(wrapper.find('.app-button__icon--leading').exists()).toBe(true);
    expect(wrapper.find('.app-button__icon--trailing').exists()).toBe(true);
    expect(wrapper.find('.app-button__label').text()).toBe('Go');
  });

  // --- link mode (`to`) ---

  // Register NuxtLink as a plain anchor so resolveComponent('NuxtLink')
  // resolves in the unit env and we can assert the rendered tag/attributes.
  const linkGlobal = {
    stubs: { IconCS: true },
    components: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
  } as const;

  it('renders as a link (anchor) carrying the button classes when `to` is set', () => {
    const wrapper = mount(AppButton, { global: linkGlobal, props: { label: 'Open', to: '/x' } });
    const a = wrapper.find('a');
    expect(a.exists()).toBe(true);
    expect(a.attributes('href')).toBe('/x');
    expect(a.classes()).toContain('app-button');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('falls back to a <button> when `to` is set but disabled', () => {
    const wrapper = mount(AppButton, {
      global: linkGlobal,
      props: { label: 'Open', to: '/x', disabled: true },
    });
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('falls back to a <button> when `to` is set but loading', () => {
    const wrapper = mount(AppButton, {
      global: linkGlobal,
      props: { label: 'Open', to: '/x', loading: true },
    });
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(true);
  });
});
