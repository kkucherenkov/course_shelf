/**
 * WHY this file exists:
 * Query payload for GET /courses/{courseId}/export. The actor is required so
 * the handler can enforce the same visibility rule GetCourseHandler applies.
 */
export class ExportCourseQuery {
  constructor(
    public readonly courseId: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
