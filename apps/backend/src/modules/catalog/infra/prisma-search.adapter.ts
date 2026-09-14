/**
 * WHY this file exists:
 * Prisma adapter that implements the SearchPort. All raw SQL-ish concerns live
 * here; the handler sees only the clean SearchPort interface.
 *
 * Tiering (see #524):
 *   A single query ordered by title/text and capped at `take` can silently
 *   drop a high-tier hit: once the library holds more matches than the cap,
 *   rows are truncated ALPHABETICALLY ACROSS THE WHOLE TABLE before the
 *   handler ever gets to rank them, so an exact-prefix or word-prefix hit for
 *   one course can be crowded out of the window by unrelated substring-only
 *   noise from other courses that happens to sort earlier. Each findXHits
 *   method below instead runs three mutually-exclusive, independently-capped
 *   queries — exact-prefix, word-prefix, everything else — and concatenates
 *   them in priority order. A tier's true best (up to `limit`) rows always
 *   survive, so the handler's JS ranking (prefix > word-prefix > substring,
 *   see search-catalogue.handler.ts) can no longer be starved by a shared cap.
 *   "Word-prefix" is approximated as "a space immediately precedes q" (plus
 *   q at the very start) rather than a `\s+`-aware regex — matches the
 *   handler's rankTier for the space-delimited titles a scan actually
 *   produces, no regex, no extra dependency.
 *
 * Course hits:
 *   title/section tiers combine with a `sections.some` OR clause (unindexed
 *   this way in the DB, matched into its course) so a course whose OWN title
 *   doesn't match at all can still hit via a section title — ranked tier 2
 *   only, since ranking is keyed on the course's own title (see
 *   search-catalogue.handler.ts). lessonsTotal is derived via a follow-up
 *   `groupBy` on lesson (same bulk pattern used by other handlers — no N+1).
 *
 * Lesson hits:
 *   Tiered `findMany` on the lesson table. The `section` relation (course
 *   title + section title) is included via `select` so we avoid any N+1
 *   fan-out.
 *
 * Transcript hits:
 *   `TranscriptCue.text` is matched the same tiered way, backed by a pg_trgm
 *   GIN index (see migration 20260913093859) rather than a btree — substring
 *   search on free text needs a trigram index to stay off a full table scan.
 *   `Transcript` deliberately carries no Prisma relation to `Lesson` (see
 *   schema.prisma) — a scan rewrites a lesson's subtitles by delete+recreate,
 *   and a cascade from either side would erase transcripts the next time it
 *   runs — so the join back to lesson/section/course context is a second bulk
 *   `findMany({ where: { id: { in: ... } } })`, not a nested `select`. Library
 *   scoping goes through the same two-step shape: resolve accessible lesson
 *   ids first, then constrain the cue query to them, so an inaccessible
 *   library's cues are never fetched even as candidates.
 *
 * Library filter:
 *   When libraryIds !== null a `libraryId: { in: libraryIds }` clause is added
 *   to the course/lesson queries (and its lesson-id-resolving equivalent for
 *   transcripts) so only accessible courses/lessons are returned.
 *
 * Title/text substring indexes:
 *   `course.title`, `section.title` and `lesson.title` each carry a pg_trgm
 *   GIN index (migration 20260914150617), same as transcript_cue.text — an
 *   ordinary btree can't serve a `LIKE '%q%'` substring scan.
 *
 * Punctuation: the query is matched against the raw title/text — one stray
 * punctuation character right at the match point still defeats it (e.g. a
 * query spanning a "#N." boundary). Deliberately out of scope here — see
 * `specs/tasks/active.md` T-2026-09-14-search-substring for the reasoning and
 * the follow-up.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type {
  SearchPort,
  SearchCourseHitRow,
  SearchLessonHitRow,
  SearchTranscriptHitRow,
} from '../domain/search.port';
import type { Prisma } from '@prisma/client';

// ── tier conditions ──────────────────────────────────────────────────────────

const startsWithQ = (q: string): Prisma.StringFilter => ({
  startsWith: q,
  mode: 'insensitive',
});
const wordPrefixOnlyQ = (q: string): Prisma.StringFilter => ({
  contains: ` ${q}`,
  mode: 'insensitive',
});
const containsQ = (q: string): Prisma.StringFilter => ({
  contains: q,
  mode: 'insensitive',
});

@Injectable()
export class PrismaSearchAdapter implements SearchPort {
  constructor(private readonly prisma: PrismaService) {}

  async findCourseHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchCourseHitRow[]> {
    const sectionMatch: Prisma.CourseWhereInput = {
      sections: { some: { title: containsQ(q) } },
    };

    const tiers: Prisma.CourseWhereInput[] = [
      { title: startsWithQ(q) },
      { title: wordPrefixOnlyQ(q), NOT: { title: startsWithQ(q) } },
      {
        OR: [{ title: containsQ(q) }, sectionMatch],
        NOT: [{ title: startsWithQ(q) }, { title: wordPrefixOnlyQ(q) }],
      },
    ];

    const rows = await this.findManyTiered(tiers, libraryIds, (where) =>
      this.prisma.course.findMany({
        where,
        select: { id: true, libraryId: true, title: true, slug: true },
        take: limit,
        orderBy: { title: 'asc' },
      }),
    );

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
    const tiers: Prisma.LessonWhereInput[] = [
      { title: startsWithQ(q) },
      { title: wordPrefixOnlyQ(q), NOT: { title: startsWithQ(q) } },
      {
        title: containsQ(q),
        NOT: [{ title: startsWithQ(q) }, { title: wordPrefixOnlyQ(q) }],
      },
    ];

    const rows = await this.findManyTiered(
      tiers,
      libraryIds,
      (where) =>
        this.prisma.lesson.findMany({
          where,
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
          take: limit,
          orderBy: { title: 'asc' },
        }),
      (where, ids) => ({ ...where, section: { course: { libraryId: { in: ids } } } }),
    );

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

    const tiers: Prisma.TranscriptCueWhereInput[] = [
      { text: startsWithQ(q) },
      { text: wordPrefixOnlyQ(q), NOT: { text: startsWithQ(q) } },
      {
        text: containsQ(q),
        NOT: [{ text: startsWithQ(q) }, { text: wordPrefixOnlyQ(q) }],
      },
    ];
    const scoped = (where: Prisma.TranscriptCueWhereInput): Prisma.TranscriptCueWhereInput =>
      accessibleLessonIds
        ? { ...where, transcript: { lessonId: { in: accessibleLessonIds } } }
        : where;

    const cueRows = await Promise.all(
      tiers.map((tier) =>
        this.prisma.transcriptCue.findMany({
          where: scoped(tier),
          select: {
            startMs: true,
            text: true,
            transcript: { select: { lessonId: true, language: true } },
          },
          take: limit,
          orderBy: { startMs: 'asc' },
        }),
      ),
    );
    const cues = cueRows.flat();

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

  /**
   * Run one findMany per tier (already priority-ordered: exact-prefix, word-
   * prefix, everything else), each independently capped and AND-scoped to
   * `libraryIds` (unless null — admin, no filter), then concatenate. Tiers
   * are mutually exclusive by construction, so the result never has a
   * duplicate row. `scopeLibrary` lets a caller override how the library
   * filter is attached (lesson's goes through `section.course`, course's
   * through its own column).
   */
  private async findManyTiered<Where extends object, Row>(
    tiers: Where[],
    libraryIds: string[] | null,
    run: (where: Where) => Promise<Row[]>,
    scopeLibrary: (where: Where, ids: string[]) => Where = (where, ids) => ({
      ...where,
      libraryId: { in: ids },
    }),
  ): Promise<Row[]> {
    const scoped =
      libraryIds === null ? tiers : tiers.map((tier) => scopeLibrary(tier, libraryIds));
    const results = await Promise.all(scoped.map((where) => run(where)));
    return results.flat();
  }
}
