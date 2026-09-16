/**
 * Spec for apps/web/app/pages/admin/permissions/[userId].vue.
 *
 * Covers #576: a course-scope grant must count toward its library's
 * overrides badge even when that library row has never been expanded —
 * `coursesByLibrary` (the lazy per-library course list) is expansion-gated,
 * `courseLibraryMap` (resolved via `getCourse`, one per granted course) is not.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';

import type { AccessGrantDto, AdminLibraryListDto, AdminUserListItem } from '@app/api-client-ts';

vi.stubGlobal('definePageMeta', () => undefined);
// `t` echoes the key, plus any interpolation values appended, so a test can
// assert both "the right key was used" and "the right value was passed" —
// e.g. the revoke dialog's `{ library, user }`.
vi.stubGlobal('useI18n', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? [key, ...Object.values(params)].join(' ') : key,
}));
vi.stubGlobal('useRoute', () => ({ params: { userId: 'user-1' } }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.mock('#imports', () => ({ navigateTo: vi.fn() }));

// ── Data composables ─────────────────────────────────────────────────────────
const user: AdminUserListItem = {
  id: 'user-1',
  name: 'Jane Doe',
  displayName: null,
  email: 'jane@example.com',
  role: 'user',
  banned: false,
  createdAt: '2026-01-01T00:00:00Z',
} as AdminUserListItem;

vi.mock('~/composables/useAdminUser', () => ({
  useAdminUser: () => ({
    data: ref(user),
    status: ref('success'),
    errorStatus: ref(null),
  }),
}));

const libraries: AdminLibraryListDto = {
  items: [
    { id: 'lib-a', name: 'Library A', coursesCount: 3, lessonsCount: 10 },
    { id: 'lib-b', name: 'Library B', coursesCount: 2, lessonsCount: 5 },
  ],
} as AdminLibraryListDto;

vi.mock('~/composables/useAdminLibraries', () => ({
  useAdminLibraries: () => ({
    data: ref(libraries),
    status: ref('success'),
    refetch: vi.fn(),
  }),
}));

// One course-scope grant, targeting a course that lives in lib-a — but lib-a
// is never expanded in this test, which is exactly the bug: the badge must
// still count it.
const courseGrant: AccessGrantDto = {
  id: 'grant-1',
  userId: 'user-1',
  target: { kind: 'course', courseId: 'course-1' },
  level: 'READ',
  createdAt: '2026-01-01T00:00:00Z',
} as AccessGrantDto;

const libraryGrant: AccessGrantDto = {
  id: 'grant-lib-a',
  userId: 'user-1',
  target: { kind: 'library', libraryId: 'lib-a' },
  level: 'READ',
  createdAt: '2026-01-01T00:00:00Z',
} as AccessGrantDto;

// Mutable per-test fixtures — reset in `beforeEach` below.
let grantsData: AccessGrantDto[] = [courseGrant];
let grantedLibraries = new Set<string>();
const grantMock = vi.fn().mockResolvedValue(null);
const revokeMock = vi.fn().mockResolvedValue(null);
const refetchGrantsMock = vi.fn();

vi.mock('~/composables/useAccessGrants', () => ({
  useAccessGrants: () => ({
    data: ref(grantsData),
    status: ref('success'),
    grantedLibraries: ref(grantedLibraries),
    grantedCourses: ref(new Map([['course-1', courseGrant]])),
    refetch: refetchGrantsMock,
    grant: grantMock,
    revoke: revokeMock,
  }),
}));

const mockGetCourse = vi.fn();
const mockListCourses = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  getCourse: (...args: unknown[]) => mockGetCourse(...args),
  listCourses: (...args: unknown[]) => mockListCourses(...args),
  client: {},
}));

// ── @app/ui + row stubs ──────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppBanner: { name: 'AppBanner', props: ['variant', 'body'], template: '<div />' },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'variant', 'size'],
    emits: ['click'],
    template:
      '<button class="stub-appbutton" @click="$emit(\'click\')">{{ label }}<slot /></button>',
  },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'size', 'title', 'description'],
    template:
      '<div v-if="open" class="stub-dialog">{{ title }} — {{ description }}<slot /><slot name="footer" /></div>',
  },
}));

vi.mock('~/components/admin/AdminRoleChip.vue', () => ({
  default: { name: 'AdminRoleChip', props: ['role', 'banned', 'editable'], template: '<span />' },
}));
vi.mock('~/components/admin/AdminPermissionRow.vue', () => ({
  default: {
    name: 'AdminPermissionRow',
    props: ['library', 'libraryGranted', 'overrides', 'expanded', 'courses'],
    template: '<div class="stub-perm-row" />',
  },
}));

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../admin/permissions/[userId].vue');
  const wrapper = mount(mod.default);
  await flushPromises();
  return wrapper;
}

describe('admin permissions user page', () => {
  beforeEach(() => {
    mockGetCourse.mockReset();
    mockListCourses.mockReset();
    mockGetCourse.mockResolvedValue({
      data: { id: 'course-1', libraryId: 'lib-a', title: 'Intro to Widgets' },
      error: null,
      response: { status: 200 },
    });
    grantsData = [courseGrant];
    grantedLibraries = new Set<string>();
    grantMock.mockClear().mockResolvedValue(null);
    revokeMock.mockClear().mockResolvedValue(null);
    refetchGrantsMock.mockClear();
  });

  it('counts a course-scope grant toward its library without expanding that library row', async () => {
    const wrapper = await mountPage();

    expect(mockGetCourse).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'course-1' } }),
    );
    // listCourses (the expansion-gated per-library fetch) must never fire —
    // the row was never expanded.
    expect(mockListCourses).not.toHaveBeenCalled();

    const rows = wrapper.findAllComponents({ name: 'AdminPermissionRow' });
    const libARow = rows.find((r) => (r.props('library') as { id: string }).id === 'lib-a');
    const libBRow = rows.find((r) => (r.props('library') as { id: string }).id === 'lib-b');
    expect(libARow?.props('overrides')).toHaveLength(1);
    expect(libBRow?.props('overrides')).toHaveLength(0);
  });

  // #599: both buttons only ever navigate back to the user picker — neither
  // retries a request nor adds a grant — so their label must name that
  // transition instead of reusing `errorRetry` / `addGrantCta`.
  it('labels the not-found and header buttons for the navigation they perform', async () => {
    const wrapper = await mountPage();

    const buttons = wrapper.findAll('.stub-appbutton');
    const backButton = buttons.find((b) => b.text() === 'pages.admin.permissions.backToUsersCta');
    expect(backButton).toBeTruthy();
    expect(buttons.some((b) => b.text() === 'pages.admin.permissions.addGrantCta')).toBe(false);
  });

  // #599: a granted course whose library lookup hasn't resolved yet must not
  // let the overrides badge silently render an undercount — the table stays
  // in its loading skeleton until every grant is resolved.
  it('keeps the table skeleton up while a granted course’s library is still resolving', async () => {
    mockGetCourse.mockImplementation(() => new Promise(() => undefined)); // never resolves
    const wrapper = await mountPage();

    expect(wrapper.find('.adm-perms__tbl-skel-row').exists()).toBe(true);
    expect(wrapper.findAllComponents({ name: 'AdminPermissionRow' })).toHaveLength(0);
  });

  // #606: revoking a library grant takes access away from someone else with
  // no undo — it must not fire on the toggle click alone.
  it('confirms before revoking a library grant, naming the library and the user', async () => {
    grantedLibraries = new Set(['lib-a']);
    grantsData = [courseGrant, libraryGrant];
    const wrapper = await mountPage();

    const libARow = wrapper
      .findAllComponents({ name: 'AdminPermissionRow' })
      .find((r) => (r.props('library') as { id: string }).id === 'lib-a');
    await libARow!.vm.$emit('set-library', { granted: false });

    expect(revokeMock).not.toHaveBeenCalled();
    const dialog = wrapper.find('.stub-dialog');
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain('Library A');
    expect(dialog.text()).toContain('Jane Doe');

    const confirmButton = wrapper
      .findAll('.stub-dialog button')
      .find((b) => b.text() === 'pages.admin.permissions.revokeDialogConfirm');
    await confirmButton!.trigger('click');

    expect(revokeMock).toHaveBeenCalledWith('grant-lib-a');
  });

  it('cancelling the revoke dialog leaves the grant untouched', async () => {
    grantedLibraries = new Set(['lib-a']);
    grantsData = [courseGrant, libraryGrant];
    const wrapper = await mountPage();

    const libARow = wrapper
      .findAllComponents({ name: 'AdminPermissionRow' })
      .find((r) => (r.props('library') as { id: string }).id === 'lib-a');
    await libARow!.vm.$emit('set-library', { granted: false });

    const cancelButton = wrapper
      .findAll('.stub-dialog button')
      .find((b) => b.text() === 'pages.admin.permissions.revokeDialogCancel');
    await cancelButton!.trigger('click');

    expect(revokeMock).not.toHaveBeenCalled();
    expect(wrapper.find('.stub-dialog').exists()).toBe(false);
  });

  // #633: course-scope revoke used to fire straight through — the same
  // "someone else's access, no undo" reasoning #606 gave the library row
  // applies unchanged to a course row; both must route through one dialog.
  it('confirms before revoking a course grant, naming the course and the user', async () => {
    const wrapper = await mountPage();

    const libARow = wrapper
      .findAllComponents({ name: 'AdminPermissionRow' })
      .find((r) => (r.props('library') as { id: string }).id === 'lib-a');
    await libARow!.vm.$emit('set-course', { courseId: 'course-1', granted: false });

    expect(revokeMock).not.toHaveBeenCalled();
    const dialog = wrapper.find('.stub-dialog');
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain('Intro to Widgets');
    expect(dialog.text()).toContain('Jane Doe');

    const confirmButton = wrapper
      .findAll('.stub-dialog button')
      .find((b) => b.text() === 'pages.admin.permissions.revokeDialogConfirm');
    await confirmButton!.trigger('click');

    expect(revokeMock).toHaveBeenCalledWith('grant-1');
  });

  it('cancelling a course revoke dialog leaves the grant untouched', async () => {
    const wrapper = await mountPage();

    const libARow = wrapper
      .findAllComponents({ name: 'AdminPermissionRow' })
      .find((r) => (r.props('library') as { id: string }).id === 'lib-a');
    await libARow!.vm.$emit('set-course', { courseId: 'course-1', granted: false });

    const cancelButton = wrapper
      .findAll('.stub-dialog button')
      .find((b) => b.text() === 'pages.admin.permissions.revokeDialogCancel');
    await cancelButton!.trigger('click');

    expect(revokeMock).not.toHaveBeenCalled();
    expect(wrapper.find('.stub-dialog').exists()).toBe(false);
  });
});
