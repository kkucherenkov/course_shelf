/**
 * Unit tests for PrismaSearchAdapter.
 * PrismaService is mocked — no real DB connection required.
 *
 * Covers:
 *   - findCourseHits: returns empty array when no rows
 *   - findCourseHits: maps rows + lesson counts correctly
 *   - findCourseHits: passes libraryId filter when libraryIds is not null
 *   - findCourseHits: no libraryId filter when libraryIds is null (admin)
 *   - findCourseHits: includes section-title-into-course OR clause
 *   - findLessonHits: returns empty array when no rows
 *   - findLessonHits: maps rows correctly including course + section titles
 *   - findLessonHits: passes libraryId filter through section→course relation
 *   - findLessonHits: no libraryId filter when libraryIds is null (admin)
 *   - findTranscriptHits: libraryIds: [] short-circuits without touching the DB
 *   - findTranscriptHits: a grant on library A never returns a cue from library B
 *   - findTranscriptHits: no lesson-resolving query when libraryIds is null (admin)
 *   - findTranscriptHits: maps cue + lesson/section/course context correctly
 *   - findTranscriptHits: returns empty array when no cues match
 *   - findTranscriptHits: skips a cue whose lesson no longer exists
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
    it('returns empty array when course.findMany returns no rows', async () => {
      vi.mocked(prisma.course.findMany).mockResolvedValue([]);

      const result = await adapter.findCourseHits('arch', 20, null);

      expect(result).toEqual([]);
      expect(prisma.lesson.groupBy).not.toHaveBeenCalled();
    });

    it('maps course rows and lesson counts to SearchCourseHitRow', async () => {
      const row = makeCourseRow();
      vi.mocked(prisma.course.findMany).mockResolvedValue([row]);
      vi.mocked(prisma.lesson.groupBy).mockResolvedValue([
        { courseId: 'course-1', _count: { id: 5 } },
      ]);

      const result = await adapter.findCourseHits('arch', 20, null);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'course-1',
        libraryId: 'lib-1',
        title: 'Architecture Fundamentals',
        slug: 'architecture-fundamentals',
        lessonsTotal: 5,
      });
    });

    it('returns lessonsTotal 0 for courses with no lessons', async () => {
      vi.mocked(prisma.course.findMany).mockResolvedValue([makeCourseRow()]);
      vi.mocked(prisma.lesson.groupBy).mockResolvedValue([]); // no counts

      const result = await adapter.findCourseHits('arch', 20, null);

      expect(result[0]?.lessonsTotal).toBe(0);
    });

    it('passes libraryId filter in where clause for non-admin', async () => {
      await adapter.findCourseHits('arch', 20, ['lib-1', 'lib-2']);

      const call = vi.mocked(prisma.course.findMany).mock.calls[0]?.[0] as {
        where: { AND?: unknown[] };
      };
      // Should be an AND clause with libraryId in-list
      expect(call?.where).toHaveProperty('AND');
    });

    it('omits libraryId filter for admin (libraryIds = null)', async () => {
      await adapter.findCourseHits('arch', 20, null);

      const call = vi.mocked(prisma.course.findMany).mock.calls[0]?.[0] as {
        where: { OR?: unknown[]; AND?: unknown[] };
      };
      // Admin path: no AND wrapper, just the OR clause
      expect(call?.where).not.toHaveProperty('AND');
      expect(call?.where).toHaveProperty('OR');
    });

    it('includes an OR with sections.some in the where clause (section-title-into-course)', async () => {
      await adapter.findCourseHits('arch', 20, null);

      const call = vi.mocked(prisma.course.findMany).mock.calls[0]?.[0] as {
        where: { OR: unknown[] };
      };
      const orClause = call?.where?.OR;
      expect(orClause).toHaveLength(2);
      // Second element should reference sections.some
      expect(JSON.stringify(orClause)).toContain('sections');
    });

    it('takes limit * 2 rows from the DB', async () => {
      await adapter.findCourseHits('arch', 10, null);

      const call = vi.mocked(prisma.course.findMany).mock.calls[0]?.[0] as { take: number };
      expect(call?.take).toBe(20);
    });
  });

  // ── findLessonHits ─────────────────────────────────────────────────────────

  describe('findLessonHits', () => {
    it('returns empty array when lesson.findMany returns no rows', async () => {
      vi.mocked(prisma.lesson.findMany).mockResolvedValue([]);

      const result = await adapter.findLessonHits('driver', 20, null);

      expect(result).toEqual([]);
    });

    it('maps lesson rows to SearchLessonHitRow including course + section titles', async () => {
      vi.mocked(prisma.lesson.findMany).mockResolvedValue([makeLessonRow()]);

      const result = await adapter.findLessonHits('driver', 20, null);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'lesson-1',
        courseId: 'course-1',
        courseTitle: 'Architecture Fundamentals',
        sectionTitle: 'Domain Layer',
        title: 'Architectural drivers',
        position: 1,
      });
    });

    it('passes libraryId filter through section→course relation for non-admin', async () => {
      await adapter.findLessonHits('driver', 20, ['lib-1']);

      const call = vi.mocked(prisma.lesson.findMany).mock.calls[0]?.[0] as {
        where: { section?: unknown };
      };
      expect(JSON.stringify(call?.where)).toContain('section');
      expect(JSON.stringify(call?.where)).toContain('lib-1');
    });

    it('omits libraryId filter for admin (libraryIds = null)', async () => {
      await adapter.findLessonHits('driver', 20, null);

      const call = vi.mocked(prisma.lesson.findMany).mock.calls[0]?.[0] as {
        where: { section?: unknown };
      };
      // Admin path: no section nested filter
      expect(JSON.stringify(call?.where)).not.toContain('section');
    });

    it('takes limit * 2 rows from the DB', async () => {
      await adapter.findLessonHits('driver', 10, null);

      const call = vi.mocked(prisma.lesson.findMany).mock.calls[0]?.[0] as { take: number };
      expect(call?.take).toBe(20);
    });
  });

  // ── findTranscriptHits ─────────────────────────────────────────────────────

  describe('findTranscriptHits', () => {
    it('returns [] without touching the DB when libraryIds is []', async () => {
      const result = await adapter.findTranscriptHits('arch', 20, []);

      expect(result).toEqual([]);
      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
      expect(prisma.transcriptCue.findMany).not.toHaveBeenCalled();
    });

    it('never returns a cue from a library the caller has no grant on', async () => {
      // First lesson.findMany call resolves accessible lesson ids for the
      // granted library only.
      vi.mocked(prisma.lesson.findMany).mockResolvedValueOnce([{ id: 'lesson-1' }]);
      vi.mocked(prisma.transcriptCue.findMany).mockResolvedValue([makeCueRow()]);
      vi.mocked(prisma.lesson.findMany).mockResolvedValueOnce([makeLessonContextRow()]);

      const result = await adapter.findTranscriptHits('arch', 20, ['lib-a']);

      // The cue query must be scoped to the resolved lesson ids — a cue whose
      // lesson lives in library B was never even a DB candidate.
      const cueCall = vi.mocked(prisma.transcriptCue.findMany).mock.calls[0]?.[0] as {
        where: { transcript?: { lessonId?: { in: string[] } } };
      };
      expect(cueCall?.where?.transcript?.lessonId?.in).toEqual(['lesson-1']);
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
      const cueCall = vi.mocked(prisma.transcriptCue.findMany).mock.calls[0]?.[0] as {
        where: { transcript?: unknown };
      };
      expect(cueCall?.where?.transcript).toBeUndefined();
    });

    it('returns empty array when no cues match', async () => {
      vi.mocked(prisma.transcriptCue.findMany).mockResolvedValue([]);

      const result = await adapter.findTranscriptHits('arch', 20, null);

      expect(result).toEqual([]);
      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
    });

    it('maps cue + lesson/section/course context to SearchTranscriptHitRow', async () => {
      vi.mocked(prisma.transcriptCue.findMany).mockResolvedValue([makeCueRow()]);
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
      vi.mocked(prisma.transcriptCue.findMany).mockResolvedValue([makeCueRow()]);
      vi.mocked(prisma.lesson.findMany).mockResolvedValue([]); // lesson deleted

      const result = await adapter.findTranscriptHits('arch', 20, null);

      expect(result).toEqual([]);
    });

    it('takes limit * 2 cues from the DB', async () => {
      await adapter.findTranscriptHits('arch', 10, null);

      const call = vi.mocked(prisma.transcriptCue.findMany).mock.calls[0]?.[0] as {
        take: number;
      };
      expect(call?.take).toBe(20);
    });
  });
});
