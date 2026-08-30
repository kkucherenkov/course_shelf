/**
 * Unit tests for useAdminBackup — the three states the Backups screen renders
 * (E31-F01-S02): in progress, ready, failed.
 *
 * The download URL is asserted, never followed: it points at a route that is
 * deliberately absent from the OpenAPI document (an opaque byte stream), and a
 * unit test that fetched it would be testing pg_dump, not this composable.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BackupCreatedDto } from '@app/api-client-ts';

const mockCreateBackup = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  createBackup: (...args: unknown[]) => mockCreateBackup(...args),
  client: {},
}));

const { useAdminBackup } = await import('../useAdminBackup');

const DTO: BackupCreatedDto = {
  id: '20260830T120000-abc',
  createdAt: '2026-08-30T12:00:00Z',
  sizeBytes: 1_048_576,
  url: '/api/v1/admin/backups/20260830T120000-abc/download?token=signed.token.here',
  token: 'signed.token.here',
  expiresAt: '2026-08-30T12:05:00Z',
};

describe('useAdminBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts idle with nothing to download', () => {
    const { status, backup, errorDetail } = useAdminBackup();
    expect(status.value).toBe('idle');
    expect(backup.value).toBeNull();
    expect(errorDetail.value).toBeNull();
  });

  it('reports pending while the dump is running', async () => {
    // Hold the request open so `pending` is observable.
    const inFlight = Promise.withResolvers<unknown>();
    mockCreateBackup.mockReturnValueOnce(inFlight.promise);

    const { status, create } = useAdminBackup();
    const pending = create();

    expect(status.value).toBe('pending');

    inFlight.resolve({ data: DTO, error: null, response: { status: 201 } });
    await pending;
    expect(status.value).toBe('success');
  });

  it('exposes the signed download URL on success — asserted, not followed', async () => {
    mockCreateBackup.mockResolvedValueOnce({ data: DTO, error: null, response: { status: 201 } });

    const { status, backup, create } = useAdminBackup();
    await create();

    expect(status.value).toBe('success');
    expect(backup.value?.url).toBe(DTO.url);
    expect(backup.value?.sizeBytes).toBe(1_048_576);
    expect(backup.value?.expiresAt).toBe(DTO.expiresAt);
    expect(mockCreateBackup).toHaveBeenCalledOnce();
  });

  it('surfaces the server problem detail on failure', async () => {
    mockCreateBackup.mockResolvedValueOnce({
      data: null,
      error: {
        type: 'about:blank',
        title: 'Service Unavailable',
        status: 503,
        detail: 'pg_dump 17.6 cannot dump PostgreSQL server 18.1 — the client major must match.',
      },
      response: { status: 503 },
    });

    const { status, errorDetail, backup, create } = useAdminBackup();
    await create();

    expect(status.value).toBe('error');
    expect(errorDetail.value).toContain('pg_dump 17.6');
    expect(backup.value).toBeNull();
  });

  it('falls back to the problem title when there is no detail', async () => {
    mockCreateBackup.mockResolvedValueOnce({
      data: null,
      error: { type: 'about:blank', title: 'Forbidden', status: 403 },
      response: { status: 403 },
    });

    const { errorDetail, create } = useAdminBackup();
    await create();

    expect(errorDetail.value).toBe('Forbidden');
  });

  it('reports a network failure as an error rather than throwing', async () => {
    mockCreateBackup.mockRejectedValueOnce(new Error('Failed to fetch'));

    const { status, errorDetail, create } = useAdminBackup();
    await expect(create()).resolves.toBeUndefined();

    expect(status.value).toBe('error');
    expect(errorDetail.value).toBe('Failed to fetch');
  });

  it('clears a previous failure when a retry starts', async () => {
    mockCreateBackup.mockResolvedValueOnce({
      data: null,
      error: { detail: 'boom' },
      response: { status: 503 },
    });
    mockCreateBackup.mockResolvedValueOnce({ data: DTO, error: null, response: { status: 201 } });

    const { status, errorDetail, create } = useAdminBackup();
    await create();
    expect(errorDetail.value).toBe('boom');

    await create();
    expect(status.value).toBe('success');
    expect(errorDetail.value).toBeNull();
  });

  it('ignores a second click while a dump is already running', async () => {
    const inFlight = Promise.withResolvers<unknown>();
    mockCreateBackup.mockReturnValueOnce(inFlight.promise);

    const { create } = useAdminBackup();
    const first = create();
    await create();

    expect(mockCreateBackup).toHaveBeenCalledOnce();
    inFlight.resolve({ data: DTO, error: null, response: { status: 201 } });
    await first;
  });
});
