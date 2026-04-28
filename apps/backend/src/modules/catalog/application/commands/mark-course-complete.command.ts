/**
 * WHY this file exists:
 * Command payload for POST /courses/{id}/mark-complete. Carries the course id
 * and the actor so the handler can authorise and then bulk-mark every lesson
 * as completed.
 */

export class MarkCourseCompleteCommand {
  constructor(
    readonly courseId: string,
    readonly actor: { id: string; role: string },
  ) {}
}
