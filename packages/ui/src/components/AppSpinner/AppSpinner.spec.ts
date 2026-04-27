import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppSpinner from './AppSpinner.vue';

describe('AppSpinner', () => {
  it('renders a <span> element', () => {
    const wrapper = mount(AppSpinner);
    expect(wrapper.element.tagName).toBe('SPAN');
  });

  it('has role="status"', () => {
    const wrapper = mount(AppSpinner);
    expect(wrapper.attributes('role')).toBe('status');
  });

  it('has default aria-label "Loading"', () => {
    const wrapper = mount(AppSpinner);
    expect(wrapper.attributes('aria-label')).toBe('Loading');
  });

  it('uses custom aria-label when label prop is provided', () => {
    const wrapper = mount(AppSpinner, { props: { label: 'Saving changes' } });
    expect(wrapper.attributes('aria-label')).toBe('Saving changes');
  });

  it('applies md size modifier by default', () => {
    const wrapper = mount(AppSpinner);
    expect(wrapper.classes()).toContain('app-spinner--md');
    expect(wrapper.classes()).not.toContain('app-spinner--sm');
    expect(wrapper.classes()).not.toContain('app-spinner--lg');
  });

  it('applies sm size modifier when size="sm"', () => {
    const wrapper = mount(AppSpinner, { props: { size: 'sm' } });
    expect(wrapper.classes()).toContain('app-spinner--sm');
  });

  it('applies lg size modifier when size="lg"', () => {
    const wrapper = mount(AppSpinner, { props: { size: 'lg' } });
    expect(wrapper.classes()).toContain('app-spinner--lg');
  });

  it('always has the base app-spinner class', () => {
    const wrapper = mount(AppSpinner, { props: { size: 'sm' } });
    expect(wrapper.classes()).toContain('app-spinner');
  });
});
