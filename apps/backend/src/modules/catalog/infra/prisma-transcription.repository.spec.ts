/**
 * Unit tests for PrismaTranscriptionRepository — focused on what #525 touched:
 *   - save: bootId is written on create, left alone on update (it identifies
 *     the process that STARTED the run, never the one checking in on it).
 *   - findStaleRunning: the exact WHERE clause the boot-recovery pass depends
 *     on. `findStaleRunning` actually selecting a row a previous boot left
 *     behind, against a real Postgres, is proven separately in
 *     `prisma-transcription.repository.integration.spec.ts` — mocking Prisma
 *     here only proves the query is BUILT correctly, not that Postgres
 *     answers it the way the code assumes.
 *
 * The rest of the class (findById, findLatestForLibrary, listForLibrary,
 * findRunningForLibrary) predates this change and is exercised indirectly
 * through the handler specs and the HTTP integration spec; not re-covered
 * here to keep this file scoped to the diff.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Transcription } from '../domain/transcription/transcription';
import { PrismaTranscriptionRepository } from './prisma-transcription.repository';

const NOW = new Date('2026-01-01T00:00:00.000Z');

interface TranscriptionDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

interface TranscriptionErrorRecordDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  transcription: TranscriptionDelegate;
  transcriptionErrorRecord: TranscriptionErrorRecordDelegate;
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    transcription: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findMany: vi.fn().mockResolvedValue([]),
    },
    transcriptionErrorRecord: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    $transaction: vi.fn(),
  };

  vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma),
  );

  return prisma;
}

describe('PrismaTranscriptionRepository', () => {
  let prisma: MockPrisma;
  let repo: PrismaTranscriptionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    repo = new PrismaTranscriptionRepository(prisma as never);
  });

  describe('save', () => {
    it('writes bootId on create', async () => {
      const t = Transcription.start({
        id: 't1',
        libraryId: 'lib-1',
        force: false,
        lessonsTotal: 3,
        bootId: 'boot-1',
        now: NOW,
      });

      await repo.save(t);

      expect(prisma.transcription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't1' },
          create: expect.objectContaining({ id: 't1', bootId: 'boot-1' }),
        }),
      );
      // Identity fields (bootId included) are set once at creation — the
      // update branch never touches them.
      const call = vi.mocked(prisma.transcription.upsert).mock.calls[0]?.[0] as {
        update: Record<string, unknown>;
      };
      expect(call.update).not.toHaveProperty('bootId');
    });
  });

  describe('findStaleRunning', () => {
    it('queries running rows whose bootId differs from the current process', async () => {
      prisma.transcription.findMany.mockResolvedValue([
        {
          id: 't-stale',
          libraryId: 'lib-1',
          status: 'running',
          force: false,
          startedAt: NOW,
          finishedAt: null,
          bootId: 'boot-old',
          lessonsTotal: 3,
          lessonsSkipped: 0,
          lessonsTranscribed: 0,
          lessonsFailed: 0,
          scopeCourseId: null,
          scopeCourseName: null,
          errors: [],
        },
      ]);

      const result = await repo.findStaleRunning('boot-current');

      expect(prisma.transcription.findMany).toHaveBeenCalledWith({
        where: { status: 'running', bootId: { not: 'boot-current' } },
        select: expect.objectContaining({ bootId: true, status: true }),
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('t-stale');
      expect(result[0]?.bootId).toBe('boot-old');
    });

    it('returns an empty array when nothing is stale', async () => {
      prisma.transcription.findMany.mockResolvedValue([]);
      expect(await repo.findStaleRunning('boot-current')).toEqual([]);
    });
  });
});
