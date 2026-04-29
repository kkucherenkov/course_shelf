/**
 * Unit tests for useAdminUsers composable.
 *
 * Mocks @app/api-client-ts so no real HTTP occurs.
 * useAsyncData is stubbed as a global that calls the handler immediately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { AdminUserListDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockListAdminUsers = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  listAdminUsers: (...args: unknown[]) => mockListAdminUsers(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful fetch', async () => {
    const mockData: AdminUserListDto = {
      items: [
        {
          id: 'u1',
          email: 'alice@example.com',
          name: 'Alice',
          displayName: null,
          role: 'user',
          banned: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    };
    mockListAdminUsers.mockResolvedValueOnce({
      data: mockData,
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AdminUserListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AdminUserListDto>) => {
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

    const search = ref('');
    const { useAdminUsers } = await import('../useAdminUsers');
    useAdminUsers(search);

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('success');
    expect(errorRef.value).toBeNull();
    expect(dataRef.value?.items).toHaveLength(1);
    expect(dataRef.value?.items.at(0)?.email).toBe('alice@example.com');
  });

  it('passes search query to the API call', async () => {
    mockListAdminUsers.mockResolvedValueOnce({
      data: { items: [] },
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AdminUserListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AdminUserListDto>) => {
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

    const search = ref('alice');
    const { useAdminUsers } = await import('../useAdminUsers');
    useAdminUsers(search);

    await new Promise((r) => setTimeout(r, 0));

    expect(mockListAdminUsers).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ search: 'alice' }) }),
    );
  });

  it('sets error status on API failure (403)', async () => {
    mockListAdminUsers.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Forbidden' },
      response: { status: 403 },
    });

    const dataRef = ref<AdminUserListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AdminUserListDto>) => {
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

    const search = ref('');
    const { useAdminUsers } = await import('../useAdminUsers');
    useAdminUsers(search);

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('error');
    const errVal = errorRef.value as Error & { httpStatus?: number };
    expect(errVal.httpStatus).toBe(403);
  });
});
