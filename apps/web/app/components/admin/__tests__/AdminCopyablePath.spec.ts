/**
 * Spec for AdminCopyablePath component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminCopyablePath from '../AdminCopyablePath.vue';

describe('AdminCopyablePath', () => {
  beforeEach(() => {
    // Stub navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('renders the path text', () => {
    const wrapper = mount(AdminCopyablePath, {
      props: { path: '/srv/courses/cs', ariaLabel: 'Copy path /srv/courses/cs' },
    });
    expect(wrapper.text()).toContain('/srv/courses/cs');
  });

  it('shows clipboard icon by default', () => {
    const wrapper = mount(AdminCopyablePath, {
      props: { path: '/srv', ariaLabel: 'Copy' },
    });
    expect(wrapper.find('.i-heroicons-clipboard-document').exists()).toBe(true);
    expect(wrapper.find('.i-heroicons-check').exists()).toBe(false);
  });

  it('copies path to clipboard and shows check icon on click', async () => {
    const wrapper = mount(AdminCopyablePath, {
      props: { path: '/srv/courses', ariaLabel: 'Copy path' },
    });
    await wrapper.find('button').trigger('click');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/srv/courses');
    // After click the --copied class should be present
    expect(wrapper.find('.adm-copyable-path--copied').exists()).toBe(true);
    expect(wrapper.find('.i-heroicons-check').exists()).toBe(true);
  });

  it('matches snapshot', () => {
    const wrapper = mount(AdminCopyablePath, {
      props: { path: '/srv/courses/cs', ariaLabel: 'Copy path' },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
