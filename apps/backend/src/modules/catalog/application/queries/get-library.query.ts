/**
 * WHY this file exists:
 * A Query is a plain data object representing a read-side request.
 * GetLibrary fetches a single library by its server-generated id.
 * The actor is required so the handler can enforce visibility (non-admins
 * without a matching grant receive PermissionDenied, not the library data).
 */
export class GetLibraryQuery {
  constructor(
    public readonly id: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
