/**
 * WHY this file exists:
 * Query payload for listing tags with optional pagination, search, and category
 * filter. The category filter is unique to Tag (instructors and studios have no
 * category concept).
 */
export class ListTagsQuery {
  constructor(
    public readonly offset: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly category?: string,
  ) {}
}
