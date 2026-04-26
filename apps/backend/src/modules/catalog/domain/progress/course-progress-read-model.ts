/**
 * WHY this file exists:
 * Denormalised per-(user, course) read model that enables O(1) progress lookups
 * at request time. Updated by two event handlers in application/event-handlers/:
 *
 *   - LessonCompletedHandler   — bumps lessonsCompleted + percent + lastSeenAt.
 *   - LessonProgressRecordedHandler — bumps lastSeenAt + lastSeenLessonId on
 *     any accepted write, even when the lesson is only partially watched.
 *
 * Plain value object — no domain behaviour beyond construction and
 * reconstitution. No Prisma types, no NestJS decorators.
 */
export interface CourseProgressReadModelProps {
  readonly id: string;
  readonly userId: string;
  readonly courseId: string;
  readonly lessonsCompleted: number;
  readonly lessonsTotal: number;
  readonly percent: number;
  readonly lastSeenAt: Date;
  readonly lastSeenLessonId: string;
}

export class CourseProgressReadModel {
  readonly id: string;
  readonly userId: string;
  readonly courseId: string;
  readonly lessonsCompleted: number;
  readonly lessonsTotal: number;
  readonly percent: number;
  readonly lastSeenAt: Date;
  readonly lastSeenLessonId: string;

  private constructor(props: CourseProgressReadModelProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.courseId = props.courseId;
    this.lessonsCompleted = props.lessonsCompleted;
    this.lessonsTotal = props.lessonsTotal;
    this.percent = props.percent;
    this.lastSeenAt = props.lastSeenAt;
    this.lastSeenLessonId = props.lastSeenLessonId;
  }

  /** Build a fresh read-model row from computed values. */
  static create(props: CourseProgressReadModelProps): CourseProgressReadModel {
    return new CourseProgressReadModel(props);
  }

  /** Reconstitute from a persisted row — bypasses invariant checks. */
  static reconstitute(props: CourseProgressReadModelProps): CourseProgressReadModel {
    return new CourseProgressReadModel(props);
  }
}
