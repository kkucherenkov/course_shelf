/**
 * Unit tests for useAccessGrants composable.
 *
 * Mocks @app/api-client-ts so no real HTTP occurs.
 * useAsyncData is stubbed as a global that calls the handler immediately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { AccessGrantListDto, AccessGrantDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockListGrantsByUser = vi.fn();
const mockRegisterGrant = vi.fn();
const mockRevokeGrant = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  listGrantsByUser: (...args: unknown[]) => mockListGrantsByUser(...args),
  registerGrant: (...args: unknown[]) => mockRegisterGrant(...args),
  revokeGrant: (...args: unknown[]) => mockRevokeGrant(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLibraryGrant(id: string, libraryId: string): AccessGrantDto {
  return {
    id,
    userId: 'u1',
    target: { kind: 'library', libraryId },
    level: 'READ',
    createdAt: '2025-01-01T00:00:00Z',
  };
}

function makeCourseGrant(id: string, courseId: string): AccessGrantDto {
  return {
    id,
    userId: 'u1',
    target: { kind: 'course', courseId },
    level: 'READ',
    createdAt: '2025-01-01T00:00:00Z',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAccessGrants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns grants on successful fetch', async () => {
    const mockData: AccessGrantListDto = {
      items: [makeLibraryGrant('g1', 'lib-1')],
    };
    mockListGrantsByUser.mockResolvedValueOnce({
      data: mockData,
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
        try {
          dataRef.value = await handler();
          statusRef.value = 'success';
        } catch (error) {
          errorRef.value = error as Error;
          statusRef.value = 'error';
        }
        return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
      },
    );

    const userIdRef = ref('u1');
    const { useAccessGrants } = await import('../useAccessGrants');
    useAccessGrants(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('success');
    expect(dataRef.value?.items).toHaveLength(1);
    expect(dataRef.value?.items.at(0)?.id).toBe('g1');
  });

  it('passes userId to the API call', async () => {
    mockListGrantsByUser.mockResolvedValueOnce({
      data: { items: [] },
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
        try {
          dataRef.value = await handler();
          statusRef.value = 'success';
        } catch (error) {
          errorRef.value = error as Error;
          statusRef.value = 'error';
        }
        return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
      },
    );

    const userIdRef = ref('u42');
    const { useAccessGrants } = await import('../useAccessGrants');
    useAccessGrants(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(mockListGrantsByUser).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ userId: 'u42' }) }),
    );
  });

  it('sets errorStatus on API failure', async () => {
    mockListGrantsByUser.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Forbidden' },
      response: { status: 403 },
    });

    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    // Synchronous-returning stub so errorRef is available for the composable's computed.
    vi.stubGlobal('useAsyncData', (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
      void handler()
        .then((v) => {
          dataRef.value = v;
          statusRef.value = 'success';
        })
        .catch((error: Error) => {
          errorRef.value = error;
          statusRef.value = 'error';
        });
      return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
    });

    const userIdRef = ref('u1');
    const { useAccessGrants } = await import('../useAccessGrants');
    const result = useAccessGrants(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('error');
    expect(result.errorStatus.value).toBe(403);
  });

  it('computes grantedLibraries from library-scope grants', async () => {
    const grantsData: AccessGrantListDto = {
      items: [
        makeLibraryGrant('g1', 'lib-1'),
        makeLibraryGrant('g2', 'lib-2'),
        makeCourseGrant('g3', 'course-1'),
      ],
    };

    // Use a synchronous-returning stub so `rawData` is available immediately
    // when the composable's computed refs are first evaluated.
    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal('useAsyncData', (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
      // Kick off the handler as a microtask so dataRef is populated.
      void handler().then((v) => {
        dataRef.value = v;
        statusRef.value = 'success';
      });
      return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
    });

    mockListGrantsByUser.mockResolvedValueOnce({
      data: grantsData,
      error: null,
      response: { status: 200 },
    });

    const userIdRef = ref('u1');
    const { useAccessGrants } = await import('../useAccessGrants');
    const result = useAccessGrants(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(result.grantedLibraries.value.has('lib-1')).toBe(true);
    expect(result.grantedLibraries.value.has('lib-2')).toBe(true);
    expect(result.grantedLibraries.value.has('lib-3')).toBe(false);
    // course grant should NOT appear in grantedLibraries
    expect(result.grantedLibraries.value.size).toBe(2);
  });

  it('computes grantedCourses from course-scope grants', async () => {
    const courseGrant = makeCourseGrant('g1', 'course-42');
    const grantsData: AccessGrantListDto = {
      items: [makeLibraryGrant('g0', 'lib-1'), courseGrant],
    };

    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal('useAsyncData', (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
      void handler().then((v) => {
        dataRef.value = v;
        statusRef.value = 'success';
      });
      return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
    });

    mockListGrantsByUser.mockResolvedValueOnce({
      data: grantsData,
      error: null,
      response: { status: 200 },
    });

    const userIdRef = ref('u1');
    const { useAccessGrants } = await import('../useAccessGrants');
    const result = useAccessGrants(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(result.grantedCourses.value.has('course-42')).toBe(true);
    expect(result.grantedCourses.value.get('course-42')?.id).toBe('g1');
    expect(result.grantedCourses.value.size).toBe(1);
  });

  it('grant() calls registerGrant with correct body', async () => {
    mockListGrantsByUser.mockResolvedValueOnce({
      data: { items: [] },
      error: null,
      response: { status: 200 },
    });
    mockRegisterGrant.mockResolvedValueOnce({
      data: makeLibraryGrant('new-g', 'lib-1'),
      error: null,
      response: { status: 201 },
    });

    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
        try {
          dataRef.value = await handler();
          statusRef.value = 'success';
        } catch (error) {
          errorRef.value = error as Error;
          statusRef.value = 'error';
        }
        return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
      },
    );

    const userIdRef = ref('u1');
    const { useAccessGrants } = await import('../useAccessGrants');
    const result = useAccessGrants(userIdRef);

    const err = await result.grant({ kind: 'library', libraryId: 'lib-1' });

    expect(err).toBeNull();
    expect(mockRegisterGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          userId: 'u1',
          level: 'READ',
          target: { kind: 'library', libraryId: 'lib-1' },
        }),
      }),
    );
  });

  it('revoke() calls revokeGrant with correct id', async () => {
    mockListGrantsByUser.mockResolvedValueOnce({
      data: { items: [] },
      error: null,
      response: { status: 200 },
    });
    mockRevokeGrant.mockResolvedValueOnce({
      data: null,
      error: null,
      response: { status: 204 },
    });

    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
        try {
          dataRef.value = await handler();
          statusRef.value = 'success';
        } catch (error) {
          errorRef.value = error as Error;
          statusRef.value = 'error';
        }
        return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
      },
    );

    const userIdRef = ref('u1');
    const { useAccessGrants } = await import('../useAccessGrants');
    const result = useAccessGrants(userIdRef);

    const err = await result.revoke('grant-99');

    expect(err).toBeNull();
    expect(mockRevokeGrant).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'grant-99' } }),
    );
  });

  it('grant() returns error when API fails', async () => {
    mockListGrantsByUser.mockResolvedValueOnce({
      data: { items: [] },
      error: null,
      response: { status: 200 },
    });
    mockRegisterGrant.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Conflict' },
      response: { status: 409 },
    });

    const dataRef = ref<AccessGrantListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AccessGrantListDto>) => {
        try {
          dataRef.value = await handler();
          statusRef.value = 'success';
        } catch (error) {
          errorRef.value = error as Error;
          statusRef.value = 'error';
        }
        return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
      },
    );

    const userIdRef = ref('u1');
    const { useAccessGrants } = await import('../useAccessGrants');
    const result = useAccessGrants(userIdRef);

    const err = await result.grant({ kind: 'library', libraryId: 'lib-1' });

    expect(err).not.toBeNull();
    const errWithStatus = err as Error & { httpStatus?: number };
    expect(errWithStatus.httpStatus).toBe(409);
  });
});
