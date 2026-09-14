/**
 * WHY this file exists:
 * Domain port for catalogue search. Keeps the application layer free of Prisma
 * types — only this interface + Symbol token are imported by the query handler.
 * The Prisma adapter in infra/ implements it and is bound via the token in
 * CatalogModule.
 *
 * libraryIds === null means "no library filter" (admin path — see everything).
 * An empty array means "user has grants on zero libraries" → adapter MUST return
 * an empty array without hitting the DB.
 */

export const SEARCH_PORT = Symbol('SEARCH_PORT');

export interface SearchCourseHitRow {
  id: string;
  libraryId: string;
  title: string;
  slug: string;
  lessonsTotal: number;
}

export interface SearchLessonHitRow {
  id: string;
  courseId: string;
  courseTitle: string;
  sectionTitle: string;
  title: string;
  position: number;
}

export interface SearchTranscriptHitRow {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  sectionTitle: string;
  language: string;
  startMs: number;
  text: string;
}

export interface SearchPort {
  /**
   * Return up to `limit` courses whose title ILIKE %q% OR whose any section
   * title ILIKE %q%. Distinct on course id. When libraryIds is null, no
   * library filter is applied (admin path).
   *
   * The adapter MAY return up to 3× `limit` rows — it runs three tier-scoped
   * queries (exact-prefix, word-prefix, everything else, see #524) each
   * capped at `limit`, so a high-tier hit can never be crowded out by
   * lower-tier noise sharing a single cap. The handler re-ranks and takes the
   * final slice.
   */
  findCourseHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchCourseHitRow[]>;

  /**
   * Return up to `limit` lessons whose title ILIKE %q%. Carries parent course
   * title + section title. When libraryIds is null, no library filter is applied.
   */
  findLessonHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchLessonHitRow[]>;

  /**
   * Return up to `limit` transcript cues whose text ILIKE %q%, backed by the
   * pg_trgm GIN index on transcript_cue.text. Carries the parent lesson /
   * section / course context plus the cue's language and startMs so a client
   * can seek straight to the moment. When libraryIds is null, no library
   * filter is applied (admin path).
   */
  findTranscriptHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchTranscriptHitRow[]>;
}
