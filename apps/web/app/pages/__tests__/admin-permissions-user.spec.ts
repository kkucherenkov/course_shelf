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
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
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

vi.mock('~/composables/useAccessGrants', () => ({
  useAccessGrants: () => ({
    data: ref([courseGrant]),
    status: ref('success'),
    grantedLibraries: ref(new Set<string>()),
    grantedCourses: ref(new Map([['course-1', courseGrant]])),
    refetch: vi.fn(),
    grant: vi.fn(),
    revoke: vi.fn(),
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
  const wrapper = mount(mod.default, { global: { stubs: { UButton: true } } });
  await flushPromises();
  return wrapper;
}

describe('admin permissions user page', () => {
  beforeEach(() => {
    mockGetCourse.mockReset();
    mockListCourses.mockReset();
    mockGetCourse.mockResolvedValue({
      data: { id: 'course-1', libraryId: 'lib-a' },
      error: null,
      response: { status: 200 },
    });
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
});
