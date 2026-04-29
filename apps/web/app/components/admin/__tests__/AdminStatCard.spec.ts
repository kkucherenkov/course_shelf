/**
 * Snapshot + behaviour spec for AdminStatCard.
 *
 * Tests use vue-test-utils mount in happy-dom. The component is pure-visual,
 * so snapshot correctness is the main gate.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminStatCard from '../AdminStatCard.vue';

describe('AdminStatCard', () => {
  it('renders label and value', () => {
    const wrapper = mount(AdminStatCard, {
      props: { icon: 'i-heroicons-users', label: 'Users', value: '42' },
    });
    expect(wrapper.text()).toContain('Users');
    expect(wrapper.text()).toContain('42');
  });

  it('renders optional meta text', () => {
    const wrapper = mount(AdminStatCard, {
      props: {
        icon: 'i-heroicons-building-library',
        label: 'Libraries',
        value: '6',
        meta: '1.32 TB total',
      },
    });
    expect(wrapper.text()).toContain('1.32 TB total');
  });

  it('adds error modifier class when error=true', () => {
    const wrapper = mount(AdminStatCard, {
      props: { icon: 'i-heroicons-exclamation-triangle', label: 'Errors', value: '9', error: true },
    });
    expect(wrapper.find('.admin-stat-card').classes()).toContain('admin-stat-card--error');
  });

  it('renders skeleton when loading=true', () => {
    const wrapper = mount(AdminStatCard, {
      props: { icon: 'i-heroicons-users', label: 'Users', value: '—', loading: true },
    });
    expect(wrapper.find('.admin-stat-card__skeleton').exists()).toBe(true);
    // Value and meta are not rendered during loading
    expect(wrapper.find('.admin-stat-card__value').exists()).toBe(false);
  });

  it('matches snapshot (default state)', () => {
    const wrapper = mount(AdminStatCard, {
      props: { icon: 'i-heroicons-home', label: 'Libraries', value: '6', meta: '10 courses' },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
