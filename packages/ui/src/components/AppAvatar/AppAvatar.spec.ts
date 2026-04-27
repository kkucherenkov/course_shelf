import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppAvatar from './AppAvatar.vue';

describe('AppAvatar', () => {
  it('renders <img> with the provided URL when `image` is set', () => {
    const wrapper = mount(AppAvatar, {
      props: { image: 'https://example.com/avatar.jpg', name: 'John Doe' },
    });

    const img = wrapper.find('.app-avatar__image');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/avatar.jpg');
    expect(img.attributes('alt')).toBe('John Doe');
  });

  it('uses "Avatar" as alt text when image is set but name is absent', () => {
    const wrapper = mount(AppAvatar, { props: { image: 'https://example.com/a.jpg' } });
    expect(wrapper.find('.app-avatar__image').attributes('alt')).toBe('Avatar');
  });

  it('does not render <img> when no image is set', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'Jane Smith' } });
    expect(wrapper.find('.app-avatar__image').exists()).toBe(false);
  });

  it('derives initials from `name` — two words', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'John Doe' } });
    expect(wrapper.find('.app-avatar__initials').text()).toBe('JD');
  });

  it('derives initials from `name` — single word', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'Admin' } });
    expect(wrapper.find('.app-avatar__initials').text()).toBe('A');
  });

  it('derives initials from `name` — more than two words uses first two', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'Mary Jane Watson' } });
    expect(wrapper.find('.app-avatar__initials').text()).toBe('MJ');
  });

  it('uses explicit `initials` prop (uppercased) over derived initials', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'John Doe', initials: 'zz' } });
    expect(wrapper.find('.app-avatar__initials').text()).toBe('ZZ');
  });

  it('renders empty string as initials when neither name nor initials are set', () => {
    const wrapper = mount(AppAvatar, {});
    expect(wrapper.find('.app-avatar__initials').text()).toBe('');
  });

  it('applies size modifier class', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    for (const size of sizes) {
      const wrapper = mount(AppAvatar, { props: { size } });
      expect(wrapper.find(`.app-avatar--${size}`).exists()).toBe(true);
    }
  });

  it('defaults to size=md', () => {
    const wrapper = mount(AppAvatar, {});
    expect(wrapper.find('.app-avatar--md').exists()).toBe(true);
  });

  it('does not render role badge when `role` is absent', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'John' } });
    expect(wrapper.find('.app-avatar__role').exists()).toBe(false);
  });

  it('renders admin role badge with --admin modifier and aria-label="Administrator"', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'Admin', role: 'admin' } });

    const badge = wrapper.find('.app-avatar__role');
    expect(badge.exists()).toBe(true);
    expect(badge.classes()).toContain('app-avatar__role--admin');
    expect(badge.attributes('role')).toBe('img');
    expect(badge.attributes('aria-label')).toBe('Administrator');
    expect(badge.text()).toBe('A');
  });

  it('renders guest role badge with --guest modifier and aria-label="Guest"', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'Guest User', role: 'guest' } });

    const badge = wrapper.find('.app-avatar__role');
    expect(badge.exists()).toBe(true);
    expect(badge.classes()).toContain('app-avatar__role--guest');
    expect(badge.attributes('role')).toBe('img');
    expect(badge.attributes('aria-label')).toBe('Guest');
    expect(badge.text()).toBe('G');
  });

  it('role badge has role="img" (a11y check)', () => {
    const wrapper = mount(AppAvatar, { props: { role: 'admin' } });
    expect(wrapper.find('.app-avatar__role').attributes('role')).toBe('img');
  });
});
