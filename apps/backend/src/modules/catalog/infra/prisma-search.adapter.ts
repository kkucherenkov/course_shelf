/**
 * WHY this file exists:
 * Prisma adapter that implements the SearchPort. All raw SQL-ish concerns live
 * here; the handler sees only the clean SearchPort interface.
 *
 * Course hits:
 *   Uses a single Prisma `findMany` with an `OR` clause:
 *     title ILIKE %q%   OR   sections: { some: { title ILIKE %q% } }
 *   Prisma compiles this to an EXISTS subquery per condition — the result is
 *   already distinct on course id (findMany on the course table returns one row
 *   per course). lessonsTotal is derived via a follow-up `groupBy` on lesson
 *   (same bulk pattern used by other handlers — no N+1).
 *
 * Lesson hits:
 *   Single `findMany` on the lesson table with `title ILIKE %q%`. The `section`
 *   relation (course title + section title) is included via `select` so we
 *   avoid any N+1 fan-out.
 *
 * Transcript hits:
 *   `TranscriptCue.text` is matched the same way (`contains`, insensitive),
 *   backed by a pg_trgm GIN index (see the migration) rather than a btree —
 *   substring search on free text needs a trigram index to stay off a full
 *   table scan. `Transcript` deliberately carries no Prisma relation to
 *   `Lesson` (see schema.prisma) — a scan rewrites a lesson's subtitles by
 *   delete+recreate, and a cascade from either side would erase transcripts
 *   the next time it runs — so the join back to lesson/section/course context
 *   is a second bulk `findMany({ where: { id: { in: ... } } })`, not a nested
 *   `select`. Library scoping goes through the same two-step shape: resolve
 *   accessible lesson ids first, then constrain the cue query to them, so an
 *   inaccessible library's cues are never fetched even as candidates.
 *
 * Library filter:
 *   When libraryIds !== null a `libraryId: { in: libraryIds }` clause is added
 *   to the course/lesson queries (and its lesson-id-resolving equivalent for
 *   transcripts) so only accessible courses/lessons are returned.
 *
 * Ranking:
 *   DB-level ORDER BY is intentionally omitted here beyond a simple title asc
 *   tiebreaker — the handler applies multi-tier JS ranking
 *   (prefix > word-start > substring, then alpha) after the fetch.
 *   Result sets are capped at `limit * 2` from the DB (max 200 rows) so JS
 *   ranking has negligible cost.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type {
  SearchPort,
  SearchCourseHitRow,
  SearchLessonHitRow,
  SearchTranscriptHitRow,
} from '../domain/search.port';

@Injectable()
export class PrismaSearchAdapter implements SearchPort {
  constructor(private readonly prisma: PrismaService) {}

  async findCourseHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchCourseHitRow[]> {
    // Build the where clause: match on course title OR any section title.
    const titleOrSection = {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { sections: { some: { title: { contains: q, mode: 'insensitive' as const } } } },
      ],
    };

    const where =
      libraryIds === null
        ? titleOrSection
        : { AND: [titleOrSection, { libraryId: { in: libraryIds } }] };

    const rows = await this.prisma.course.findMany({
      where,
      select: {
        id: true,
        libraryId: true,
        title: true,
        slug: true,
      },
      // Fetch a larger candidate pool so JS ranking can pick the best `limit` hits
      // even when some rows were matched via section title only.
      take: limit * 2,
      orderBy: { title: 'asc' },
    });

    if (rows.length === 0) return [];

    // Bulk-fetch lesson counts in one groupBy — same pattern as findRecentlyAdded.
    const courseIds = rows.map((r) => r.id);
    const lessonCounts = await this.prisma.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { id: true },
    });

    const countMap = new Map(lessonCounts.map((lc) => [lc.courseId, lc._count.id]));

    return rows.map((r) => ({
      id: r.id,
      libraryId: r.libraryId,
      title: r.title,
      slug: r.slug,
      lessonsTotal: countMap.get(r.id) ?? 0,
    }));
  }

  async findLessonHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchLessonHitRow[]> {
    const lessonWhere =
      libraryIds === null
        ? { title: { contains: q, mode: 'insensitive' as const } }
        : {
            title: { contains: q, mode: 'insensitive' as const },
            section: { course: { libraryId: { in: libraryIds } } },
          };

    const rows = await this.prisma.lesson.findMany({
      where: lessonWhere,
      select: {
        id: true,
        courseId: true,
        position: true,
        title: true,
        section: {
          select: {
            title: true,
            course: {
              select: { title: true },
            },
          },
        },
      },
      take: limit * 2,
      orderBy: { title: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      courseId: r.courseId,
      courseTitle: r.section.course.title,
      sectionTitle: r.section.title,
      title: r.title,
      position: r.position,
    }));
  }

  // ponytail: substring match via `contains` + the pg_trgm GIN index, no
  // stemming, no ts_rank — see design §6.2. Upgrade path if that turns out to
  // matter: a second (tsvector) index and a swapped WHERE behind this same
  // method, callers unaffected.
  // ponytail: for a non-null libraryIds this fetches every lesson id in the
  // accessible libraries, unbounded, then passes the whole array into the
  // cue query's IN clause — fine for a self-hosted library, a large query on
  // a library with thousands of lessons. Filtering access before fetching
  // candidates is the right call regardless of size (the alternative, a
  // cue-pool-first filter, trades this for false negatives — a narrowly
  // scoped user seeing zero hits while matching cues sit deeper in the
  // pool), so the fix isn't to invert this, it's to stop needing the
  // resolve step: give Transcript a real relation to Lesson, or denormalise
  // libraryId onto transcript_cue, either of which turns this into one join.
  async findTranscriptHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchTranscriptHitRow[]> {
    let accessibleLessonIds: string[] | undefined;

    if (libraryIds !== null) {
      if (libraryIds.length === 0) return [];

      const accessibleLessons = await this.prisma.lesson.findMany({
        where: { section: { course: { libraryId: { in: libraryIds } } } },
        select: { id: true },
      });
      if (accessibleLessons.length === 0) return [];
      accessibleLessonIds = accessibleLessons.map((l) => l.id);
    }

    const cues = await this.prisma.transcriptCue.findMany({
      where: {
        text: { contains: q, mode: 'insensitive' as const },
        ...(accessibleLessonIds ? { transcript: { lessonId: { in: accessibleLessonIds } } } : {}),
      },
      select: {
        startMs: true,
        text: true,
        transcript: { select: { lessonId: true, language: true } },
      },
      take: limit * 2,
      orderBy: { startMs: 'asc' },
    });

    if (cues.length === 0) return [];

    // Bulk-fetch lesson + section + course context — same no-N+1 pattern as
    // findCourseHits' lesson-count groupBy, required here because Transcript
    // carries a plain lessonId column, not a Prisma relation (see the docblock
    // above).
    const lessonIds = [...new Set(cues.map((c) => c.transcript.lessonId))];
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      select: {
        id: true,
        courseId: true,
        title: true,
        section: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
    });
    const lessonById = new Map(lessons.map((l) => [l.id, l]));

    const rows: SearchTranscriptHitRow[] = [];
    for (const cue of cues) {
      const lesson = lessonById.get(cue.transcript.lessonId);
      // Orphaned cue (lesson deleted, cleanup hasn't run yet) — skip rather
      // than surface a hit with no valid lesson to link to.
      if (!lesson) continue;
      rows.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseId: lesson.courseId,
        courseTitle: lesson.section.course.title,
        sectionTitle: lesson.section.title,
        language: cue.transcript.language,
        startMs: cue.startMs,
        text: cue.text,
      });
    }
    return rows;
  }
}
