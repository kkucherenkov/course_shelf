/**
 * Spec for apps/web/app/pages/admin/permissions/index.vue.
 *
 * Regression guard for #619: the role chip silently swallowed a role
 * selection (`@role-change="() => {}"`), the "More" button did nothing
 * (`@more="() => {}"`), and the Edit button's accessible name lied about
 * what it does (`addGrantCta` → "Add grant", when it only navigates to the
 * user's permissions page). Roles are changed on /admin/users, so this page
 * must render the chip read-only rather than pretend to accept an edit.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import type { AdminUserListDto, AdminUserListItem } from '@app/api-client-ts';

const { toastAdd, navigateToMock } = vi.hoisted(() => ({
  toastAdd: vi.fn(),
  navigateToMock: vi.fn(),
}));

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key, locale: { value: 'en' } }));
vi.stubGlobal('useToast', () => ({ add: toastAdd }));
vi.mock('#imports', () => ({ navigateTo: navigateToMock }));

vi.mock('@app/ui', () => ({
  AppBanner: { name: 'AppBanner', props: ['variant', 'title', 'body'], template: '<div />' },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'variant', 'size'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>',
  },
  AppEmptyState: { name: 'AppEmptyState', props: ['icon', 'title'], template: '<div />' },
  IconCS: { name: 'IconCS', props: ['name'], template: '<svg />' },
}));

vi.mock('~/components/admin/AdminUserRow.vue', () => ({
  default: {
    name: 'AdminUserRow',
    props: [
      'user',
      'isSelf',
      'labelAdmin',
      'labelUser',
      'labelGuest',
      'labelDisabled',
      'roleChangeYourselfTooltip',
      'rolesEditable',
      'roleReadOnlyTooltip',
      'editAriaLabel',
      'moreAriaLabel',
    ],
    emits: ['roleChange', 'edit', 'more'],
    template: '<div />',
  },
}));

const user: AdminUserListItem = {
  id: 'user-1',
  name: 'Jane Doe',
  displayName: null,
  email: 'jane@example.com',
  role: 'user',
  banned: false,
  createdAt: '2026-01-01T00:00:00Z',
} as AdminUserListItem;

const listData: AdminUserListDto = { items: [user] } as AdminUserListDto;

vi.mock('~/composables/useAdminUsers', () => ({
  useAdminUsers: () => ({
    data: ref(listData),
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
}));

import PermissionsPicker from '../admin/permissions/index.vue';

function mountPage() {
  return mount(PermissionsPicker);
}

describe('admin/permissions/index.vue', () => {
  beforeEach(() => {
    toastAdd.mockClear();
    navigateToMock.mockClear();
  });

  it('renders the role chip as read-only, not editable', () => {
    const w = mountPage();
    const row = w.findComponent({ name: 'AdminUserRow' });
    expect(row.props('rolesEditable')).toBe(false);
  });

  it('gives the Edit button an accessible name for what it actually does', () => {
    const w = mountPage();
    const row = w.findComponent({ name: 'AdminUserRow' });
    // Reused from pages.admin.users.editPermissions — not the dishonest
    // "Add grant" (pages.admin.permissions.addGrantCta), which this button
    // never does; it only navigates to the user's permissions page.
    expect(row.props('editAriaLabel')).toBe('pages.admin.users.editPermissions');
  });

  it('navigates to the user detail page on edit', () => {
    const w = mountPage();
    const row = w.findComponent({ name: 'AdminUserRow' });
    row.vm.$emit('edit');
    expect(navigateToMock).toHaveBeenCalledWith('/admin/permissions/user-1');
  });

  it('gives feedback instead of silently doing nothing when More is clicked', () => {
    const w = mountPage();
    const row = w.findComponent({ name: 'AdminUserRow' });
    row.vm.$emit('more');
    expect(toastAdd).toHaveBeenCalledWith({ title: 'pages.admin.users.moreComingSoon' });
  });
});
