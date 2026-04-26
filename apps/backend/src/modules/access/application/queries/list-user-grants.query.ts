/**
 * WHY this file exists:
 * Query carrying the userId whose grants should be listed. Plain data object.
 */
export class ListUserGrantsQuery {
  constructor(public readonly userId: string) {}
}
