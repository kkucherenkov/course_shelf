/**
 * WHY this file exists:
 * Domain event emitted on every accepted progress write (regardless of whether
 * the 90 % completion threshold was crossed). Added in E10-F01-S01 so the
 * CourseProgressReadModel projection in Catalog tracks in-progress views —
 * without it "Continue watching" would only surface courses with at least one
 * completed lesson, which is too late in the UX funnel.
 *
 * Published by RecordProgressHandler whenever `result.accepted === true`.
 * Publish order: LessonProgressRecorded first, then LessonCompleted (if
 * completedThisCall). Downstream subscribers must be idempotent.
 *
 * Plain class — no @EventsHandler decorator here; that lives in the subscriber.
 */
export class LessonProgressRecorded {
  constructor(
    readonly userId: string,
    readonly lessonId: string,
    readonly courseId: string,
    readonly positionSeconds: number,
    readonly recordedAt: Date,
  ) {}
}
