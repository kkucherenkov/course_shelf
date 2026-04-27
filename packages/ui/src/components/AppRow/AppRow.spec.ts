import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppRow from './AppRow.vue';

describe('AppRow', () => {
  // --- tag rendering ---

  it('renders as <div> by default (non-interactive)', () => {
    const wrapper = mount(AppRow, { slots: { default: 'Content' } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.attributes('type')).toBeUndefined();
  });

  it('renders as <button type="button"> when interactive=true', () => {
    const wrapper = mount(AppRow, {
      props: { interactive: true },
      slots: { default: 'Content' },
    });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('type')).toBe('button');
  });

  // --- slots ---

  it('renders default slot content', () => {
    const wrapper = mount(AppRow, { slots: { default: '<span>Body text</span>' } });
    expect(wrapper.find('.app-row__body').html()).toContain('Body text');
  });

  it('renders leading slot when provided', () => {
    const wrapper = mount(AppRow, {
      slots: {
        default: 'Body',
        leading: '<img src="avatar.png" alt="avatar" />',
      },
    });
    expect(wrapper.find('.app-row__leading').exists()).toBe(true);
    expect(wrapper.find('.app-row__leading').html()).toContain('avatar');
  });

  it('omits leading slot wrapper when leading slot is not provided', () => {
    const wrapper = mount(AppRow, { slots: { default: 'Body' } });
    expect(wrapper.find('.app-row__leading').exists()).toBe(false);
  });

  it('renders trailing slot when provided', () => {
    const wrapper = mount(AppRow, {
      slots: {
        default: 'Body',
        trailing: '<span>12:00</span>',
      },
    });
    expect(wrapper.find('.app-row__trailing').exists()).toBe(true);
    expect(wrapper.find('.app-row__trailing').html()).toContain('12:00');
  });

  it('omits trailing slot wrapper when trailing slot is not provided', () => {
    const wrapper = mount(AppRow, { slots: { default: 'Body' } });
    expect(wrapper.find('.app-row__trailing').exists()).toBe(false);
  });

  // --- selected ---

  it('does not set aria-selected when selected=false (default)', () => {
    const wrapper = mount(AppRow, { slots: { default: 'x' } });
    expect(wrapper.attributes('aria-selected')).toBeUndefined();
    expect(wrapper.classes()).not.toContain('app-row--selected');
  });

  it('sets aria-selected="true" and class when selected=true', () => {
    const wrapper = mount(AppRow, {
      props: { selected: true },
      slots: { default: 'x' },
    });
    expect(wrapper.attributes('aria-selected')).toBe('true');
    expect(wrapper.classes()).toContain('app-row--selected');
  });

  // --- compact ---

  it('does not apply compact modifier by default', () => {
    const wrapper = mount(AppRow, { slots: { default: 'x' } });
    expect(wrapper.classes()).not.toContain('app-row--compact');
  });

  it('applies compact modifier when compact=true', () => {
    const wrapper = mount(AppRow, {
      props: { compact: true },
      slots: { default: 'x' },
    });
    expect(wrapper.classes()).toContain('app-row--compact');
  });

  // --- interactive ---

  it('applies interactive modifier class when interactive=true', () => {
    const wrapper = mount(AppRow, {
      props: { interactive: true },
      slots: { default: 'x' },
    });
    expect(wrapper.classes()).toContain('app-row--interactive');
  });

  it('does not apply interactive modifier when interactive=false (default)', () => {
    const wrapper = mount(AppRow, { slots: { default: 'x' } });
    expect(wrapper.classes()).not.toContain('app-row--interactive');
  });

  // --- combined props ---

  it('can be both selected and compact simultaneously', () => {
    const wrapper = mount(AppRow, {
      props: { selected: true, compact: true },
      slots: { default: 'x' },
    });
    expect(wrapper.classes()).toContain('app-row--selected');
    expect(wrapper.classes()).toContain('app-row--compact');
    expect(wrapper.attributes('aria-selected')).toBe('true');
  });
});
