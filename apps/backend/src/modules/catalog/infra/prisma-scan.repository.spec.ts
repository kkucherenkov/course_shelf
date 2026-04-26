/**
 * Unit tests for PrismaScanRepository. PrismaService is mocked at the class
 * level so no real DB connection is required. Tests cover:
 *   - save (upsert) then findById roundtrip returns equal-by-fields aggregate.
 *   - findLatestByLibrary returns the most-recent scan or null.
 *   - findRunningByLibrary returns null when none is running.
 *   - P2002 on discovered_file unique → wrapped as ScanInternalError (via generic DomainError check).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { Scan } from '../domain/scan/scan';
import { PrismaScanRepository } from './prisma-scan.repository';

import type { ScanId } from '../domain/scan/scan';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-26T00:00:00.000Z');

function makeScanRow(
  overrides: Partial<{
    id: string;
    libraryId: string;
    status: string;
    finishedAt: Date | null;
  }> = {},
) {
  return {
    id: overrides.id ?? 'scan-1',
    libraryId: overrides.libraryId ?? 'lib-1',
    status: overrides.status ?? 'succeeded',
    startedAt: NOW,
    finishedAt: overrides.finishedAt === undefined ? NOW : overrides.finishedAt,
    filesScanned: 3,
    filesAdded: 2,
    filesUpdated: 0,
    coursesDiscovered: 1,
    errors: [],
    discoveredFiles: [],
  };
}

interface ScanDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
}

interface ScanErrorDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface DiscoveredFileDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

function makePrisma() {
  const txMock = {
    scan: {
      upsert: vi.fn().mockResolvedValue(undefined),
    },
    scanErrorRecord: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    discoveredFile: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
  };

  return {
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<void>) => {
      await cb(txMock);
    }),
    _txMock: txMock,
    scan: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
    } as ScanDelegate,
    scanErrorRecord: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    } as ScanErrorDelegate,
    discoveredFile: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    } as DiscoveredFileDelegate,
  };
}

function makeAggregate(overrides: Partial<{ id: string; libraryId: string }> = {}): Scan {
  return Scan.start({
    id: overrides.id ?? 'scan-1',
    libraryId: overrides.libraryId ?? 'lib-1',
    now: NOW,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaScanRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaScanRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaScanRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  it('calls $transaction and upserts the scan row', async () => {
    const scan = makeAggregate();
    await repo.save(scan);

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma._txMock.scan.upsert).toHaveBeenCalledOnce();
    const call = vi.mocked(prisma._txMock.scan.upsert).mock.calls[0]?.[0];
    expect(call?.create.id).toBe(scan.id);
    expect(call?.create.libraryId).toBe(scan.libraryId);
    expect(call?.create.status).toBe('running');
  });

  it('deletes and recreates error records inside the transaction', async () => {
    const scan = makeAggregate();
    scan.recordError({ path: 'bad.txt', message: 'Bad', code: 'unsupported-extension' });
    await repo.save(scan);

    expect(prisma._txMock.scanErrorRecord.deleteMany).toHaveBeenCalledWith({
      where: { scanId: scan.id },
    });
    expect(prisma._txMock.scanErrorRecord.createMany).toHaveBeenCalledOnce();
  });

  it('skips createMany for errors when there are none', async () => {
    const scan = makeAggregate();
    await repo.save(scan);

    expect(prisma._txMock.scanErrorRecord.createMany).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  it('returns null when scan is not found', async () => {
    vi.mocked(prisma.scan.findUnique).mockResolvedValue(null);
    expect(await repo.findById('missing')).toBeNull();
  });

  it('reconstitutes aggregate from the row', async () => {
    const row = makeScanRow({ id: 'scan-42', libraryId: 'lib-7', status: 'succeeded' });
    vi.mocked(prisma.scan.findUnique).mockResolvedValue(row);

    const result = await repo.findById('scan-42');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('scan-42' as ScanId);
    expect(result?.libraryId).toBe('lib-7');
    expect(result?.status).toBe('succeeded');
    expect(result?.filesScanned).toBe(3);
  });

  // -------------------------------------------------------------------------
  // findLatestByLibrary
  // -------------------------------------------------------------------------
  it('returns null when no scan exists for the library', async () => {
    vi.mocked(prisma.scan.findFirst).mockResolvedValue(null);
    expect(await repo.findLatestByLibrary('lib-1')).toBeNull();
  });

  it('returns the aggregate when a row is found', async () => {
    const row = makeScanRow({ libraryId: 'lib-1', status: 'succeeded' });
    vi.mocked(prisma.scan.findFirst).mockResolvedValue(row);

    const result = await repo.findLatestByLibrary('lib-1');
    expect(result?.status).toBe('succeeded');
  });

  // -------------------------------------------------------------------------
  // findRunningByLibrary
  // -------------------------------------------------------------------------
  it('returns null when no running scan exists', async () => {
    vi.mocked(prisma.scan.findFirst).mockResolvedValue(null);
    expect(await repo.findRunningByLibrary('lib-1')).toBeNull();
  });

  it('returns the running scan', async () => {
    const row = makeScanRow({ status: 'running', finishedAt: null });
    vi.mocked(prisma.scan.findFirst).mockResolvedValue(row);

    const result = await repo.findRunningByLibrary('lib-1');
    expect(result?.status).toBe('running');
  });

  // -------------------------------------------------------------------------
  // P2002 → ScanInternalError
  // -------------------------------------------------------------------------
  it('wraps P2002 from $transaction as a DomainError with code scan-internal-error', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.$transaction).mockRejectedValue(p2002);

    const scan = makeAggregate();
    const err = await repo.save(scan).catch((error: unknown) => error);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code?: string }).code).toBe('scan-internal-error');
  });

  it('rethrows non-P2002 Prisma errors unchanged', async () => {
    const other = new Prisma.PrismaClientKnownRequestError('Other', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.$transaction).mockRejectedValue(other);

    const scan = makeAggregate();
    await expect(repo.save(scan)).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });
});
