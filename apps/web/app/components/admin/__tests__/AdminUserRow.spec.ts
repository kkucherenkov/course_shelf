/**
 * Spec for AdminUserRow component.
 *
 * Mocks AdminRoleChip to keep focus on the row layout.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { AdminUserListItem } from '@app/api-client-ts';
import AdminUserRow from '../AdminUserRow.vue';

vi.mock('../AdminRoleChip.vue', () => ({
  default: {
    name: 'AdminRoleChip',
    props: ['role', 'banned', 'editable', 'labelAdmin', 'labelUser', 'labelGuest', 'labelDisabled'],
    emits: ['change'],
    template: '<span class="stub-role-chip">{{ role }}</span>',
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

  it('emits edit when Edit button is clicked', async () => {
    const w = mount(AdminUserRow, { props: baseProps });
    const buttons = w.findAll('.adm-user-row__btn--icon');
    await buttons[0]!.trigger('click');
    expect(w.emitted('edit')).toBeTruthy();
  });

  it('emits more when More button is clicked', async () => {
    const w = mount(AdminUserRow, { props: baseProps });
    const buttons = w.findAll('.adm-user-row__btn--icon');
    await buttons[1]!.trigger('click');
    expect(w.emitted('more')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const w = mount(AdminUserRow, { props: baseProps });
    expect(w.html()).toMatchSnapshot();
  });
});
