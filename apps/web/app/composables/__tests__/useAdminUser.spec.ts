/**
 * Unit tests for useAdminUser composable.
 *
 * Mocks @app/api-client-ts so no real HTTP occurs.
 * useAsyncData is stubbed as a global that calls the handler immediately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { AdminUserListItem } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetAdminUser = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  getAdminUser: (...args: unknown[]) => mockGetAdminUser(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserItem(overrides: Partial<AdminUserListItem> = {}): AdminUserListItem {
  return {
    id: 'u1',
    email: 'alice@example.com',
    name: 'Alice',
    displayName: null,
    role: 'user',
    banned: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns data on successful fetch', async () => {
    const userData = makeUserItem();
    mockGetAdminUser.mockResolvedValueOnce({
      data: userData,
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AdminUserListItem | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AdminUserListItem>) => {
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
    const { useAdminUser } = await import('../useAdminUser');
    useAdminUser(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('success');
    expect(errorRef.value).toBeNull();
    expect(dataRef.value?.id).toBe('u1');
    expect(dataRef.value?.email).toBe('alice@example.com');
  });

  it('passes userId to the API call', async () => {
    mockGetAdminUser.mockResolvedValueOnce({
      data: makeUserItem({ id: 'u42' }),
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AdminUserListItem | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AdminUserListItem>) => {
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
    const { useAdminUser } = await import('../useAdminUser');
    useAdminUser(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(mockGetAdminUser).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.objectContaining({ id: 'u42' }) }),
    );
  });

  it('sets errorStatus to 404 when user not found', async () => {
    mockGetAdminUser.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Not found' },
      response: { status: 404 },
    });

    const dataRef = ref<AdminUserListItem | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    // Synchronous-returning stub so error ref is available when the composable's
    // computed is first evaluated (async stub returns a Promise which destructures to undefined).
    vi.stubGlobal('useAsyncData', (_key: unknown, handler: () => Promise<AdminUserListItem>) => {
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
    const { useAdminUser } = await import('../useAdminUser');
    const result = useAdminUser(userIdRef);

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('error');
    const errVal = errorRef.value as Error & { httpStatus?: number };
    expect(errVal.httpStatus).toBe(404);
    expect(result.errorStatus.value).toBe(404);
  });
});
