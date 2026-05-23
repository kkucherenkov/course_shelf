/**
 * WHY this file exists:
 * Query payload for fetching a single Studio by its slug, including a
 * paginated slice of the courses linked to it.
 */
export class GetStudioQuery {
  constructor(
    public readonly slug: string,
    public readonly coursesOffset = 0,
    public readonly coursesLimit = 20,
  ) {}
}
