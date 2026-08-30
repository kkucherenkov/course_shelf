/**
 * WHY this file exists:
 * Carries the input data for RunTranscriptionHandler. Immutable value object;
 * no class-validator decorators needed because express-openapi-validator checks
 * the request shape at the middleware layer.
 */
export class RunTranscriptionCommand {
  constructor(
    readonly libraryId: string,
    readonly force: boolean,
    readonly actorUserId: string,
  ) {}
}
