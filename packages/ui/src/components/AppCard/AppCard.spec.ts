import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppCard from './AppCard.vue';

describe('AppCard', () => {
  it('renders default slot content', () => {
    const wrapper = mount(AppCard, { slots: { default: '<p>Body copy</p>' } });
    expect(wrapper.html()).toContain('Body copy');
  });

  it('renders title and description when provided', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'System health', description: 'All services operational' },
    });
    expect(wrapper.find('.app-card__title').text()).toBe('System health');
    expect(wrapper.find('.app-card__description').text()).toBe('All services operational');
  });

  it('omits the header when no title is given', () => {
    const wrapper = mount(AppCard, { slots: { default: 'x' } });
    expect(wrapper.find('.app-card__head').exists()).toBe(false);
  });

  it('omits the description element when title is given without description', () => {
    const wrapper = mount(AppCard, { props: { title: 'Only title' } });
    expect(wrapper.find('.app-card__title').exists()).toBe(true);
    expect(wrapper.find('.app-card__description').exists()).toBe(false);
  });

  it('renders the footer slot when provided', () => {
    const wrapper = mount(AppCard, {
      slots: { default: 'x', footer: '<small>Footer text</small>' },
    });
    expect(wrapper.html()).toContain('Footer text');
  });

  it('uses a heading element for the title (a11y)', () => {
    const wrapper = mount(AppCard, { props: { title: 'Section' } });
    expect(wrapper.find('h3').exists()).toBe(true);
  });

  // --- interactive prop ---

  it('renders as a <div> by default (non-interactive)', () => {
    const wrapper = mount(AppCard, { slots: { default: 'x' } });
    const root = wrapper.find('.app-card');
    expect(root.exists()).toBe(true);
    expect(root.element.tagName).toBe('DIV');
    expect(root.classes()).not.toContain('app-card--interactive');
  });

  it('renders as a <button type="button"> when interactive=true', () => {
    const wrapper = mount(AppCard, {
      props: { interactive: true },
      slots: { default: 'x' },
    });
    const root = wrapper.find('.app-card');
    expect(root.element.tagName).toBe('BUTTON');
    expect(root.attributes('type')).toBe('button');
    expect(root.classes()).toContain('app-card--interactive');
  });

  it('emits click when interactive and the surface is clicked', async () => {
    const wrapper = mount(AppCard, {
      props: { interactive: true },
      slots: { default: 'x' },
    });
    await wrapper.find('.app-card').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does NOT emit click when not interactive', async () => {
    const wrapper = mount(AppCard, { slots: { default: 'x' } });
    await wrapper.find('.app-card').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('emits click on Enter when interactive (keyboard activation)', async () => {
    const wrapper = mount(AppCard, {
      props: { interactive: true },
      slots: { default: 'x' },
    });
    await wrapper.find('.app-card').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits click on Space when interactive (keyboard activation)', async () => {
    const wrapper = mount(AppCard, {
      props: { interactive: true },
      slots: { default: 'x' },
    });
    await wrapper.find('.app-card').trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('ignores other keys on keydown when interactive', async () => {
    const wrapper = mount(AppCard, {
      props: { interactive: true },
      slots: { default: 'x' },
    });
    await wrapper.find('.app-card').trigger('keydown', { key: 'Tab' });
    await wrapper.find('.app-card').trigger('keydown', { key: 'a' });
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('applies the interactive modifier class so hover/focus affordance can attach', () => {
    const wrapper = mount(AppCard, {
      props: { interactive: true },
      slots: { default: 'x' },
    });
    expect(wrapper.find('.app-card--interactive').exists()).toBe(true);
  });

  // --- size + hoverable ---

  it('defaults to size md (.card parity)', () => {
    const wrapper = mount(AppCard, { slots: { default: 'x' } });
    expect(wrapper.find('.app-card--md').exists()).toBe(true);
    expect(wrapper.find('.app-card--lg').exists()).toBe(false);
  });

  it('renders the lg modifier when size="lg"', () => {
    const wrapper = mount(AppCard, { props: { size: 'lg' }, slots: { default: 'x' } });
    expect(wrapper.find('.app-card--lg').exists()).toBe(true);
    expect(wrapper.find('.app-card--md').exists()).toBe(false);
  });

  it('applies the hoverable modifier on a non-interactive root', () => {
    const wrapper = mount(AppCard, { props: { hoverable: true }, slots: { default: 'x' } });
    expect(wrapper.find('.app-card--hoverable').exists()).toBe(true);
    expect(wrapper.find('.app-card').element.tagName).toBe('DIV');
  });

  it('drops the hoverable modifier when interactive is also true', () => {
    const wrapper = mount(AppCard, {
      props: { hoverable: true, interactive: true },
      slots: { default: 'x' },
    });
    expect(wrapper.find('.app-card--hoverable').exists()).toBe(false);
    expect(wrapper.find('.app-card--interactive').exists()).toBe(true);
  });
});
