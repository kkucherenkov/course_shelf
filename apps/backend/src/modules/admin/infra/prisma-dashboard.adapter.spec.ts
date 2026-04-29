import { describe, it, expect, vi } from 'vitest';

import { PrismaDashboardAdapter } from './prisma-dashboard.adapter';

import type { PrismaService } from '../../../common/prisma/prisma.service';

function makePrisma(overrides: Partial<PrismaService['user']> = {}): PrismaService {
  return {
    user: {
      count: vi.fn(),
      ...overrides,
    },
  } as unknown as PrismaService;
}

describe('PrismaDashboardAdapter.hasAnyUser', () => {
  it('returns false when count is 0', async () => {
    const prisma = makePrisma({ count: vi.fn().mockResolvedValue(0) });
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.hasAnyUser();

    expect(result).toBe(false);
    expect(prisma.user.count).toHaveBeenCalledWith({ take: 1 });
  });

  it('returns true when count is 1', async () => {
    const prisma = makePrisma({ count: vi.fn().mockResolvedValue(1) });
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.hasAnyUser();

    expect(result).toBe(true);
    expect(prisma.user.count).toHaveBeenCalledWith({ take: 1 });
  });
});

// ---------------------------------------------------------------------------
// listRecentScans
// ---------------------------------------------------------------------------

interface ScanRow {
  id: string;
  libraryId: string;
  status: 'running' | 'succeeded' | 'failed' | 'cancelled';
  startedAt: Date;
  finishedAt: Date | null;
  filesScanned: number;
  _count: { errors: number };
}

function makeScanPrisma(
  scanRows: ScanRow[],
  libraryRows: { id: string; name: string }[],
  courseCounts: number[],
): PrismaService {
  let courseCountCallIndex = 0;
  return {
    scan: {
      findMany: vi.fn().mockResolvedValue(scanRows),
    },
    library: {
      findMany: vi.fn().mockResolvedValue(libraryRows),
    },
    course: {
      count: vi
        .fn()
        .mockImplementation(() => Promise.resolve(courseCounts[courseCountCallIndex++] ?? 0)),
    },
  } as unknown as PrismaService;
}

describe('PrismaDashboardAdapter.listRecentScans', () => {
  it('returns empty array when no scans exist', async () => {
    const prisma = makeScanPrisma([], [], []);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listRecentScans(20);

    expect(result).toEqual([]);
    expect(prisma.scan.findMany).toHaveBeenCalledWith({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: { _count: { select: { errors: true } } },
    });
    // library and course should not be queried when no scans
    expect(prisma.library.findMany).not.toHaveBeenCalled();
    expect(prisma.course.count).not.toHaveBeenCalled();
  });

  it('maps scan rows to AdminScanListItem shape with libraryName and coursesAdded', async () => {
    const startedAt = new Date('2026-04-27T09:55:00.000Z');
    const finishedAt = new Date('2026-04-27T09:58:12.000Z');
    const scanRows: ScanRow[] = [
      {
        id: 'scan-1',
        libraryId: 'lib-1',
        status: 'succeeded',
        startedAt,
        finishedAt,
        filesScanned: 312,
        _count: { errors: 2 },
      },
    ];
    const prisma = makeScanPrisma(scanRows, [{ id: 'lib-1', name: 'Mathematics' }], [4]);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listRecentScans(10);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'Mathematics',
      status: 'succeeded',
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      filesScanned: 312,
      coursesAdded: 4,
      errorsCount: 2,
    });
  });

  it('sets finishedAt to null for running scan', async () => {
    const startedAt = new Date('2026-04-27T10:25:00.000Z');
    const scanRows: ScanRow[] = [
      {
        id: 'scan-2',
        libraryId: 'lib-1',
        status: 'running',
        startedAt,
        finishedAt: null,
        filesScanned: 412,
        _count: { errors: 0 },
      },
    ];
    const prisma = makeScanPrisma(scanRows, [{ id: 'lib-1', name: 'Computer Science' }], [2]);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listRecentScans(5);

    expect(result[0].finishedAt).toBeNull();
    expect(result[0].status).toBe('running');
    expect(result[0].libraryName).toBe('Computer Science');
  });

  it('fetches library names in a single batched query using distinct ids', async () => {
    const t1 = new Date('2026-04-27T10:00:00.000Z');
    const t2 = new Date('2026-04-27T09:00:00.000Z');
    const scanRows: ScanRow[] = [
      {
        id: 'scan-a',
        libraryId: 'lib-1',
        status: 'succeeded',
        startedAt: t1,
        finishedAt: t1,
        filesScanned: 1,
        _count: { errors: 0 },
      },
      {
        id: 'scan-b',
        libraryId: 'lib-1',
        status: 'succeeded',
        startedAt: t2,
        finishedAt: t2,
        filesScanned: 1,
        _count: { errors: 0 },
      },
    ];
    const prisma = makeScanPrisma(scanRows, [{ id: 'lib-1', name: 'Shared Library' }], [1, 0]);
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listRecentScans(10);

    // library.findMany should be called exactly once with the deduplicated id
    expect(prisma.library.findMany).toHaveBeenCalledOnce();
    expect(prisma.library.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['lib-1'] } },
      select: { id: true, name: true },
    });
  });

  it('passes correct ordering and take to scan.findMany', async () => {
    const prisma = makeScanPrisma([], [], []);
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listRecentScans(5);

    expect(prisma.scan.findMany).toHaveBeenCalledWith({
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { _count: { select: { errors: true } } },
    });
  });

  it('counts courses per scan with correct libraryId and time window', async () => {
    const startedAt = new Date('2026-04-27T09:55:00.000Z');
    const finishedAt = new Date('2026-04-27T09:58:12.000Z');
    const scanRows: ScanRow[] = [
      {
        id: 'scan-1',
        libraryId: 'lib-42',
        status: 'succeeded',
        startedAt,
        finishedAt,
        filesScanned: 10,
        _count: { errors: 0 },
      },
    ];
    const courseCountMock = vi.fn().mockResolvedValue(3);
    const prisma = {
      scan: { findMany: vi.fn().mockResolvedValue(scanRows) },
      library: { findMany: vi.fn().mockResolvedValue([{ id: 'lib-42', name: 'Lib' }]) },
      course: { count: courseCountMock },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listRecentScans(10);

    expect(courseCountMock).toHaveBeenCalledOnce();
    expect(courseCountMock).toHaveBeenCalledWith({
      where: {
        libraryId: 'lib-42',
        createdAt: { gte: startedAt, lte: finishedAt },
      },
    });
    expect(result[0].coursesAdded).toBe(3);
  });
});
