/**
 * WHY this file exists:
 * Query payload for GET /lessons/{id}/stream-url. Carries the lesson id and
 * the resolved actor so the handler can perform AuthorizationService checks
 * without touching the HTTP layer.
 */
export class IssueStreamTokenQuery {
  constructor(
    public readonly lessonId: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
