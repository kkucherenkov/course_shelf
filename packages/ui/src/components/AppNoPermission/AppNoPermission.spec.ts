import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppNoPermission from './AppNoPermission.vue';

describe('AppNoPermission', () => {
  it('has role="status"', () => {
    const wrapper = mount(AppNoPermission, { props: { title: 'Access denied' } });
    expect(wrapper.attributes('role')).toBe('status');
  });

  it('renders the title', () => {
    const wrapper = mount(AppNoPermission, {
      props: { title: 'You do not have permission to view this.' },
    });
    expect(wrapper.find('.app-no-permission__title').text()).toBe(
      'You do not have permission to view this.',
    );
  });

  it('renders title in an <h3>', () => {
    const wrapper = mount(AppNoPermission, { props: { title: 'No access' } });
    expect(wrapper.find('h3').exists()).toBe(true);
  });

  it('renders body text when body prop is provided', () => {
    const wrapper = mount(AppNoPermission, {
      props: { title: 'No access', body: 'Contact your administrator.' },
    });
    expect(wrapper.find('.app-no-permission__body').text()).toBe('Contact your administrator.');
  });

  it('omits the body element when body is not provided', () => {
    const wrapper = mount(AppNoPermission, { props: { title: 'No access' } });
    expect(wrapper.find('.app-no-permission__body').exists()).toBe(false);
  });

  it('renders the action slot when provided', () => {
    const wrapper = mount(AppNoPermission, {
      props: { title: 'No access' },
      slots: { action: '<a href="/login">Log in</a>' },
    });
    expect(wrapper.find('.app-no-permission__action').html()).toContain('Log in');
  });

  it('omits the action wrapper when action slot is not provided', () => {
    const wrapper = mount(AppNoPermission, { props: { title: 'No access' } });
    expect(wrapper.find('.app-no-permission__action').exists()).toBe(false);
  });

  it('renders the illustration slot when provided', () => {
    const wrapper = mount(AppNoPermission, {
      props: { title: 'No access' },
      slots: { illustration: '<img src="lock.svg" alt="locked" />' },
    });
    expect(wrapper.html()).toContain('lock.svg');
    expect(wrapper.find('.app-icon-cs').exists()).toBe(false);
  });

  it('renders the default lock icon when no illustration slot', () => {
    const wrapper = mount(AppNoPermission, { props: { title: 'No access' } });
    expect(wrapper.find('.app-icon-cs').exists()).toBe(true);
  });
});
