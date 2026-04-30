/**
 * WHY this file exists:
 * Carries the input data for the RunScanHandler command. Immutable value object;
 * no class-validator decorators needed because express-openapi-validator handles
 * request shape at the middleware layer.
 */
export class RunScanCommand {
  constructor(
    readonly libraryId: string,
    readonly actorUserId: string,
  ) {}
}
