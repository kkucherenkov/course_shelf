/**
 * WHY this file exists:
 * Carries the input data for GetLatestScanHandler. Immutable value object.
 */
export class GetLatestScanQuery {
  constructor(readonly libraryId: string) {}
}
