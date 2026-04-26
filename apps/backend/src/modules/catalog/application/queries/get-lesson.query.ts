/**
 * WHY this file exists:
 * Query payload for fetching a single Lesson by its server-generated id.
 * The actor is required so the handler can enforce per-user visibility via
 * AuthorizationService.
 */
export class GetLessonQuery {
  constructor(
    public readonly id: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
