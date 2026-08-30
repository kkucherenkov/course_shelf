/**
 * WHY this file exists:
 * Carries the input data for ListTranscriptionsHandler. Immutable value object.
 * `limit` is already defaulted and range-checked by the OpenAPI validator.
 */
export class ListTranscriptionsQuery {
  constructor(
    readonly libraryId: string,
    readonly limit: number,
  ) {}
}
