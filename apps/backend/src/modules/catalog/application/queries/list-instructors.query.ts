/**
 * WHY this file exists:
 * Query payload for listing instructors with optional pagination and search.
 * No actor is needed — all authenticated users can list catalog entities.
 */
export class ListInstructorsQuery {
  constructor(
    public readonly offset: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {}
}
