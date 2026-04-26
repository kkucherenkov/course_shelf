/**
 * WHY this file exists:
 * Unit tests for the Prisma adapter. PrismaService is mocked at the class level
 * so no real DB connection is required. Tests cover:
 *   - save persists aggregate fields.
 *   - second save with same composite key rejects with GrantAlreadyExistsError.
 *   - findById reconstitutes aggregate from row.
 *   - findById returns null for unknown id.
 *   - findManyByUser returns mapped aggregates.
 *   - delete returns true on success, false on P2025.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { AccessGrant } from '../domain/grant/grant';
import { GrantAlreadyExistsError } from '../domain/grant/grant.errors';
import { PrismaGrantRepository } from './prisma-grant.repository';

// ---------------------------------------------------------------------------
// Minimal PrismaService mock
// ---------------------------------------------------------------------------
interface AccessGrantDelegate {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function makePrisma(): { accessGrant: AccessGrantDelegate } {
  return {
    accessGrant: {
      create: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

function makeRow(
  overrides: Partial<{
    id: string;
    userId: string;
    targetKind: 'library' | 'course';
    libraryId: string | null;
    courseId: string | null;
    level: 'READ';
    createdAt: Date;
  }> = {},
) {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'grant-1',
    userId: 'user-1',
    targetKind: 'library' as const,
    libraryId: 'lib-1',
    courseId: null,
    level: 'READ' as const,
    createdAt: now,
    ...overrides,
  };
}

function makeGrant(): AccessGrant {
  return AccessGrant.register({
    id: 'grant-1',
    userId: 'user-1',
    target: { kind: 'library', libraryId: 'lib-1' },
    level: 'READ',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('PrismaGrantRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaGrantRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaGrantRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  it('calls prisma.accessGrant.create with the aggregate fields', async () => {
    const grant = makeGrant();
    await repo.save(grant);

    expect(prisma.accessGrant.create).toHaveBeenCalledOnce();
    const call = vi.mocked(prisma.accessGrant.create).mock.calls[0]?.[0];
    expect(call?.data.id).toBe(grant.id);
    expect(call?.data.userId).toBe(grant.userId);
    expect(call?.data.targetKind).toBe('library');
    expect(call?.data.libraryId).toBe('lib-1');
    expect(call?.data.courseId).toBeNull();
    expect(call?.data.level).toBe('READ');
  });

  it('throws GrantAlreadyExistsError on P2002', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.accessGrant.create).mockRejectedValue(p2002);

    const grant = makeGrant();
    await expect(repo.save(grant)).rejects.toBeInstanceOf(GrantAlreadyExistsError);
  });

  it('rethrows other Prisma errors unchanged', async () => {
    const other = new Prisma.PrismaClientKnownRequestError('Unknown', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.accessGrant.create).mockRejectedValue(other);

    const grant = makeGrant();
    await expect(repo.save(grant)).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  it('returns null when row is not found', async () => {
    vi.mocked(prisma.accessGrant.findUnique).mockResolvedValue(null);

    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('reconstitutes the aggregate from the row', async () => {
    const row = makeRow();
    vi.mocked(prisma.accessGrant.findUnique).mockResolvedValue(row);

    const result = await repo.findById('grant-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('grant-1');
    expect(result?.userId).toBe('user-1');
    expect(result?.target).toEqual({ kind: 'library', libraryId: 'lib-1' });
    expect(result?.level).toBe('READ');
    expect(result?.createdAt).toEqual(row.createdAt);
  });

  it('reconstitutes course target from row', async () => {
    const row = makeRow({
      targetKind: 'course',
      libraryId: null,
      courseId: 'course-1',
    });
    vi.mocked(prisma.accessGrant.findUnique).mockResolvedValue(row);

    const result = await repo.findById('grant-1');

    expect(result?.target).toEqual({ kind: 'course', courseId: 'course-1' });
  });

  // -------------------------------------------------------------------------
  // findManyByUser
  // -------------------------------------------------------------------------
  it('returns empty array when user has no grants', async () => {
    vi.mocked(prisma.accessGrant.findMany).mockResolvedValue([]);

    const result = await repo.findManyByUser('user-1');
    expect(result).toEqual([]);
  });

  it('maps rows to aggregates', async () => {
    const rows = [
      makeRow({ id: 'grant-1' }),
      makeRow({ id: 'grant-2', targetKind: 'course', libraryId: null, courseId: 'course-1' }),
    ];
    vi.mocked(prisma.accessGrant.findMany).mockResolvedValue(rows);

    const result = await repo.findManyByUser('user-1');
    expect(result).toHaveLength(2);
    expect(result[0]?.target).toEqual({ kind: 'library', libraryId: 'lib-1' });
    expect(result[1]?.target).toEqual({ kind: 'course', courseId: 'course-1' });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  it('returns true when delete succeeds', async () => {
    vi.mocked(prisma.accessGrant.delete).mockResolvedValue(undefined);

    const result = await repo.delete('grant-1');
    expect(result).toBe(true);
    expect(prisma.accessGrant.delete).toHaveBeenCalledWith({ where: { id: 'grant-1' } });
  });

  it('returns false on P2025 (record not found)', async () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.accessGrant.delete).mockRejectedValue(p2025);

    const result = await repo.delete('missing');
    expect(result).toBe(false);
  });

  it('rethrows unexpected errors from delete', async () => {
    const other = new Prisma.PrismaClientKnownRequestError('Connection failed', {
      code: 'P1001',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.accessGrant.delete).mockRejectedValue(other);

    await expect(repo.delete('grant-1')).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
  });
});
