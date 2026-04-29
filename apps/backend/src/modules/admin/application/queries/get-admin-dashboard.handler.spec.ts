import { describe, it, expect, vi } from 'vitest';

import { GetAdminDashboardHandler } from './get-admin-dashboard.handler';
import { GetAdminDashboardQuery } from './get-admin-dashboard.query';
import { DASHBOARD_PORT } from '../../domain/dashboard.port';

import type { DashboardPort, DashboardSnapshot } from '../../domain/dashboard.port';
import type { AdminDashboardLatestScan } from '@app/api-client-ts';

function makePort(overrides: Partial<DashboardSnapshot> = {}): DashboardPort {
  const snapshot: DashboardSnapshot = {
    counts: {
      libraries: overrides.counts?.libraries ?? 0,
      users: overrides.counts?.users ?? 0,
      courses: overrides.counts?.courses ?? 0,
      lessons: overrides.counts?.lessons ?? 0,
    },
    latestScan: overrides.latestScan === undefined ? null : overrides.latestScan,
    errorsLast24h: overrides.errorsLast24h ?? 0,
  };
  return {
    getSnapshot: vi.fn().mockResolvedValue(snapshot),
    hasAnyUser: vi.fn(),
    listRecentScans: vi.fn(),
    listAllLibrariesWithCounts: vi.fn(),
    listUsers: vi.fn(),
    findUserById: vi.fn(),
    updateUser: vi.fn(),
  };
}

function makeHandler(port: DashboardPort): GetAdminDashboardHandler {
  // Bypass NestJS DI — inject port directly using the constructor parameter.
  // The @Inject decorator is metadata-only and does not affect JS runtime.
  return new (GetAdminDashboardHandler as unknown as new (
    p: DashboardPort,
  ) => GetAdminDashboardHandler)(port);
}

describe('GetAdminDashboardHandler', () => {
  it('assembles a populated snapshot from the port', async () => {
    const startedAt = '2026-04-27T09:55:00.000Z';
    const finishedAt = '2026-04-27T09:58:12.000Z';
    const latestScan: AdminDashboardLatestScan = {
      scanId: 'scan-1',
      libraryId: 'lib-1',
      status: 'succeeded',
      startedAt,
      finishedAt,
      filesScanned: 312,
      errorsCount: 2,
    };

    const port = makePort({
      counts: { libraries: 1, users: 2, courses: 7, lessons: 184 },
      latestScan,
      errorsLast24h: 2,
    });

    const handler = makeHandler(port);
    const dto = await handler.execute(new GetAdminDashboardQuery());

    expect(dto.counts).toEqual({ libraries: 1, users: 2, courses: 7, lessons: 184 });
    expect(dto.latestScan).toEqual(latestScan);
    expect(dto.errorsLast24h).toBe(2);
    expect(typeof dto.generatedAt).toBe('string');
    expect(new Date(dto.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it('returns null latestScan when no scans exist', async () => {
    const port = makePort({ counts: { libraries: 0, users: 1, courses: 0, lessons: 0 } });
    const handler = makeHandler(port);
    const dto = await handler.execute(new GetAdminDashboardQuery());

    expect(dto.latestScan).toBeNull();
    expect(dto.counts).toEqual({ libraries: 0, users: 1, courses: 0, lessons: 0 });
    expect(dto.errorsLast24h).toBe(0);
  });

  it('finishedAt is null while scan is still running', async () => {
    const runningLatestScan: AdminDashboardLatestScan = {
      scanId: 'scan-2',
      libraryId: 'lib-1',
      status: 'running',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      filesScanned: 50,
      errorsCount: 0,
    };

    const port = makePort({ latestScan: runningLatestScan });
    const handler = makeHandler(port);
    const dto = await handler.execute(new GetAdminDashboardQuery());

    expect(dto.latestScan?.finishedAt).toBeNull();
    expect(dto.latestScan?.status).toBe('running');
  });

  it('delegates entirely to the port and stamps generatedAt independently', async () => {
    const getSnapshot = vi.fn().mockResolvedValue({
      counts: { libraries: 3, users: 10, courses: 5, lessons: 42 },
      latestScan: null,
      errorsLast24h: 7,
    });
    const port: DashboardPort = {
      getSnapshot,
      hasAnyUser: vi.fn(),
      listRecentScans: vi.fn(),
      listAllLibrariesWithCounts: vi.fn(),
      listUsers: vi.fn(),
      findUserById: vi.fn(),
      updateUser: vi.fn(),
    };
    const handler = makeHandler(port);

    const before = Date.now();
    const dto = await handler.execute(new GetAdminDashboardQuery());
    const after = Date.now();

    expect(getSnapshot).toHaveBeenCalledOnce();
    const generatedAtMs = new Date(dto.generatedAt).getTime();
    expect(generatedAtMs).toBeGreaterThanOrEqual(before);
    expect(generatedAtMs).toBeLessThanOrEqual(after);
    expect(dto.errorsLast24h).toBe(7);

    // Suppress unused-variable warning — DASHBOARD_PORT is imported to keep
    // the symbol visible in the module graph during testing.
    void DASHBOARD_PORT;
  });
});
