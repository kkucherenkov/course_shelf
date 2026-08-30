/**
 * Unit tests for PrismaTranscriptRepository. PrismaService is mocked so no
 * real DB connection is required; `node:fs/promises` is mocked so
 * `deleteForLesson`'s best-effort unlink touches no real disk. Tests cover:
 *   - findGeneratedForLessons: batch lookup, origin filtered to 'generated'.
 *   - replaceGenerated / replaceSidecar: delete-then-create in one transaction,
 *     with the right origin and derivedPath.
 *   - findExisting: returns the row's origin + signature, or null.
 *   - deleteForLesson: deletes all rows for the lesson and unlinks every
 *     non-null derivedPath, best-effort (an unlink failure does not throw).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  unlink: vi.fn(async () => undefined),
}));

import { unlink } from 'node:fs/promises';

import { PrismaTranscriptRepository } from './prisma-transcript.repository';

const NOW = new Date('2026-01-01T00:00:00.000Z');

interface TranscriptDelegate {
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  transcript: TranscriptDelegate;
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    transcript: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      deleteMany: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
    },
    $transaction: vi.fn(),
  };

  vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma),
  );

  return prisma;
}

describe('PrismaTranscriptRepository', () => {
  let prisma: MockPrisma;
  let repo: PrismaTranscriptRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    repo = new PrismaTranscriptRepository(prisma as never);
  });

  describe('findGeneratedForLessons', () => {
    it('queries origin=generated and returns a Map keyed by lessonId', async () => {
      prisma.transcript.findMany.mockResolvedValue([
        { lessonId: 'l1', sourceMtime: NOW, sourceSize: 100 },
      ]);

      const result = await repo.findGeneratedForLessons(['l1', 'l2'], 'en');

      expect(prisma.transcript.findMany).toHaveBeenCalledWith({
        where: { lessonId: { in: ['l1', 'l2'] }, language: 'en', origin: 'generated' },
        select: { lessonId: true, sourceMtime: true, sourceSize: true },
      });
      expect(result.get('l1')).toEqual({ sourceMtime: NOW, sourceSize: 100 });
      expect(result.has('l2')).toBe(false);
    });

    it('returns an empty Map without querying when lessonIds is empty', async () => {
      const result = await repo.findGeneratedForLessons([], 'en');
      expect(result.size).toBe(0);
      expect(prisma.transcript.findMany).not.toHaveBeenCalled();
    });
  });

  describe('replaceGenerated', () => {
    it('deletes the (lessonId, language) row then creates the new one with cues', async () => {
      await repo.replaceGenerated({
        lessonId: 'l1',
        language: 'en',
        sourcePath: 'Course/01.mp4',
        sourceMtime: NOW,
        sourceSize: 100,
        derivedPath: '/derived/lib-1/Course/01.mp4.en.srt',
        cues: [{ startMs: 0, endMs: 1000, text: 'Hi' }],
      });

      expect(prisma.transcript.deleteMany).toHaveBeenCalledWith({
        where: { lessonId: 'l1', language: 'en' },
      });
      expect(prisma.transcript.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lessonId: 'l1',
          language: 'en',
          origin: 'generated',
          derivedPath: '/derived/lib-1/Course/01.mp4.en.srt',
          cues: { createMany: { data: [{ startMs: 0, endMs: 1000, text: 'Hi' }] } },
        }),
      });
    });
  });

  describe('findExisting', () => {
    it('returns the row shape by the compound unique key', async () => {
      prisma.transcript.findUnique.mockResolvedValue({
        origin: 'sidecar',
        sourceMtime: NOW,
        sourceSize: 30,
      });

      const result = await repo.findExisting('l1', 'en');

      expect(prisma.transcript.findUnique).toHaveBeenCalledWith({
        where: { uq_transcript_lesson_language: { lessonId: 'l1', language: 'en' } },
        select: { origin: true, sourceMtime: true, sourceSize: true },
      });
      expect(result).toEqual({ origin: 'sidecar', sourceMtime: NOW, sourceSize: 30 });
    });

    it('returns null when no row exists', async () => {
      prisma.transcript.findUnique.mockResolvedValue(null);
      expect(await repo.findExisting('l1', 'en')).toBeNull();
    });
  });

  describe('replaceSidecar', () => {
    it('deletes then creates with origin=sidecar and derivedPath=null', async () => {
      await repo.replaceSidecar({
        lessonId: 'l1',
        language: 'en',
        sourcePath: 'Course/01.en.srt',
        sourceMtime: NOW,
        sourceSize: 30,
        cues: [{ startMs: 0, endMs: 500, text: 'Hola' }],
      });

      expect(prisma.transcript.deleteMany).toHaveBeenCalledWith({
        where: { lessonId: 'l1', language: 'en' },
      });
      expect(prisma.transcript.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          origin: 'sidecar',
          sourcePath: 'Course/01.en.srt',
          derivedPath: null,
        }),
      });
    });
  });

  describe('deleteForLesson', () => {
    it('deletes every row for the lesson and unlinks each non-null derivedPath', async () => {
      prisma.transcript.findMany.mockResolvedValue([
        { derivedPath: '/derived/lib-1/Course/01.mp4.en.srt' },
        { derivedPath: null }, // a sidecar-origin row never has a derivedPath
      ]);

      await repo.deleteForLesson('l1');

      expect(prisma.transcript.deleteMany).toHaveBeenCalledWith({ where: { lessonId: 'l1' } });
      expect(unlink).toHaveBeenCalledTimes(1);
      expect(unlink).toHaveBeenCalledWith('/derived/lib-1/Course/01.mp4.en.srt');
    });

    it('is a no-op when the lesson has no Transcript rows', async () => {
      prisma.transcript.findMany.mockResolvedValue([]);
      await repo.deleteForLesson('l1');
      expect(prisma.transcript.deleteMany).not.toHaveBeenCalled();
    });

    it('an unlink failure is swallowed — the DB delete already committed', async () => {
      prisma.transcript.findMany.mockResolvedValue([
        { derivedPath: '/derived/lib-1/Course/01.mp4.en.srt' },
      ]);
      vi.mocked(unlink).mockRejectedValueOnce(new Error('ENOENT'));

      await expect(repo.deleteForLesson('l1')).resolves.toBeUndefined();
    });
  });
});
