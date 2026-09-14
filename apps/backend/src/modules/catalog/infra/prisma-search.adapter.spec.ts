/**
 * Unit tests for PrismaSearchAdapter.
 * PrismaService is mocked — no real DB connection required.
 *
 * Covers:
 *   - findCourseHits: issues 3 tier-scoped queries (exact-prefix, word-prefix,
 *     remainder), each capped at `limit`, each mutually exclusive via NOT
 *   - findCourseHits: maps concatenated rows + lesson counts correctly
 *   - findCourseHits: scopes every tier by libraryId for non-admin
 *   - findCourseHits: no libraryId filter for admin (libraryIds = null)
 *   - findCourseHits: tier 2 keeps the section-title OR clause
 *   - findLessonHits: issues 3 tier-scoped queries, each capped at `limit`
 *   - findLessonHits: maps concatenated rows correctly including course +
 *     section titles
 *   - findLessonHits: scopes every tier through section→course for non-admin
 *   - findLessonHits: no section filter for admin (libraryIds = null)
 *   - findTranscriptHits: libraryIds: [] short-circuits without touching the DB
 *   - findTranscriptHits: a grant on library A never returns a cue from library B
 *   - findTranscriptHits: no lesson-resolving query when libraryIds is null (admin)
 *   - findTranscriptHits: maps cue + lesson/section/course context correctly
 *   - findTranscriptHits: returns empty array when no cues match any tier
 *   - findTranscriptHits: skips a cue whose lesson no longer exists
 *   - regression (#524): a tier's rows are never dropped by another tier's cap
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaSearchAdapter } from './prisma-search.adapter';

// ── helpers ──────────────────────────────────────────────────────────────────

interface MockLesson {
  groupBy: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

interface MockCourse {
  findMany: ReturnType<typeof vi.fn>;
}

interface MockTranscriptCue {
  findMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  course: MockCourse;
  lesson: MockLesson;
  transcriptCue: MockTranscriptCue;
}

function makePrisma(): MockPrisma {
  return {
    course: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    lesson: {
      groupBy: vi.fn().mockResolvedValue([]),
      findMany: vi.fn().mockResolvedValue([]),
    },
    transcriptCue: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

function makeCourseRow(
  overrides: Partial<{ id: string; libraryId: string; title: string; slug: string }> = {},
) {
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    title: 'Architecture Fundamentals',
    slug: 'architecture-fundamentals',
    ...overrides,
  };
}

function makeLessonRow(
  overrides: Partial<{
    id: string;
    courseId: string;
    position: number;
    title: string;
    section: { title: string; course: { title: string } };
  }> = {},
) {
  return {
    id: 'lesson-1',
    courseId: 'course-1',
    position: 1,
    title: 'Architectural drivers',
    section: {
      title: 'Domain Layer',
      course: { title: 'Architecture Fundamentals' },
    },
    ...overrides,
  };
}

function makeCueRow(
  overrides: Partial<{
    startMs: number;
    text: string;
    transcript: { lessonId: string; language: string };
  }> = {},
) {
  return {
    startMs: 42_000,
    text: "and that's where the architecture decision matters most",
    transcript: { lessonId: 'lesson-1', language: 'en' },
    ...overrides,
  };
}

function makeLessonContextRow(
  overrides: Partial<{
    id: string;
    courseId: string;
    title: string;
    section: { title: string; course: { title: string } };
  }> = {},
) {
  return {
    id: 'lesson-1',
    courseId: 'course-1',
    title: 'Architectural drivers',
    section: {
      title: 'Domain Layer',
      course: { title: 'Architecture Fundamentals' },
    },
    ...overrides,
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('PrismaSearchAdapter', () => {
  let prisma: MockPrisma;
  let adapter: PrismaSearchAdapter;

  beforeEach(() => {
    prisma = makePrisma();
    adapter = new PrismaSearchAdapter(prisma as never);
  });

  // ── findCourseHits ─────────────────────────────────────────────────────────

  describe('findCourseHits', () => {
    it('issues exactly 3 tier-scoped queries', async () => {
      await adapter.findCourseHits('arch', 20, null);

      expect(prisma.course.findMany).toHaveBeenCalledTimes(3);
    });

    it('tier 0 matches an exact title prefix', async () => {
      await adapter.findCourseHits('arch', 20, null);

      const tier0 = vi.mocked(prisma.course.findMany).mock.calls[0]?.[0] as {
        where: { title?: { startsWith?: string } };
      };
      expect(tier0.where.title?.startsWith).toBe('arch');
    });

    it('tier 1 matches a word prefix and excludes tier 0', async () => {
      await adapter.findCourseHits('arch', 20, null);

      const tier1 = vi.mocked(prisma.course.findMany).mock.calls[1]?.[0] as {
        where: { title?: { contains?: string }; NOT?: { title?: { startsWith?: string } } };
      };
      expect(tier1.where.title?.contains).toBe(' arch');
      expect(tier1.where.NOT?.title?.startsWith).toBe('arch');
    });

    it('tier 2 keeps the section-title OR clause and excludes tiers 0 and 1', async () => {
      await adapter.findCourseHits('arch', 20, null);

      const tier2 = vi.mocked(prisma.course.findMany).mock.calls[2]?.[0] as {
        where: { OR?: unknown[]; NOT?: unknown[] };
      };
      expect(tier2.where.OR).toHaveLength(2);
      expect(JSON.stringify(tier2.where.OR)).toContain('sections');
      expect(tier2.where.NOT).toHaveLength(2);
    });

    it('caps every tier at `limit` rows (not limit * 2)', async () => {
      await adapter.findCourseHits('arch', 10, null);

      for (const call of vi.mocked(prisma.course.findMany).mock.calls) {
        expect((call[0] as { take: number }).take).toBe(10);
      }
    });

    it('scopes every tier by libraryId for non-admin', async () => {
      await adapter.findCourseHits('arch', 20, ['lib-1', 'lib-2']);

      for (const call of vi.mocked(prisma.course.findMany).mock.calls) {
        const where = call[0] as { where: { libraryId?: { in: string[] } } };
        expect(where.where.libraryId?.in).toEqual(['lib-1', 'lib-2']);
      }
    });

    it('omits libraryId filter for admin (libraryIds = null)', async () => {
      await adapter.findCourseHits('arch', 20, null);

      for (const call of vi.mocked(prisma.course.findMany).mock.calls) {
        const where = call[0] as { where: { libraryId?: unknown } };
        expect(where.where.libraryId).toBeUndefined();
      }
    });

    it('maps concatenated rows across tiers + lesson counts to SearchCourseHitRow', async () => {
      const tier0Row = makeCourseRow({ id: 'course-1', title: 'Architecture Fundamentals' });
      const tier2Row = makeCourseRow({ id: 'course-2', title: 'Something Else', slug: 'else' });
      vi.mocked(prisma.course.findMany)
        .mockResolvedValueOnce([tier0Row])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([tier2Row]);
      vi.mocked(prisma.lesson.groupBy).mockResolvedValue([
        { courseId: 'course-1', _count: { id: 5 } },
      ]);

      const result = await adapter.findCourseHits('arch', 20, null);

      expect(result).toEqual([
        {
          id: 'course-1',
          libraryId: 'lib-1',
          title: 'Architecture Fundamentals',
          slug: 'architecture-fundamentals',
          lessonsTotal: 5,
        },
        {
          id: 'course-2',
          libraryId: 'lib-1',
          title: 'Something Else',
          slug: 'else',
          lessonsTotal: 0,
        },
      ]);
    });

    it('returns empty array when no tier returns rows', async () => {
      const result = await adapter.findCourseHits('arch', 20, null);

      expect(result).toEqual([]);
      expect(prisma.lesson.groupBy).not.toHaveBeenCalled();
    });
  });

  // ── findLessonHits ─────────────────────────────────────────────────────────

  describe('findLessonHits', () => {
    it('issues exactly 3 tier-scoped queries, each capped at `limit`', async () => {
      await adapter.findLessonHits('driver', 10, null);

      expect(prisma.lesson.findMany).toHaveBeenCalledTimes(3);
      for (const call of vi.mocked(prisma.lesson.findMany).mock.calls) {
        expect((call[0] as { take: number }).take).toBe(10);
      }
    });

    it('tier 0/1/2 mirror the course tiers, keyed on lesson.title', async () => {
      await adapter.findLessonHits('driver', 20, null);

      const calls = vi.mocked(prisma.lesson.findMany).mock.calls;
      const tier0 = calls[0]?.[0] as { where: { title?: { startsWith?: string } } };
      const tier1 = calls[1]?.[0] as {
        where: { title?: { contains?: string }; NOT?: { title?: { startsWith?: string } } };
      };
      const tier2 = calls[2]?.[0] as { where: { title?: { contains?: string }; NOT?: unknown[] } };

      expect(tier0.where.title?.startsWith).toBe('driver');
      expect(tier1.where.title?.contains).toBe(' driver');
      expect(tier1.where.NOT?.title?.startsWith).toBe('driver');
      expect(tier2.where.title?.contains).toBe('driver');
      expect(tier2.where.NOT).toHaveLength(2);
    });

    it('maps concatenated rows to SearchLessonHitRow including course + section titles', async () => {
      vi.mocked(prisma.lesson.findMany)
        .mockResolvedValueOnce([makeLessonRow()])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await adapter.findLessonHits('driver', 20, null);

      expect(result).toEqual([
        {
          id: 'lesson-1',
          courseId: 'course-1',
          courseTitle: 'Architecture Fundamentals',
          sectionTitle: 'Domain Layer',
          title: 'Architectural drivers',
          position: 1,
        },
      ]);
    });

    it('scopes every tier through section→course for non-admin', async () => {
      await adapter.findLessonHits('driver', 20, ['lib-1']);

      for (const call of vi.mocked(prisma.lesson.findMany).mock.calls) {
        const where = call[0] as {
          where: { section?: { course?: { libraryId?: { in: string[] } } } };
        };
        expect(where.where.section?.course?.libraryId?.in).toEqual(['lib-1']);
      }
    });

    it('omits the section filter for admin (libraryIds = null)', async () => {
      await adapter.findLessonHits('driver', 20, null);

      for (const call of vi.mocked(prisma.lesson.findMany).mock.calls) {
        expect(JSON.stringify((call[0] as { where: unknown }).where)).not.toContain('section');
      }
    });

    it('returns empty array when no tier returns rows', async () => {
      const result = await adapter.findLessonHits('driver', 20, null);

      expect(result).toEqual([]);
    });
  });

  // ── regression (#524) ────────────────────────────────────────────────────────

  it('#524: a word-prefix hit is never dropped because unrelated substring rows filled the shared cap', async () => {
    // Simulates the bug: an exact-prefix/word-prefix match must survive even
    // when tier 2 alone would already exceed `limit` with irrelevant noise.
    // Because each tier is now its own capped query, tier 1's result cannot be
    // starved by tier 2's candidate volume — the two calls are independent.
    const wordPrefixHit = makeLessonRow({ id: 'lesson-real', title: 'Лекция про биологию' });
    const substringNoise = Array.from({ length: 25 }, (_, i) =>
      makeLessonRow({ id: `noise-${i}`, title: `АвиаПодЛекция #${i}` }),
    );
    vi.mocked(prisma.lesson.findMany)
      .mockResolvedValueOnce([]) // tier 0: nothing starts with the query
      .mockResolvedValueOnce([wordPrefixHit]) // tier 1: the real word-prefix hit
      .mockResolvedValueOnce(substringNoise); // tier 2: unrelated substring noise

    const result = await adapter.findLessonHits('Лекция', 20, null);

    expect(result.some((r) => r.id === 'lesson-real')).toBe(true);
    // tier 1's own cap (`limit`) was never touched by tier 2's 25 noise rows.
    expect(vi.mocked(prisma.lesson.findMany).mock.calls[1]?.[0]).toMatchObject({ take: 20 });
  });

  // ── findTranscriptHits ─────────────────────────────────────────────────────

  describe('findTranscriptHits', () => {
    it('returns [] without touching the DB when libraryIds is []', async () => {
      const result = await adapter.findTranscriptHits('arch', 20, []);

      expect(result).toEqual([]);
      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
      expect(prisma.transcriptCue.findMany).not.toHaveBeenCalled();
    });

    it('issues exactly 3 tier-scoped cue queries, each capped at `limit`', async () => {
      await adapter.findTranscriptHits('arch', 15, null);

      expect(prisma.transcriptCue.findMany).toHaveBeenCalledTimes(3);
      for (const call of vi.mocked(prisma.transcriptCue.findMany).mock.calls) {
        expect((call[0] as { take: number }).take).toBe(15);
      }
    });

    it('never returns a cue from a library the caller has no grant on', async () => {
      // First lesson.findMany call resolves accessible lesson ids for the
      // granted library only.
      vi.mocked(prisma.lesson.findMany).mockResolvedValueOnce([{ id: 'lesson-1' }]);
      vi.mocked(prisma.transcriptCue.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([makeCueRow()])
        .mockResolvedValueOnce([]);
      vi.mocked(prisma.lesson.findMany).mockResolvedValueOnce([makeLessonContextRow()]);

      const result = await adapter.findTranscriptHits('arch', 20, ['lib-a']);

      // Every tier's cue query must be scoped to the resolved lesson ids — a
      // cue whose lesson lives in library B was never even a DB candidate.
      for (const call of vi.mocked(prisma.transcriptCue.findMany).mock.calls) {
        const where = call[0] as { where: { transcript?: { lessonId?: { in: string[] } } } };
        expect(where.where.transcript?.lessonId?.in).toEqual(['lesson-1']);
      }
      expect(result).toHaveLength(1);
      expect(result[0]?.lessonId).toBe('lesson-1');
    });

    it('returns [] without a cue query when the grant resolves to zero lessons', async () => {
      vi.mocked(prisma.lesson.findMany).mockResolvedValueOnce([]);

      const result = await adapter.findTranscriptHits('arch', 20, ['lib-a']);

      expect(result).toEqual([]);
      expect(prisma.transcriptCue.findMany).not.toHaveBeenCalled();
    });

    it('omits the lesson-resolving query for admin (libraryIds = null)', async () => {
      await adapter.findTranscriptHits('arch', 20, null);

      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
      for (const call of vi.mocked(prisma.transcriptCue.findMany).mock.calls) {
        const where = call[0] as { where: { transcript?: unknown } };
        expect(where.where.transcript).toBeUndefined();
      }
    });

    it('returns empty array when no tier matches any cue', async () => {
      const result = await adapter.findTranscriptHits('arch', 20, null);

      expect(result).toEqual([]);
      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
    });

    it('maps cue + lesson/section/course context to SearchTranscriptHitRow', async () => {
      vi.mocked(prisma.transcriptCue.findMany)
        .mockResolvedValueOnce([makeCueRow()])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      vi.mocked(prisma.lesson.findMany).mockResolvedValue([makeLessonContextRow()]);

      const result = await adapter.findTranscriptHits('arch', 20, null);

      expect(result).toEqual([
        {
          lessonId: 'lesson-1',
          lessonTitle: 'Architectural drivers',
          courseId: 'course-1',
          courseTitle: 'Architecture Fundamentals',
          sectionTitle: 'Domain Layer',
          language: 'en',
          startMs: 42_000,
          text: "and that's where the architecture decision matters most",
        },
      ]);
    });

    it('skips a cue whose lesson no longer exists', async () => {
      vi.mocked(prisma.transcriptCue.findMany)
        .mockResolvedValueOnce([makeCueRow()])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      vi.mocked(prisma.lesson.findMany).mockResolvedValue([]); // lesson deleted

      const result = await adapter.findTranscriptHits('arch', 20, null);

      expect(result).toEqual([]);
    });
  });
});
