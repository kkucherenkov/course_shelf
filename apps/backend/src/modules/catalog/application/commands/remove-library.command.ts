/**
 * WHY this file exists:
 * Plain data object carrying the id of the library to be permanently removed.
 * The handler delegates the full cascade teardown to the repository adapter,
 * which keeps all deletion logic co-located with the data access layer.
 */
export class RemoveLibraryCommand {
  constructor(public readonly id: string) {}
}
