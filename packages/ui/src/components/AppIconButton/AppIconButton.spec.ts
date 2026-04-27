import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import IconCS from '../IconCS/IconCS.vue';
import AppIconButton from './AppIconButton.vue';

// Stub IconCS to keep tests fast — we still verify the element is present.
const global = { stubs: { IconCS: true } } as const;

describe('AppIconButton', () => {
  it('renders a button element', () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'Confirm' },
    });
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.element.tagName).toBe('BUTTON');
  });

  it('applies app-icon-button--primary and app-icon-button--md classes by default', () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'Confirm' },
    });
    expect(wrapper.find('.app-icon-button--primary').exists()).toBe(true);
    expect(wrapper.find('.app-icon-button--md').exists()).toBe(true);
  });

  it('sets aria-label from the ariaLabel prop', () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'trash', ariaLabel: 'Delete item' },
    });
    expect(wrapper.find('button').attributes('aria-label')).toBe('Delete item');
  });

  it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
    'applies variant class for variant=%s',
    (variant) => {
      const wrapper = mount(AppIconButton, {
        global,
        props: { name: 'check', ariaLabel: 'X', variant },
      });
      expect(wrapper.find(`.app-icon-button--${variant}`).exists()).toBe(true);
    },
  );

  it.each(['sm', 'md', 'lg'] as const)('applies size class for size=%s', (size) => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X', size },
    });
    expect(wrapper.find(`.app-icon-button--${size}`).exists()).toBe(true);
  });

  it('sets disabled + aria-disabled when disabled=true', () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X', disabled: true },
    });
    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.attributes('aria-disabled')).toBe('true');
  });

  it('sets data-loading + aria-busy when loading=true', () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X', loading: true },
    });
    const button = wrapper.find('button');
    expect(button.attributes('data-loading')).toBe('true');
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('blocks click when loading=true', async () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X', loading: true },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('blocks click when disabled=true', async () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X', disabled: true },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('emits click when enabled', async () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X' },
    });
    await wrapper.find('button').trigger('click');
    const events = wrapper.emitted('click');
    expect(events).toHaveLength(1);
    expect(events?.[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it('renders IconCS inside the button', () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X' },
    });
    // findComponent works regardless of the stub element tag name.
    expect(wrapper.findComponent(IconCS).exists()).toBe(true);
  });

  it('hides IconCS while loading (spinner takes over via ::after)', () => {
    const wrapper = mount(AppIconButton, {
      global,
      props: { name: 'check', ariaLabel: 'X', loading: true },
    });
    expect(wrapper.findComponent(IconCS).exists()).toBe(false);
  });
});
