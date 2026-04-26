/**
 * WHY this file exists:
 * Query payload for fetching a single Course by its server-generated id.
 * The actor is required so the handler can enforce per-user visibility.
 */
export class GetCourseQuery {
  constructor(
    public readonly id: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
