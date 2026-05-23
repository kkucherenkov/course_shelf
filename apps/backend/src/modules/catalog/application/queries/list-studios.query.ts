/**
 * WHY this file exists:
 * Query payload for listing studios with optional pagination and search.
 */
export class ListStudiosQuery {
  constructor(
    public readonly offset: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {}
}
