/**
 * WHY this file exists:
 * Command payload for POST /courses/{id}/reset-progress. Carries the course id
 * and the actor so the handler can authorise and then delete all LessonProgress
 * rows for (actor, course).
 */

export class ResetCourseProgressCommand {
  constructor(
    readonly courseId: string,
    readonly actor: { id: string; role: string },
  ) {}
}
