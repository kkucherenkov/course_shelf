/**
 * WHY this file exists:
 * Subscribes to LessonProgressRecorded (emitted by the Learning context on every
 * accepted progress write, not just completions). This ensures the
 * CourseProgressReadModel projection reflects in-progress views so that
 * "Continue watching" surfaces a course as soon as the user starts watching —
 * not only after they cross the 90 % completion threshold.
 *
 * Idempotency guarantee: the handler upserts via the composite unique key
 * (userId, courseId). lastSeenAt is only bumped when event.recordedAt is
 * strictly newer than the current row's lastSeenAt, making repeated delivery
 * of the same event safe.
 *
 * LessonProgressRecorded fires before LessonCompleted (guaranteed by
 * RecordProgressHandler publication order), so a completion event will always
 * supersede any values written here for the same instant.
 *
 * Cross-context import rule: LessonProgressRecorded is imported from
 * common/learning-events/ — not from modules/learning/** directly.
 *
 * No NestJS HTTP exceptions — background handler, not a controller.
 */
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { LessonProgressRecorded } from '../../../../common/learning-events';
import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';

import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';

@EventsHandler(LessonProgressRecorded)
export class LessonProgressRecordedHandler implements IEventHandler<LessonProgressRecorded> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY) private readonly progressRepo: LessonProgressRepository,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly readModelRepo: CourseProgressReadModelRepository,
  ) {}

  async handle(event: LessonProgressRecorded): Promise<void> {
    const { userId, lessonId, courseId, recordedAt } = event;

    // Load the existing row. If one exists and the incoming event is not newer,
    // skip the upsert entirely — nothing to update.
    const existing = await this.readModelRepo.findByUserAndCourse(userId, courseId);

    if (existing && recordedAt <= existing.lastSeenAt) {
      // Stale or duplicate event — idempotent no-op.
      return;
    }

    // Count totals to populate a fresh row (or refresh stale totals on existing).
    // lessonsTotal is stable per course; lessonsCompleted does not change on a
    // "recorded" event (only a "completed" event bumps it). We recount to keep
    // the row self-consistent in case the handler runs before the completion
    // handler (the order in the bus is publication-order — recorded first, then
    // completed — but defensive recount costs little here).
    const [lessons, lessonsCompleted] = await Promise.all([
      this.lessonRepo.findByCourse(courseId),
      this.progressRepo.countCompletedByUserAndCourse(userId, courseId),
    ]);

    const lessonsTotal = lessons.length;
    const percent = lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0;

    const model = CourseProgressReadModel.create({
      id: existing?.id ?? nanoid(),
      userId,
      courseId,
      lessonsCompleted,
      lessonsTotal,
      percent,
      lastSeenAt: recordedAt,
      lastSeenLessonId: lessonId,
    });

    await this.readModelRepo.upsert(model);
  }
}
