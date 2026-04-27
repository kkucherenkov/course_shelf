import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppEmptyState from './AppEmptyState.vue';

describe('AppEmptyState', () => {
  it('has role="status"', () => {
    const wrapper = mount(AppEmptyState, { props: { title: 'Nothing here' } });
    expect(wrapper.attributes('role')).toBe('status');
  });

  it('renders the title', () => {
    const wrapper = mount(AppEmptyState, { props: { title: 'No courses yet' } });
    expect(wrapper.find('.app-empty-state__title').text()).toBe('No courses yet');
  });

  it('renders title in an <h3>', () => {
    const wrapper = mount(AppEmptyState, { props: { title: 'Empty library' } });
    expect(wrapper.find('h3').exists()).toBe(true);
  });

  it('renders body text when body prop is provided', () => {
    const wrapper = mount(AppEmptyState, {
      props: { title: 'Empty', body: 'Add your first course to get started.' },
    });
    expect(wrapper.find('.app-empty-state__body').text()).toBe(
      'Add your first course to get started.',
    );
  });

  it('omits the body element when neither body prop nor body slot is provided', () => {
    const wrapper = mount(AppEmptyState, { props: { title: 'Empty' } });
    expect(wrapper.find('.app-empty-state__body').exists()).toBe(false);
  });

  it('renders body slot content over body prop', () => {
    const wrapper = mount(AppEmptyState, {
      props: { title: 'Empty', body: 'Prop body' },
      slots: { body: '<em>Slot body</em>' },
    });
    expect(wrapper.find('.app-empty-state__body').html()).toContain('Slot body');
  });

  it('renders the action slot when provided', () => {
    const wrapper = mount(AppEmptyState, {
      props: { title: 'Empty' },
      slots: { action: '<button>Add course</button>' },
    });
    expect(wrapper.find('.app-empty-state__action').exists()).toBe(true);
    expect(wrapper.find('.app-empty-state__action').html()).toContain('Add course');
  });

  it('omits the action wrapper when action slot is not provided', () => {
    const wrapper = mount(AppEmptyState, { props: { title: 'Empty' } });
    expect(wrapper.find('.app-empty-state__action').exists()).toBe(false);
  });

  it('renders the illustration slot over the default icon when provided', () => {
    const wrapper = mount(AppEmptyState, {
      props: { title: 'Empty' },
      slots: { illustration: '<img src="custom.svg" alt="custom" />' },
    });
    expect(wrapper.html()).toContain('custom.svg');
    // IconCS should not render since illustration slot overrides it
    expect(wrapper.find('.app-icon-cs').exists()).toBe(false);
  });

  it('renders the default folder icon when no illustration slot', () => {
    const wrapper = mount(AppEmptyState, { props: { title: 'Empty' } });
    expect(wrapper.find('.app-icon-cs').exists()).toBe(true);
  });
});
