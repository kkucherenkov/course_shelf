/**
 * WHY this file exists:
 * Query payload for listing courses. libraryId is optional — when supplied the
 * handler fetches only courses from that library; when absent it fetches all
 * (admins only; non-admins receive the filtered subset).
 */
export class ListCoursesQuery {
  constructor(
    public readonly actor: { id: string; role: string },
    public readonly libraryId?: string,
  ) {}
}
