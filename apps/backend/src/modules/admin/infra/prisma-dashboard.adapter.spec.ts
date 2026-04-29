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

    expect(result[0]?.finishedAt).toBeNull();
    expect(result[0]?.status).toBe('running');
    expect(result[0]?.libraryName).toBe('Computer Science');
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
    expect(result[0]?.coursesAdded).toBe(3);
  });

  it('filters by libraryId when provided', async () => {
    const scanFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      scan: { findMany: scanFindMany },
      library: { findMany: vi.fn().mockResolvedValue([]) },
      course: { count: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listRecentScans(10, 'lib-filter');

    expect(scanFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { libraryId: 'lib-filter' } }),
    );
  });

  it('passes no where clause when no libraryId is provided', async () => {
    const scanFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      scan: { findMany: scanFindMany },
      library: { findMany: vi.fn().mockResolvedValue([]) },
      course: { count: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listRecentScans(10);

    // Spread approach: no `where` property at all when libraryId is omitted.
    const callArg = (scanFindMany as ReturnType<typeof vi.fn>).mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    expect(callArg).not.toHaveProperty('where');
  });

  it('returns empty list for unknown libraryId without throwing', async () => {
    const prisma = {
      scan: { findMany: vi.fn().mockResolvedValue([]) },
      library: { findMany: vi.fn().mockResolvedValue([]) },
      course: { count: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listRecentScans(10, 'nonexistent-id');

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// listAllLibrariesWithCounts
// ---------------------------------------------------------------------------

interface LibraryRow {
  id: string;
  name: string;
  rootPath: string;
}

// groupBy result shapes
interface CourseGroupRow {
  libraryId: string;
  _count: { _all: number };
}

interface LessonGroupRow {
  courseId: string;
  _count: { _all: number };
}

interface ScanWithErrorsCount extends ScanRow {
  _count: { errors: number };
}

function makeLibrariesPrisma(
  libraryRows: LibraryRow[],
  courseGroupRows: CourseGroupRow[],
  lessonGroupRows: LessonGroupRow[],
  // courseId→libraryId rows returned by the follow-up course.findMany
  courseIdRows: { id: string; libraryId: string }[],
  scanRows: ScanWithErrorsCount[],
): PrismaService {
  return {
    library: {
      findMany: vi.fn().mockResolvedValue(libraryRows),
    },
    course: {
      groupBy: vi.fn().mockResolvedValue(courseGroupRows),
      findMany: vi.fn().mockResolvedValue(courseIdRows),
    },
    lesson: {
      groupBy: vi.fn().mockResolvedValue(lessonGroupRows),
    },
    scan: {
      findMany: vi.fn().mockResolvedValue(scanRows),
    },
  } as unknown as PrismaService;
}

describe('PrismaDashboardAdapter.listAllLibrariesWithCounts', () => {
  it('returns empty array when no libraries exist', async () => {
    const prisma = makeLibrariesPrisma([], [], [], [], []);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listAllLibrariesWithCounts();

    expect(result).toEqual([]);
    // aggregate queries should not run when there are no libraries
    expect(prisma.course.groupBy).not.toHaveBeenCalled();
    expect(prisma.lesson.groupBy).not.toHaveBeenCalled();
    expect(prisma.scan.findMany).not.toHaveBeenCalled();
  });

  it('maps library to item with correct coursesCount, lessonsCount, and lastScan', async () => {
    const startedAt = new Date('2026-04-27T09:00:00.000Z');
    const finishedAt = new Date('2026-04-27T09:05:00.000Z');

    const prisma = makeLibrariesPrisma(
      [{ id: 'lib-1', name: 'Mathematics', rootPath: '/data/math' }],
      [{ libraryId: 'lib-1', _count: { _all: 2 } }],
      [
        { courseId: 'c-1', _count: { _all: 4 } },
        { courseId: 'c-2', _count: { _all: 3 } },
      ],
      [
        { id: 'c-1', libraryId: 'lib-1' },
        { id: 'c-2', libraryId: 'lib-1' },
      ],
      [
        {
          id: 'scan-1',
          libraryId: 'lib-1',
          status: 'succeeded',
          startedAt,
          finishedAt,
          filesScanned: 20,
          _count: { errors: 1 },
        },
      ],
    );
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listAllLibrariesWithCounts();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'lib-1',
      name: 'Mathematics',
      rootPath: '/data/math',
      coursesCount: 2,
      lessonsCount: 7,
      lastScan: {
        status: 'succeeded',
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        errorsCount: 1,
      },
    });
  });

  it('returns 0/0 and null lastScan for library with no courses and no scans', async () => {
    const prisma = makeLibrariesPrisma(
      [{ id: 'lib-empty', name: 'Empty', rootPath: '/empty' }],
      [],
      [],
      [],
      [],
    );
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listAllLibrariesWithCounts();

    expect(result[0]!.coursesCount).toBe(0);
    expect(result[0]!.lessonsCount).toBe(0);
    expect(result[0]!.lastScan).toBeNull();
  });

  it('sets finishedAt to null for running scan', async () => {
    const startedAt = new Date('2026-04-28T10:00:00.000Z');
    const prisma = makeLibrariesPrisma(
      [{ id: 'lib-1', name: 'CS', rootPath: '/cs' }],
      [],
      [],
      [],
      [
        {
          id: 'scan-r',
          libraryId: 'lib-1',
          status: 'running',
          startedAt,
          finishedAt: null,
          filesScanned: 0,
          _count: { errors: 0 },
        },
      ],
    );
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listAllLibrariesWithCounts();

    expect(result[0]!.lastScan?.status).toBe('running');
    expect(result[0]!.lastScan?.finishedAt).toBeNull();
  });

  it('queries libraries ordered by name asc', async () => {
    const libraryFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      library: { findMany: libraryFindMany },
      course: { groupBy: vi.fn().mockResolvedValue([]), findMany: vi.fn().mockResolvedValue([]) },
      lesson: { groupBy: vi.fn().mockResolvedValue([]) },
      scan: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listAllLibrariesWithCounts();

    expect(libraryFindMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
  });

  it('fetches most recent scan per library using distinct', async () => {
    const startedAt = new Date('2026-04-28T09:00:00.000Z');
    const libraryRows = [{ id: 'lib-1', name: 'Physics', rootPath: '/phys' }];
    const scanFindMany = vi.fn().mockResolvedValue([
      {
        id: 'scan-latest',
        libraryId: 'lib-1',
        status: 'succeeded',
        startedAt,
        finishedAt: startedAt,
        filesScanned: 5,
        _count: { errors: 0 },
      },
    ]);
    const prisma = {
      library: { findMany: vi.fn().mockResolvedValue(libraryRows) },
      course: { groupBy: vi.fn().mockResolvedValue([]), findMany: vi.fn().mockResolvedValue([]) },
      lesson: { groupBy: vi.fn().mockResolvedValue([]) },
      scan: { findMany: scanFindMany },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listAllLibrariesWithCounts();

    expect(scanFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: ['libraryId'],
        orderBy: { startedAt: 'desc' },
      }),
    );
  });

  it('handles multiple libraries with independent counts', async () => {
    const prisma = makeLibrariesPrisma(
      [
        { id: 'lib-a', name: 'Algebra', rootPath: '/algebra' },
        { id: 'lib-b', name: 'Biology', rootPath: '/biology' },
      ],
      [
        { libraryId: 'lib-a', _count: { _all: 1 } },
        { libraryId: 'lib-b', _count: { _all: 2 } },
      ],
      [
        { courseId: 'ca-1', _count: { _all: 10 } },
        { courseId: 'cb-1', _count: { _all: 5 } },
        { courseId: 'cb-2', _count: { _all: 3 } },
      ],
      [
        { id: 'ca-1', libraryId: 'lib-a' },
        { id: 'cb-1', libraryId: 'lib-b' },
        { id: 'cb-2', libraryId: 'lib-b' },
      ],
      [],
    );
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listAllLibrariesWithCounts();

    const algebra = result.find((r) => r.id === 'lib-a')!;
    const biology = result.find((r) => r.id === 'lib-b')!;

    expect(algebra.coursesCount).toBe(1);
    expect(algebra.lessonsCount).toBe(10);
    expect(biology.coursesCount).toBe(2);
    expect(biology.lessonsCount).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// listUsers
// ---------------------------------------------------------------------------

interface UserRow {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
  role: string;
  banned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function makeUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    displayName: null,
    role: 'USER',
    banned: false,
    createdAt: new Date('2026-04-27T09:55:00.000Z'),
    updatedAt: new Date('2026-04-27T09:55:00.000Z'),
    ...overrides,
  };
}

function makeUsersPrisma(userRows: UserRow[]): PrismaService {
  return {
    user: {
      findMany: vi.fn().mockResolvedValue(userRows),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  } as unknown as PrismaService;
}

describe('PrismaDashboardAdapter.listUsers', () => {
  it('returns empty array when no users exist', async () => {
    const prisma = makeUsersPrisma([]);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listUsers({ limit: 50 });

    expect(result).toEqual([]);
  });

  it('maps user row to AdminUserListItem with lowercased role', async () => {
    const createdAt = new Date('2026-04-27T09:55:00.000Z');
    const updatedAt = new Date('2026-04-27T09:56:00.000Z');
    const prisma = makeUsersPrisma([
      makeUserRow({ id: 'user-1', role: 'ADMIN', createdAt, updatedAt }),
    ]);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listUsers({ limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
      displayName: null,
      role: 'admin',
      banned: false,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('lowercases USER role to "user"', async () => {
    const prisma = makeUsersPrisma([makeUserRow({ role: 'USER' })]);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listUsers({ limit: 10 });

    expect(result[0]!.role).toBe('user');
  });

  it('lowercases GUEST role to "guest"', async () => {
    const prisma = makeUsersPrisma([makeUserRow({ role: 'GUEST' })]);
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.listUsers({ limit: 10 });

    expect(result[0]!.role).toBe('guest');
  });

  it('applies search filter when provided', async () => {
    const userFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      user: { findMany: userFindMany },
      session: { deleteMany: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listUsers({ search: 'alice', limit: 20 });

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { email: { contains: 'alice', mode: 'insensitive' } },
            { name: { contains: 'alice', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('passes no where clause when search is undefined', async () => {
    const userFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      user: { findMany: userFindMany },
      session: { deleteMany: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listUsers({ limit: 20 });

    const callArg = (userFindMany as ReturnType<typeof vi.fn>).mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    expect(callArg['where']).toBeUndefined();
  });

  it('orders by createdAt desc and respects take', async () => {
    const userFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      user: { findMany: userFindMany },
      session: { deleteMany: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.listUsers({ limit: 15 });

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' }, take: 15 }),
    );
  });
});

// ---------------------------------------------------------------------------
// updateUser
// ---------------------------------------------------------------------------

describe('PrismaDashboardAdapter.updateUser', () => {
  it('returns updated item with lowercased role on success', async () => {
    const now = new Date('2026-04-28T10:00:00.000Z');
    const updatedRow: UserRow = makeUserRow({
      id: 'user-1',
      role: 'ADMIN',
      banned: false,
      updatedAt: now,
    });
    const userUpdate = vi.fn().mockResolvedValue(updatedRow);
    const sessionDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const prisma = {
      user: { update: userUpdate },
      session: { deleteMany: sessionDeleteMany },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.updateUser('user-1', { role: 'admin' });

    expect(result).not.toBeNull();
    expect(result!.role).toBe('admin');
    expect(result!.id).toBe('user-1');
    // No ban — sessions must not be deleted
    expect(sessionDeleteMany).not.toHaveBeenCalled();
  });

  it('calls session.deleteMany when banned=true', async () => {
    const updatedRow: UserRow = makeUserRow({ id: 'user-2', banned: true });
    const userUpdate = vi.fn().mockResolvedValue(updatedRow);
    const sessionDeleteMany = vi.fn().mockResolvedValue({ count: 3 });
    const prisma = {
      user: { update: userUpdate },
      session: { deleteMany: sessionDeleteMany },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.updateUser('user-2', { banned: true });

    expect(sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: 'user-2' } });
  });

  it('does NOT call session.deleteMany when banned=false', async () => {
    const updatedRow: UserRow = makeUserRow({ banned: false });
    const userUpdate = vi.fn().mockResolvedValue(updatedRow);
    const sessionDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const prisma = {
      user: { update: userUpdate },
      session: { deleteMany: sessionDeleteMany },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.updateUser('user-1', { banned: false });

    expect(sessionDeleteMany).not.toHaveBeenCalled();
  });

  it('returns null when Prisma throws P2025 (record not found)', async () => {
    const { Prisma: PrismaNamespace } = await import('@prisma/client');
    const p2025 = new PrismaNamespace.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '0.0.0',
    });
    const prisma = {
      user: { update: vi.fn().mockRejectedValue(p2025) },
      session: { deleteMany: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.updateUser('missing-id', { role: 'user' });

    expect(result).toBeNull();
  });

  it('re-throws unexpected Prisma errors', async () => {
    const unexpectedError = new Error('Connection reset');
    const prisma = {
      user: { update: vi.fn().mockRejectedValue(unexpectedError) },
      session: { deleteMany: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await expect(adapter.updateUser('user-1', { role: 'user' })).rejects.toThrow(
      'Connection reset',
    );
  });

  it('sends role as uppercase to Prisma', async () => {
    const userUpdate = vi.fn().mockResolvedValue(makeUserRow());
    const prisma = {
      user: { update: userUpdate },
      session: { deleteMany: vi.fn() },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.updateUser('user-1', { role: 'admin' });

    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ADMIN' }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// findUserById
// ---------------------------------------------------------------------------

describe('PrismaDashboardAdapter.findUserById', () => {
  it('returns null when user does not exist', async () => {
    const userFindUnique = vi.fn().mockResolvedValue(null);
    const prisma = {
      user: { findUnique: userFindUnique },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.findUserById('nonexistent-id');

    expect(result).toBeNull();
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 'nonexistent-id' },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('returns mapped AdminUserListItem with lowercased role', async () => {
    const createdAt = new Date('2026-04-27T09:55:00.000Z');
    const updatedAt = new Date('2026-04-28T10:00:00.000Z');
    const row = makeUserRow({ id: 'user-42', role: 'ADMIN', createdAt, updatedAt });
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(row) },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.findUserById('user-42');

    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: 'user-42',
      email: 'alice@example.com',
      name: 'Alice',
      displayName: null,
      role: 'admin',
      banned: false,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('lowercases USER role to "user"', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(makeUserRow({ role: 'USER' })) },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.findUserById('user-1');

    expect(result!.role).toBe('user');
  });

  it('lowercases GUEST role to "guest"', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(makeUserRow({ role: 'GUEST' })) },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.findUserById('user-1');

    expect(result!.role).toBe('guest');
  });

  it('falls back to "user" for an unknown DB role', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(makeUserRow({ role: 'SUPERADMIN' })) },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    const result = await adapter.findUserById('user-1');

    expect(result!.role).toBe('user');
  });

  it('passes the id to the where clause', async () => {
    const userFindUnique = vi.fn().mockResolvedValue(makeUserRow({ id: 'user-7' }));
    const prisma = {
      user: { findUnique: userFindUnique },
    } as unknown as PrismaService;
    const adapter = new PrismaDashboardAdapter(prisma);

    await adapter.findUserById('user-7');

    expect(userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-7' } }),
    );
  });
});
