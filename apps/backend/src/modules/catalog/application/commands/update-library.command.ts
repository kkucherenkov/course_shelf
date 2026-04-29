/**
 * WHY this file exists:
 * Plain data object carrying the inputs for the admin-only PATCH /libraries/{id}
 * endpoint. The patch is a partial — `name` is the only mutable field; changing
 * `rootPath` is intentionally unsupported (it would invalidate all media paths
 * and require a full re-scan).
 */
export class UpdateLibraryCommand {
  constructor(
    public readonly id: string,
    public readonly patch: { name?: string },
  ) {}
}
