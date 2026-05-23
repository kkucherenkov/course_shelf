/**
 * WHY this file exists:
 * Plain data object for replacing the studio set on a course. Mirrors
 * SetCourseInstructorsCommand — studios are a parallel linking concept.
 */
export class SetCourseStudiosCommand {
  constructor(
    public readonly courseId: string,
    public readonly studioIds: readonly string[],
  ) {}
}
