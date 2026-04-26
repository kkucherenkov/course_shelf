/**
 * WHY this file exists:
 * A Query is a plain data object representing a read-side request.
 * ListLibraries carries the actor so the handler can filter out libraries
 * the caller has no grant for (non-admins see only their granted libraries;
 * admins see all — handled transparently by AuthorizationService).
 */
export class ListLibrariesQuery {
  constructor(public readonly actor: { id: string; role: string }) {}
}
