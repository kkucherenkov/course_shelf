/**
 * WHY this file exists:
 * Domain event emitted exactly once per (userId, lessonId) pair when the user's
 * watch position crosses the 90 % threshold. The handler publishes it via Nest's
 * EventBus — the only cross-context notification mechanism allowed in this repo.
 *
 * courseId is attached by the handler (after the lesson lookup) so downstream
 * subscribers (e.g., E10 CourseProgressProjector) don't need a round-trip to
 * resolve the parent course.
 *
 * Plain class — no @EventsHandler decorator here; that lives in the subscriber.
 */
export class LessonCompleted {
  constructor(
    readonly userId: string,
    readonly lessonId: string,
    readonly courseId: string,
    readonly completedAt: Date,
  ) {}
}
