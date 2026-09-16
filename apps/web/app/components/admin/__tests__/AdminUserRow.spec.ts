/**
 * Spec for AdminUserRow component.
 *
 * Mocks AdminRoleChip to keep focus on the row layout.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { AdminUserListItem } from '@app/api-client-ts';
import AdminUserRow from '../AdminUserRow.vue';

function stubLocale(locale: string): void {
  vi.stubGlobal('useI18n', () => ({ locale: { value: locale } }));
}

beforeEach(() => {
  stubLocale('en');
});

vi.mock('../AdminRoleChip.vue', () => ({
  default: {
    name: 'AdminRoleChip',
    props: [
      'role',
      'banned',
      'editable',
      'labelAdmin',
      'labelUser',
      'labelGuest',
      'labelDisabled',
      'tooltipSelf',
    ],
    emits: ['change'],
    template: '<span class="stub-role-chip">{{ role }}</span>',
  },
}));

vi.mock('@app/ui', () => ({
  IconCS: {
    name: 'IconCS',
    props: ['name', 'size'],
    template: '<svg class="stub-icon" :data-name="name" />',
  },
  AppIconButton: {
    name: 'AppIconButton',
    props: ['name', 'ariaLabel', 'variant', 'size', 'disabled'],
    emits: ['click'],
    template: '<button :aria-label="ariaLabel" @click="$emit(\'click\')" />',
  },
}));

const baseUser: AdminUserListItem = {
  id: 'user-abc',
  email: 'alice@example.com',
  name: 'Alice Smith',
  displayName: 'Alice',
  role: 'user',
  banned: false,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

const baseProps = {
  user: baseUser,
  isSelf: false,
  labelAdmin: 'Admin',
  labelUser: 'User',
  labelGuest: 'Guest',
  labelDisabled: 'Disabled',
  roleChangeYourselfTooltip: "You can't change your own role.",
  editAriaLabel: 'Edit user — coming soon',
  moreAriaLabel: 'More options — coming soon',
};

describe('AdminUserRow', () => {
  it('renders user display name', () => {
    const w = mount(AdminUserRow, { props: baseProps });
    expect(w.text()).toContain('Alice');
  });

  it('renders user email', () => {
    const w = mount(AdminUserRow, { props: baseProps });
    expect(w.text()).toContain('alice@example.com');
  });

  it('renders joined date formatted as "Jan 15"', () => {
    const w = mount(AdminUserRow, { props: baseProps });
    expect(w.text()).toContain('Jan 15');
  });

  // Regression guard: the joined date used to be hardcoded to 'en-US',
  // showing an English date on the Russian locale.
  it('renders the joined date in the active locale, not hardcoded en-US', () => {
    stubLocale('ru');
    const w = mount(AdminUserRow, { props: baseProps });
    expect(w.text()).toContain('янв');
    expect(w.text()).not.toContain('Jan');
  });

  it('renders fallback to name when displayName is null', () => {
    const w = mount(AdminUserRow, {
      props: { ...baseProps, user: { ...baseUser, displayName: null } },
    });
    expect(w.text()).toContain('Alice Smith');
  });

  it('passes editable=false to chip when isSelf is true', () => {
    const w = mount(AdminUserRow, {
      props: { ...baseProps, isSelf: true },
    });
    const chipComponent = w.findComponent({ name: 'AdminRoleChip' });
    expect(chipComponent.props('editable')).toBe(false);
  });

  it('passes editable=true to chip when isSelf is false', () => {
    const w = mount(AdminUserRow, { props: baseProps });
    const chipComponent = w.findComponent({ name: 'AdminRoleChip' });
    expect(chipComponent.props('editable')).toBe(true);
  });

  // Regression guard for #619: the permissions picker page passes
  // `rolesEditable=false` because roles are changed on /admin/users, not
  // here. The chip must stay read-only regardless of `isSelf`, and show the
  // read-only tooltip rather than the self-protect one.
  it('passes editable=false to chip when rolesEditable is false, even for another user', () => {
    const w = mount(AdminUserRow, {
      props: { ...baseProps, isSelf: false, rolesEditable: false, roleReadOnlyTooltip: 'ro-tip' },
    });
    const chipComponent = w.findComponent({ name: 'AdminRoleChip' });
    expect(chipComponent.props('editable')).toBe(false);
    expect(chipComponent.props('tooltipSelf')).toBe('ro-tip');
  });

  it('prefers the self tooltip over the read-only tooltip when both apply', () => {
    const w = mount(AdminUserRow, {
      props: {
        ...baseProps,
        isSelf: true,
        rolesEditable: false,
        roleReadOnlyTooltip: 'ro-tip',
      },
    });
    const chipComponent = w.findComponent({ name: 'AdminRoleChip' });
    expect(chipComponent.props('tooltipSelf')).toBe(baseProps.roleChangeYourselfTooltip);
  });

  it('emits edit when Edit button is clicked', async () => {
    const w = mount(AdminUserRow, { props: baseProps });
    await w.find(`[aria-label="${baseProps.editAriaLabel}"]`).trigger('click');
    expect(w.emitted('edit')).toBeTruthy();
  });

  it('emits more when More button is clicked', async () => {
    const w = mount(AdminUserRow, { props: baseProps });
    await w.find(`[aria-label="${baseProps.moreAriaLabel}"]`).trigger('click');
    expect(w.emitted('more')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const w = mount(AdminUserRow, { props: baseProps });
    expect(w.html()).toMatchSnapshot();
  });

  // Regression guard for #569: the avatar background used to be a private
  // hex literal picked from a local array duplicated in this file and
  // admin/permissions/[userId].vue. It must now resolve through the shared
  // `avatar-color.ts` util to a `--avatar-*` design token, never a raw hex.
  it('sets the avatar background to an --avatar-* token, not a hex literal', () => {
    const w = mount(AdminUserRow, { props: baseProps });
    const style = w.find('.adm-user-row__avatar').attributes('style') ?? '';
    expect(style).toMatch(/var\(--avatar-[a-z-]+\)/);
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });
});
