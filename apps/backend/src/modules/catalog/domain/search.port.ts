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

export interface SearchPort {
  /**
   * Return up to `limit` courses whose title ILIKE %q% OR whose any section
   * title ILIKE %q%. Distinct on course id. When libraryIds is null, no
   * library filter is applied (admin path).
   *
   * The adapter MAY return more than `limit` rows — the handler is responsible
   * for the final slice. In practice the adapter passes `take: limit` directly
   * to Prisma for efficiency.
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
}
