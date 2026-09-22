/**
 * Unit tests for useAdminScrapers composable.
 *
 * Mocks @app/api-client-ts so no real HTTP occurs.
 * useAsyncData is stubbed as a global that calls the handler immediately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import type { ScraperListDto } from '@app/api-client-ts';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockListScrapers = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  listScrapers: (...args: unknown[]) => mockListScrapers(...args),
  client: {},
}));

vi.mock('#imports', () => ({ ref, computed }));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAdminScrapers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful fetch, rejected scrapers included', async () => {
    const mockData: ScraperListDto = {
      scrapers: [
        {
          id: 'youtube',
          supportedKinds: ['url', 'name', 'fragment'],
          configured: true,
          origin: 'built-in',
          loadError: null,
        },
        {
          id: 'acme-academy',
          supportedKinds: [],
          configured: false,
          origin: 'definition-file',
          loadError: 'selector "title" did not match "$.selectors.title": required property',
        },
      ],
    };
    mockListScrapers.mockResolvedValueOnce({
      data: mockData,
      error: null,
      response: { status: 200 },
    });

    const dataRef = ref<ScraperListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<ScraperListDto>) => {
      try {
        dataRef.value = await handler();
        statusRef.value = 'success';
      } catch (error) {
        errorRef.value = error as Error;
        statusRef.value = 'error';
      }
      return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
    });

    const { useAdminScrapers } = await import('../useAdminScrapers');
    useAdminScrapers();

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('success');
    expect(errorRef.value).toBeNull();
    expect(dataRef.value?.scrapers).toHaveLength(2);
    expect(dataRef.value?.scrapers.at(1)?.loadError).toContain('did not match');
  });

  it('sets error status on API failure (403)', async () => {
    mockListScrapers.mockResolvedValueOnce({
      data: null,
      error: { detail: 'Forbidden' },
      response: { status: 403 },
    });

    const dataRef = ref<ScraperListDto | undefined>(undefined);
    const errorRef = ref<Error | null>(null);
    const statusRef = ref<string>('pending');
    const refreshMock = vi.fn();

    vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<ScraperListDto>) => {
      try {
        dataRef.value = await handler();
        statusRef.value = 'success';
      } catch (error) {
        errorRef.value = error as Error;
        statusRef.value = 'error';
      }
      return { data: dataRef, error: errorRef, status: statusRef, refresh: refreshMock };
    });

    const { useAdminScrapers } = await import('../useAdminScrapers');
    useAdminScrapers();

    await new Promise((r) => setTimeout(r, 0));

    expect(statusRef.value).toBe('error');
    expect(errorRef.value).not.toBeNull();
    const errVal = errorRef.value as Error & { httpStatus?: number };
    expect(errVal.httpStatus).toBe(403);
  });
});
