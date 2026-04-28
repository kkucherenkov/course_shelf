/**
 * WHY this file exists:
 * Carries the actor and course id from the controller into the CQRS bus so the
 * GetCourseOutlineHandler can load the full outline in a single round-trip.
 * The actor is needed for per-lesson progress lookup and authz enforcement.
 */

export class GetCourseOutlineQuery {
  constructor(
    /** Id of the course to load. */
    readonly courseId: string,
    /** Authenticated user. */
    readonly actor: { id: string; role: string },
  ) {}
}
