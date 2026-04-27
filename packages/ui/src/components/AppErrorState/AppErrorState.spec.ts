import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppErrorState from './AppErrorState.vue';

describe('AppErrorState', () => {
  it('has role="alert" for assertive announcement', () => {
    const wrapper = mount(AppErrorState, { props: { title: 'Something went wrong' } });
    expect(wrapper.attributes('role')).toBe('alert');
  });

  it('renders the title', () => {
    const wrapper = mount(AppErrorState, { props: { title: 'Failed to load' } });
    expect(wrapper.find('.app-error-state__title').text()).toBe('Failed to load');
  });

  it('renders title in an <h3>', () => {
    const wrapper = mount(AppErrorState, { props: { title: 'Error' } });
    expect(wrapper.find('h3').exists()).toBe(true);
  });

  it('renders body text when body prop is provided', () => {
    const wrapper = mount(AppErrorState, {
      props: { title: 'Error', body: 'Please try again later.' },
    });
    expect(wrapper.find('.app-error-state__body').text()).toBe('Please try again later.');
  });

  it('omits the body element when body is not provided', () => {
    const wrapper = mount(AppErrorState, { props: { title: 'Error' } });
    expect(wrapper.find('.app-error-state__body').exists()).toBe(false);
  });

  it('renders the action slot when provided', () => {
    const wrapper = mount(AppErrorState, {
      props: { title: 'Error' },
      slots: { action: '<button>Retry</button>' },
    });
    expect(wrapper.find('.app-error-state__action').html()).toContain('Retry');
  });

  it('omits the action wrapper when action slot is not provided', () => {
    const wrapper = mount(AppErrorState, { props: { title: 'Error' } });
    expect(wrapper.find('.app-error-state__action').exists()).toBe(false);
  });

  it('renders the illustration slot when provided', () => {
    const wrapper = mount(AppErrorState, {
      props: { title: 'Error' },
      slots: { illustration: '<img src="error.svg" alt="error illustration" />' },
    });
    expect(wrapper.html()).toContain('error.svg');
    expect(wrapper.find('.app-icon-cs').exists()).toBe(false);
  });

  it('renders the default alert icon when no illustration slot', () => {
    const wrapper = mount(AppErrorState, { props: { title: 'Error' } });
    expect(wrapper.find('.app-icon-cs').exists()).toBe(true);
  });
});
