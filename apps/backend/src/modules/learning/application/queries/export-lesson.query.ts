/**
 * WHY this file exists:
 * Query payload for GET /lessons/{lessonId}/export. The actor is required so
 * the handler can enforce the same visibility rule GetLessonHandler applies.
 */
export class ExportLessonQuery {
  constructor(
    public readonly lessonId: string,
    public readonly actor: { id: string; role: string },
  ) {}
}
