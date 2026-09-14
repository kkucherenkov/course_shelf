/**
 * WHY this file exists:
 * Carries the input data for RunTranscriptionHandler. Immutable value object;
 * no class-validator decorators needed because express-openapi-validator checks
 * the request shape at the middleware layer.
 *
 * Scope (E32-F02-S01): `libraryId` is optional because the course entry point
 * (POST /courses/{id}/transcription) only ever has a courseId from the URL —
 * the handler resolves the library from the course. The library-wide entry
 * point (POST /libraries/{id}/transcriptions) always passes `libraryId` and no
 * scope, unchanged. Shaped exactly like `RunScanCommand`.
 */
export interface RunTranscriptionScope {
  readonly courseId: string;
}

export class RunTranscriptionCommand {
  constructor(
    readonly libraryId: string | undefined,
    readonly force: boolean,
    readonly actorUserId: string,
    readonly scope?: RunTranscriptionScope,
    /** Overrides `WHISPER_LANGUAGE` for this run only. Undefined = use the config. */
    readonly language?: string,
  ) {}
}
