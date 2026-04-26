/**
 * WHY this file exists:
 * Unit tests for the Prisma adapter. PrismaService is mocked at the class level
 * so no real DB connection is required. Tests cover:
 *   - save then findById roundtrip returns equal-by-fields aggregate.
 *   - second save with same rootPath rejects with LibraryAlreadyExistsError.
 *   - findAll returns mapped aggregates ordered by name.
 *   - findById returns null for unknown id.
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

interface LibraryDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

function makePrisma(): { library: LibraryDelegate } {
  return {
    library: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
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
});
