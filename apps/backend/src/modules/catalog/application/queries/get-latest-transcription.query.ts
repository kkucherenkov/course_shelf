/**
 * WHY this file exists:
 * Carries the input data for GetLatestTranscriptionHandler. Immutable value object.
 */
export class GetLatestTranscriptionQuery {
  constructor(readonly libraryId: string) {}
}
