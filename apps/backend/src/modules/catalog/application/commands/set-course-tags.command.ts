/**
 * WHY this file exists:
 * Plain data object for replacing the tag set on a course. Mirrors
 * SetCourseInstructorsCommand — tags are a parallel linking concept.
 */
export class SetCourseTagsCommand {
  constructor(
    public readonly courseId: string,
    public readonly tagIds: readonly string[],
  ) {}
}
