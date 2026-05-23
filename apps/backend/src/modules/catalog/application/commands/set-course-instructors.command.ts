/**
 * WHY this file exists:
 * Plain data object for replacing the instructor set on a course. The operation
 * is idempotent set-replace — passing the same list twice yields the same result.
 * Order in the instructorIds array is preserved through the position field.
 */
export class SetCourseInstructorsCommand {
  constructor(
    public readonly courseId: string,
    public readonly instructorIds: readonly string[],
  ) {}
}
