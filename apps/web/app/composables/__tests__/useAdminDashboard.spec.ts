/**
 * Unit tests for useAdminDashboard composable.
 *
 * Mocks @app/api-client-ts so no real HTTP occurs.
 * useAsyncData is stubbed as a global that calls the handler immediately
 * and synchronously returns reactive refs — matching what Nuxt does at
 * runtime for the SPA (ssr: false) path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { AdminDashboardDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetAdminDashboard = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  getAdminDashboard: (...args: unknown[]) => mockGetAdminDashboard(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful fetch', async () => {
    const mockData: AdminDashboardDto = {
      generatedAt: '2026-01-01T00:00:00Z',
      counts: { libraries: 3, users: 10, courses: 50, lessons: 200 },
      latestScan: null,
      errorsLast24h: 0,
    };
    mockGetAdminDashboard.mockResolvedValueOnce({
      data: mockData,
      error: null,
      response: { status: 200 },
    });

    // Shim useAsyncData inline: runs handler immediately and returns refs.
    // The composable calls useAsyncData synchronously — we return a
    // resolved-promise-wrapped object so the handler result lands in data.
    const dataRef = ref<AdminDashboardDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<AdminDashboardDto>) => {
      try {
        dataRef.value = await handler();
        statusRef.value = 'success';
      } catch (error_) {
        errorRef.value = error_ as Error;
        statusRef.value = 'error';
      }
      return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
    });

    const { useAdminDashboard } = await import('../useAdminDashboard');
    const result = useAdminDashboard();

    // Wait for the async useAsyncData shim to complete
    await new Promise((r) => setTimeout(r, 0));

    const { data, status, error } = await (result as unknown as Promise<typeof result>);
    void data;
    void status;
    void error;

    expect(statusRef.value).toBe('success');
    expect(errorRef.value).toBeNull();
    expect(dataRef.value?.counts.libraries).toBe(3);
  });

  it('sets error status on API failure', async () => {
    mockGetAdminDashboard.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Unauthorized' },
      response: { status: 401 },
    });

    const dataRef = ref<AdminDashboardDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<AdminDashboardDto>) => {
      try {
        dataRef.value = await handler();
        statusRef.value = 'success';
      } catch (error) {
        errorRef.value = error as Error;
        statusRef.value = 'error';
      }
      return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
    });

    const { useAdminDashboard } = await import('../useAdminDashboard');
    useAdminDashboard();

    // Wait for async shim
    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('error');
    expect(errorRef.value).not.toBeNull();
    // HttpStatusError carries the httpStatus from res.response.status
    // errorStatus is a computed over error.value
    const errVal = errorRef.value as Error & { httpStatus?: number };
    expect(errVal.httpStatus).toBe(401);
  });
});
