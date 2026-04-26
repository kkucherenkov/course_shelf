/**
 * WHY this file exists:
 * Subscribes to LessonCompleted (emitted by the Learning context) and keeps the
 * CourseProgressReadModel projection up to date whenever a lesson is completed.
 *
 * Idempotency guarantee: the handler upserts via the composite unique key
 * (userId, courseId). Running the same LessonCompleted event twice produces the
 * same final row. The aggregate-level guard in LessonProgress already prevents
 * a second completion crossing, but this handler is safe even if a duplicate
 * event arrives (e.g. from a replay or at-least-once delivery).
 *
 * Cross-context import rule: LessonCompleted is imported from
 * common/learning-events/ (not from modules/learning/**) so the boundaries/
 * element-types ESLint rule remains satisfied.
 *
 * No NestJS HTTP exceptions — this is a background handler, not a controller.
 */
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { LessonCompleted } from '../../../../common/learning-events';
import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';

import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';

@EventsHandler(LessonCompleted)
export class LessonCompletedHandler implements IEventHandler<LessonCompleted> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY) private readonly progressRepo: LessonProgressRepository,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly readModelRepo: CourseProgressReadModelRepository,
  ) {}

  async handle(event: LessonCompleted): Promise<void> {
    const { userId, lessonId, courseId, completedAt } = event;

    // Count total lessons in the course for the projection denominator.
    const lessons = await this.lessonRepo.findByCourse(courseId);
    const lessonsTotal = lessons.length;

    // Count how many lessons this user has completed in this course.
    const lessonsCompleted = await this.progressRepo.countCompletedByUserAndCourse(
      userId,
      courseId,
    );

    const percent = lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0;

    // Load the existing row to decide whether lastSeenAt / lastSeenLessonId should bump.
    const existing = await this.readModelRepo.findByUserAndCourse(userId, courseId);

    const shouldBumpSeen = !existing || completedAt > existing.lastSeenAt;

    const model = CourseProgressReadModel.create({
      id: existing?.id ?? nanoid(),
      userId,
      courseId,
      lessonsCompleted,
      lessonsTotal,
      percent,
      lastSeenAt: shouldBumpSeen ? completedAt : existing.lastSeenAt,
      lastSeenLessonId: shouldBumpSeen ? lessonId : existing.lastSeenLessonId,
    });

    await this.readModelRepo.upsert(model);
  }
}
