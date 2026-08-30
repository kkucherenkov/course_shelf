/**
 * WHY this file exists:
 * Query payload for listing courses. libraryId is optional — when supplied the
 * handler fetches only courses from that library; when absent it fetches all
 * (admins only; non-admins receive the filtered subset).
 *
 * `status` and `sort` back the Browse page filters (E14-F01-S02);
 * `durationBucket` and `instructorId`, and the `duration` sort, complete the
 * set the cs-web-browse-search bundle specified (E31-F01-S01). All of them
 * default to the no-op value at the controller layer so non-Browse callers
 * (admin pages, mobile) keep their previous behaviour without passing them.
 */
export type CourseListStatus = 'all' | 'not-started' | 'in-progress' | 'completed';
export type CourseListSort = 'recently-watched' | 'newest' | 'alphabetical' | 'duration';
export type CourseListDurationBucket = 'all' | 'lt5' | '5to10' | '10to20' | 'gt20';

export class ListCoursesQuery {
  constructor(
    public readonly actor: { id: string; role: string },
    public readonly libraryId?: string,
    public readonly status: CourseListStatus = 'all',
    public readonly sort: CourseListSort = 'recently-watched',
    public readonly durationBucket: CourseListDurationBucket = 'all',
    public readonly instructorId?: string,
  ) {}
}
