/**
 * WHY this file exists:
 * Carries the input data for the RunScanHandler command. Immutable value object;
 * no class-validator decorators needed because express-openapi-validator handles
 * request shape at the middleware layer.
 *
 * Scope (E32-F01-S02): `libraryId` is optional because the course-rescan entry
 * point (POST /courses/{id}/rescan) only ever has a courseId from the URL —
 * the handler resolves the library from the course. The library-wide entry
 * point (POST /libraries/{id}/scans) always passes `libraryId` and no scope,
 * unchanged from before this story.
 */
export interface RunScanScope {
  readonly courseId: string;
}

export class RunScanCommand {
  constructor(
    readonly libraryId: string | undefined,
    readonly actorUserId: string,
    readonly scope?: RunScanScope,
  ) {}
}
