/**
 * Spec for AdminRoleChip component.
 *
 * Covers: read-only render, editable variants, menu open/close,
 * role selection emits, and the banned ("disabled") state.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminRoleChip from '../AdminRoleChip.vue';

const baseProps = {
  role: 'user' as const,
  banned: false,
  editable: false,
  labelAdmin: 'Admin',
  labelUser: 'User',
  labelGuest: 'Guest',
  labelDisabled: 'Disabled',
};

describe('AdminRoleChip', () => {
  // ── Snapshot: four variants ────────────────────────────────────────────────

  it('matches snapshot — read-only admin', () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'admin', editable: false },
    });
    expect(w.html()).toMatchSnapshot();
  });

  it('matches snapshot — editable user', () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'user', editable: true },
    });
    expect(w.html()).toMatchSnapshot();
  });

  it('matches snapshot — editable guest', () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'guest', editable: true },
    });
    expect(w.html()).toMatchSnapshot();
  });

  it('matches snapshot — editable banned (disabled)', () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'user', banned: true, editable: true },
    });
    expect(w.html()).toMatchSnapshot();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('shows role label for each role', () => {
    for (const [role, label] of [
      ['admin', 'Admin'],
      ['user', 'User'],
      ['guest', 'Guest'],
    ] as const) {
      const w = mount(AdminRoleChip, { props: { ...baseProps, role } });
      expect(w.text()).toContain(label);
    }
  });

  it('shows "Disabled" label when banned overrides role', () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'admin', banned: true },
    });
    expect(w.text()).toContain('Disabled');
    expect(w.text()).not.toContain('Admin');
  });

  it('does not render a caret when read-only', () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, editable: false },
    });
    expect(w.find('.adm-role-chip__caret').exists()).toBe(false);
  });

  it('renders a caret when editable', () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, editable: true },
    });
    expect(w.find('.adm-role-chip__caret').exists()).toBe(true);
  });

  // ── Interaction ───────────────────────────────────────────────────────────

  it('opens menu on click when editable', async () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, editable: true },
    });
    expect(w.find('.adm-role-chip__menu').exists()).toBe(false);
    await w.find('.adm-role-chip__pill').trigger('click');
    expect(w.find('.adm-role-chip__menu').exists()).toBe(true);
  });

  it('does not open menu when not editable', async () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, editable: false },
    });
    await w.find('.adm-role-chip__pill').trigger('click');
    expect(w.find('.adm-role-chip__menu').exists()).toBe(false);
  });

  it('emits change with correct payload when a role is selected', async () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'user', editable: true },
    });
    await w.find('.adm-role-chip__pill').trigger('click');
    // Find admin option
    const options = w.findAll('.adm-role-chip__option');
    const adminOption = options.find((o) => o.text() === 'Admin');
    expect(adminOption).toBeDefined();
    await adminOption!.trigger('click');
    expect(w.emitted('change')).toBeTruthy();
    expect(w.emitted('change')![0]).toEqual([{ role: 'admin', banned: false }]);
  });

  it('emits change with banned:true when Disabled option is selected', async () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'user', editable: true },
    });
    await w.find('.adm-role-chip__pill').trigger('click');
    const options = w.findAll('.adm-role-chip__option');
    const disabledOption = options.find((o) => o.text() === 'Disabled');
    expect(disabledOption).toBeDefined();
    await disabledOption!.trigger('click');
    expect(w.emitted('change')).toBeTruthy();
    expect(w.emitted('change')![0]).toEqual([{ banned: true }]);
  });

  it('closes menu after selection', async () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, role: 'user', editable: true },
    });
    await w.find('.adm-role-chip__pill').trigger('click');
    expect(w.find('.adm-role-chip__menu').exists()).toBe(true);
    const options = w.findAll('.adm-role-chip__option');
    await options[0]!.trigger('click');
    expect(w.find('.adm-role-chip__menu').exists()).toBe(false);
  });

  it('closes menu on Escape key', async () => {
    const w = mount(AdminRoleChip, {
      props: { ...baseProps, editable: true },
    });
    await w.find('.adm-role-chip__pill').trigger('click');
    expect(w.find('.adm-role-chip__menu').exists()).toBe(true);
    await w.find('.adm-role-chip__pill').trigger('keydown', { key: 'Escape' });
    expect(w.find('.adm-role-chip__menu').exists()).toBe(false);
  });
});
