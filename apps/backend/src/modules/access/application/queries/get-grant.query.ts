/**
 * WHY this file exists:
 * Query carrying the id of the grant to fetch. Plain data object.
 */
export class GetGrantQuery {
  constructor(public readonly id: string) {}
}
