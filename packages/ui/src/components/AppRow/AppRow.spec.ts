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

  it('does not set the selected modifier by default', () => {
    const wrapper = mount(AppRow, { slots: { default: 'x' } });
    expect(wrapper.classes()).not.toContain('app-row--selected');
  });

  // `selected` is a visual modifier and emits no ARIA of its own: the row
  // renders a plain <button> or <div>, and `aria-selected` is only valid on
  // option/row/tab/treeitem-like roles — axe's `aria-allowed-attr` failed on
  // every selected row that reached the a11y gate.
  it('applies the selected modifier without emitting aria-selected', () => {
    const wrapper = mount(AppRow, {
      props: { selected: true, interactive: true },
      slots: { default: 'x' },
    });
    expect(wrapper.classes()).toContain('app-row--selected');
    expect(wrapper.attributes('aria-selected')).toBeUndefined();
  });

  it('lets the consumer supply its own selection semantics', () => {
    const wrapper = mount(AppRow, {
      props: { selected: true, interactive: true },
      attrs: { 'aria-current': 'page' },
      slots: { default: 'x' },
    });
    expect(wrapper.attributes('aria-current')).toBe('page');
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
  });

  // --- link mode (`to`) — #780: sidebar/lesson rows were `<button>`, so a
  // browser had nothing to middle-click, ctrl-click into a new tab, or copy.

  // Register NuxtLink as a plain anchor so resolveComponent('NuxtLink')
  // resolves in the unit env and we can assert the rendered tag/attributes —
  // same stub AppButton.spec.ts uses for its own `to` prop.
  const linkGlobal = {
    components: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
  } as const;

  it('renders as a link (anchor) whose href matches the route when `to` is set', () => {
    const wrapper = mount(AppRow, {
      global: linkGlobal,
      props: { to: '/courses/abc/lessons/def' },
      slots: { default: 'Lesson 1' },
    });
    const a = wrapper.find('a');
    expect(a.exists()).toBe(true);
    expect(a.attributes('href')).toBe('/courses/abc/lessons/def');
    expect(a.classes()).toContain('app-row');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('applies the interactive modifier class for a link even without interactive=true', () => {
    const wrapper = mount(AppRow, {
      global: linkGlobal,
      props: { to: '/browse' },
      slots: { default: 'x' },
    });
    expect(wrapper.classes()).toContain('app-row--interactive');
  });

  it('renders as <div> when `to` is unset, regardless of interactive', () => {
    const wrapper = mount(AppRow, {
      global: linkGlobal,
      slots: { default: 'x' },
    });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.find('a').exists()).toBe(false);
  });

  it('does not set a `type` attribute on the link variant', () => {
    const wrapper = mount(AppRow, {
      global: linkGlobal,
      props: { to: '/browse', interactive: true },
      slots: { default: 'x' },
    });
    expect(wrapper.attributes('type')).toBeUndefined();
  });
});
