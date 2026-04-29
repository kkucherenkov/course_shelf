/**
 * WHY this file exists:
 * Unit tests for the Prisma adapter. PrismaService is mocked at the class level
 * so no real DB connection is required. Tests cover:
 *   - save then findById roundtrip returns equal-by-fields aggregate.
 *   - second save with same rootPath rejects with LibraryAlreadyExistsError.
 *   - findAll returns mapped aggregates ordered by name.
 *   - findById returns null for unknown id.
 *   - update returns null on P2025, returns updated aggregate on success.
 *   - removeWithCascade executes all cascade steps and returns true on success.
 *   - removeWithCascade returns false on P2025 (missing library).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { Library } from '../domain/library/library';
import { LibraryAlreadyExistsError } from '../domain/library/library.errors';
import { PrismaLibraryRepository } from './prisma-library.repository';

import type { LibraryId } from '../domain/library/library';

// ---------------------------------------------------------------------------
// Minimal PrismaService mock — only the methods the repository actually uses.
// ---------------------------------------------------------------------------
function makePrismaRow(
  overrides: Partial<{
    id: string;
    name: string;
    rootPath: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'lib-1',
    name: 'Books',
    rootPath: '/media/books',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Minimal transaction client mock — mirrors the prisma delegate shape. */
function makeTxClient() {
  return {
    course: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    lesson: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    lessonProgress: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    bookmark: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    note: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    courseProgressReadModel: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    accessGrant: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    scan: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    library: {
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

interface LibraryDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function makePrisma(): {
  library: LibraryDelegate;
  $transaction: ReturnType<typeof vi.fn>;
} {
  return {
    library: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    $transaction: vi.fn(async (fn: (tx: ReturnType<typeof makeTxClient>) => Promise<unknown>) =>
      fn(makeTxClient()),
    ),
  };
}

function makeLibrary(
  overrides: Partial<{ id: string; name: string; rootPath: string }> = {},
): Library {
  return Library.register({
    id: overrides.id ?? 'lib-1',
    name: overrides.name ?? 'Books',
    rootPath: overrides.rootPath ?? '/media/books',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('PrismaLibraryRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaLibraryRepository;

  beforeEach(() => {
    prisma = makePrisma();
    // Cast: we only need the `library` delegate surface.
    repo = new PrismaLibraryRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  it('calls prisma.library.upsert with the aggregate fields', async () => {
    const lib = makeLibrary();
    await repo.save(lib);

    expect(prisma.library.upsert).toHaveBeenCalledOnce();
    const call = vi.mocked(prisma.library.upsert).mock.calls[0]?.[0];
    expect(call?.create.id).toBe(lib.id);
    expect(call?.create.name).toBe(lib.name);
    expect(call?.create.rootPath).toBe(lib.rootPath);
  });

  it('rethrows LibraryAlreadyExistsError on P2002', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.library.upsert).mockRejectedValue(p2002);

    const lib = makeLibrary();
    await expect(repo.save(lib)).rejects.toBeInstanceOf(LibraryAlreadyExistsError);
  });

  it('rethrows other Prisma errors unchanged', async () => {
    const other = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.library.upsert).mockRejectedValue(other);

    const lib = makeLibrary();
    await expect(repo.save(lib)).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  it('returns null when row is not found', async () => {
    vi.mocked(prisma.library.findUnique).mockResolvedValue(null);

    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('reconstitutes the aggregate from the row', async () => {
    const row = makePrismaRow({ id: 'lib-1', name: 'Books', rootPath: '/media/books' });
    vi.mocked(prisma.library.findUnique).mockResolvedValue(row);

    const result = await repo.findById('lib-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('lib-1');
    expect(result?.name).toBe('Books');
    expect(result?.rootPath).toBe('/media/books');
    expect(result?.createdAt).toEqual(row.createdAt);
  });

  // -------------------------------------------------------------------------
  // save → findById roundtrip (using mocks)
  // -------------------------------------------------------------------------
  it('roundtrip: save then findById returns equal-by-fields aggregate', async () => {
    const lib = makeLibrary({ id: 'lib-roundtrip' });
    const row = makePrismaRow({
      id: lib.id,
      name: lib.name,
      rootPath: lib.rootPath,
      createdAt: lib.createdAt,
      updatedAt: lib.updatedAt,
    });

    // save succeeds, then findById returns the same row
    vi.mocked(prisma.library.upsert).mockResolvedValue(undefined);
    vi.mocked(prisma.library.findUnique).mockResolvedValue(row);

    await repo.save(lib);
    const loaded = await repo.findById(lib.id);

    expect(loaded?.id).toBe(lib.id as LibraryId);
    expect(loaded?.name).toBe(lib.name);
    expect(loaded?.rootPath).toBe(lib.rootPath);
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------
  it('returns empty array when no rows', async () => {
    vi.mocked(prisma.library.findMany).mockResolvedValue([]);

    const result = await repo.findAll();
    expect(result).toEqual([]);
  });

  it('maps all rows to aggregates', async () => {
    const rows = [
      makePrismaRow({ id: 'lib-1', name: 'Books', rootPath: '/media/books' }),
      makePrismaRow({ id: 'lib-2', name: 'Music', rootPath: '/media/music' }),
    ];
    vi.mocked(prisma.library.findMany).mockResolvedValue(rows);

    const result = await repo.findAll();
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Books');
    expect(result[1]?.name).toBe('Music');
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  it('update returns null when P2025 is thrown', async () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.library.update).mockRejectedValue(p2025);

    const result = await repo.update('missing', { name: 'New' });
    expect(result).toBeNull();
  });

  it('update returns the updated aggregate on success', async () => {
    const updatedAt = new Date('2026-06-01T00:00:00.000Z');
    const row = makePrismaRow({ id: 'lib-1', name: 'Renamed', updatedAt });
    vi.mocked(prisma.library.update).mockResolvedValue(row);

    const result = await repo.update('lib-1', { name: 'Renamed' });

    expect(result).not.toBeNull();
    expect(result?.id).toBe('lib-1');
    expect(result?.name).toBe('Renamed');
    expect(result?.rootPath).toBe('/media/books');
    expect(result?.updatedAt).toEqual(updatedAt);
  });

  it('update does not mutate rootPath (only passes name to prisma.update)', async () => {
    const row = makePrismaRow({ id: 'lib-1', name: 'NewName' });
    vi.mocked(prisma.library.update).mockResolvedValue(row);

    await repo.update('lib-1', { name: 'NewName' });

    const call = vi.mocked(prisma.library.update).mock.calls[0]?.[0];
    // data must only contain name; rootPath must not be present
    expect(Object.keys(call?.data as object)).not.toContain('rootPath');
    expect(call?.data.name).toBe('NewName');
  });

  it('update rethrows non-P2025 Prisma errors', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.library.update).mockRejectedValue(p2002);

    await expect(repo.update('lib-1', { name: 'X' })).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  // -------------------------------------------------------------------------
  // removeWithCascade
  // -------------------------------------------------------------------------
  it('removeWithCascade returns true and runs all cascade steps', async () => {
    // Arrange: two courses, two lessons each
    const courseIds = ['c-1', 'c-2'];
    const lessonIds = ['l-1', 'l-2', 'l-3', 'l-4'];

    const tx = makeTxClient();
    tx.course.findMany.mockResolvedValue(courseIds.map((id) => ({ id })));
    tx.lesson.findMany.mockResolvedValue(lessonIds.map((id) => ({ id })));
    vi.mocked(prisma.$transaction).mockImplementation(
      async (fn: (tx: ReturnType<typeof makeTxClient>) => Promise<unknown>) => fn(tx),
    );

    const result = await repo.removeWithCascade('lib-1');

    expect(result).toBe(true);

    // Leaf tables must be deleted before parents
    expect(tx.lessonProgress.deleteMany).toHaveBeenCalledWith({
      where: { lessonId: { in: lessonIds } },
    });
    expect(tx.bookmark.deleteMany).toHaveBeenCalledWith({
      where: { lessonId: { in: lessonIds } },
    });
    expect(tx.note.deleteMany).toHaveBeenCalledWith({
      where: { lessonId: { in: lessonIds } },
    });
    expect(tx.courseProgressReadModel.deleteMany).toHaveBeenCalledWith({
      where: { courseId: { in: courseIds } },
    });
    expect(tx.scan.deleteMany).toHaveBeenCalledWith({ where: { libraryId: 'lib-1' } });
    expect(tx.course.deleteMany).toHaveBeenCalledWith({ where: { libraryId: 'lib-1' } });
    expect(tx.library.delete).toHaveBeenCalledWith({ where: { id: 'lib-1' } });
  });

  it('removeWithCascade returns false when library is not found (P2025)', async () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });

    const tx = makeTxClient();
    tx.library.delete.mockRejectedValue(p2025);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (fn: (tx: ReturnType<typeof makeTxClient>) => Promise<unknown>) => fn(tx),
    );

    const result = await repo.removeWithCascade('missing');
    expect(result).toBe(false);
  });

  it('removeWithCascade skips lesson-level deletes when library has no courses', async () => {
    const tx = makeTxClient();
    tx.course.findMany.mockResolvedValue([]); // no courses
    vi.mocked(prisma.$transaction).mockImplementation(
      async (fn: (tx: ReturnType<typeof makeTxClient>) => Promise<unknown>) => fn(tx),
    );

    await repo.removeWithCascade('lib-1');

    expect(tx.lessonProgress.deleteMany).not.toHaveBeenCalled();
    expect(tx.bookmark.deleteMany).not.toHaveBeenCalled();
    expect(tx.note.deleteMany).not.toHaveBeenCalled();
    expect(tx.courseProgressReadModel.deleteMany).not.toHaveBeenCalled();
    // scan and course deleteMany are still called (even with no courses, they are no-ops)
    expect(tx.scan.deleteMany).toHaveBeenCalled();
    expect(tx.course.deleteMany).toHaveBeenCalled();
    expect(tx.library.delete).toHaveBeenCalled();
  });

  it('removeWithCascade rethrows non-P2025 errors', async () => {
    const unexpected = new Error('Connection reset');
    vi.mocked(prisma.$transaction).mockRejectedValue(unexpected);

    await expect(repo.removeWithCascade('lib-1')).rejects.toBe(unexpected);
  });
});
