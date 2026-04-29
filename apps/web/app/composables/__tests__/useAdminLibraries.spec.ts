/**
 * Unit tests for useAdminLibraries composable.
 *
 * Mocks @app/api-client-ts so no real HTTP occurs.
 * useAsyncData is stubbed as a global that calls the handler immediately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { AdminLibraryListDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockListAdminLibraries = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  listAdminLibraries: (...args: unknown[]) => mockListAdminLibraries(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAdminLibraries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful fetch', async () => {
    const mockData: AdminLibraryListDto = {
      items: [
        {
          id: 'lib-1',
          name: 'Computer Science',
          rootPath: '/srv/courses/cs',
          coursesCount: 12,
          lessonsCount: 144,
          lastScan: null,
        },
      ],
    };
    mockListAdminLibraries.mockResolvedValueOnce({
      data: mockData,
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<AdminLibraryListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AdminLibraryListDto>) => {
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

    const { useAdminLibraries } = await import('../useAdminLibraries');
    useAdminLibraries();

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('success');
    expect(errorRef.value).toBeNull();
    expect(dataRef.value?.items).toHaveLength(1);
    expect(dataRef.value?.items.at(0)?.name).toBe('Computer Science');
  });

  it('sets error status on API failure (401)', async () => {
    mockListAdminLibraries.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Unauthorized' },
      response: { status: 401 },
    });

    const dataRef = ref<AdminLibraryListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal(
      'useAsyncData',
      async (_key: unknown, handler: () => Promise<AdminLibraryListDto>) => {
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

    const { useAdminLibraries } = await import('../useAdminLibraries');
    useAdminLibraries();

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('error');
    expect(errorRef.value).not.toBeNull();
    const errVal = errorRef.value as Error & { httpStatus?: number };
    expect(errVal.httpStatus).toBe(401);
  });
});
