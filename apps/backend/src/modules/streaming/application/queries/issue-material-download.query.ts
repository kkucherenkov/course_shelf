/**
 * WHY this file exists:
 * Query payload for GET /lessons/{lessonId}/materials/{materialId}/download-url.
 * Carries the lesson id, material id, and the resolved actor so the handler can
 * perform AuthorizationService checks without touching the HTTP layer.
 */
export class IssueMaterialDownloadQuery {
  constructor(
    public readonly lessonId: string,
    public readonly materialId: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
