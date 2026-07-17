/**
 * WHY this file exists:
 * Carries the actor and course id from the controller into the CQRS bus so the
 * GetCourseDownloadEstimateHandler can compute the course's total download size
 * (sum of Lesson.sizeBytes) in a single round-trip. The actor is needed for
 * authz enforcement (course-level READ grant on the owning library).
 */

export class GetCourseDownloadEstimateQuery {
  constructor(
    /** Id of the course to estimate. */
    readonly courseId: string,
    /** Authenticated user. */
    readonly actor: { id: string; role: string },
  ) {}
}
