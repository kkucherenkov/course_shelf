/**
 * WHY this file exists:
 * Service that deterministically rebuilds the CourseProgressReadModel table
 * from the source-of-truth LessonProgress rows. Used by the
 * rebuild-projections CLI script to recover from:
 *   - DB resets during local development.
 *   - Event handler bugs that produced incorrect projection rows.
 *   - Schema migrations that wipe the read model table.
 *
 * The operation is idempotent: calling it twice with the same underlying
 * LessonProgress data produces the same set of CourseProgressReadModel rows.
 *
 * Steps:
 *   1. Delete all existing read-model rows (clean slate).
 *   2. Enumerate every distinct (userId, courseId) pair from LessonProgress.
 *   3. For each pair:
 *      a. Count completed lessons via LESSON_PROGRESS_REPOSITORY.
 *      b. Count total lessons via LESSON_REPOSITORY.findByCourse.
 *      c. Compute percent.
 *      d. Find lastSeenAt = max(lastSeenAt) across all progress rows for the
 *         pair — the Prisma adapter returns rows ordered by lastSeenAt DESC,
 *         so the first row with matching lessonId gives the last-seen info.
 *      e. Upsert the read-model row.
 *   4. Log a summary.
 *
 * No HTTP dependencies. No EventBus. No NestJS HTTP exceptions.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';

import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';

import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';

@Injectable()
export class RebuildProjectionsService {
  private readonly logger = new Logger(RebuildProjectionsService.name);

  constructor(
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly readModelRepo: CourseProgressReadModelRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY) private readonly progressRepo: LessonProgressRepository,
  ) {}

  async rebuild(): Promise<void> {
    const startMs = Date.now();

    this.logger.log('Starting CourseProgressReadModel rebuild…');
    await this.readModelRepo.deleteAll();

    const pairs = await this.progressRepo.findAllUserCoursePairs();
    this.logger.log(`Found ${String(pairs.length)} (userId, courseId) pairs to process.`);

    let rebuilt = 0;
    for (const { userId, courseId } of pairs) {
      const [lessons, lessonsCompleted] = await Promise.all([
        this.lessonRepo.findByCourse(courseId),
        this.progressRepo.countCompletedByUserAndCourse(userId, courseId),
      ]);

      const lessonsTotal = lessons.length;
      const percent = lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0;

      // Determine the most-recently-watched lesson.
      // findAllUserCoursePairs gives us pairs but not the latest lesson data;
      // we need a raw query here. Since the Prisma adapter does not expose a
      // "findLatestForUserAndCourse" method, we use countCompleted as the source
      // for data already available, and issue a $queryRaw for the latest row.
      // To keep the service free of Prisma, we instead call findByUserAndLesson
      // indirectly — but that requires knowing the lessonId. The pragmatic
      // solution: the repository exposes findAllUserCoursePairs which has access
      // to lastSeenAt per row. We extend the return type to include that info.
      //
      // For v1, we accept the rebuild script calling a raw query through the
      // repository by adding a findLatestProgressForUserAndCourse method.
      // Rather than adding yet another method, we use the already-available
      // countCompleted and accept that lastSeenAt/lastSeenLessonId come from
      // the findAllUserCoursePairs extended result (see repository interface).
      // For now: use a separate helper on the repository.
      const latest = await this.progressRepo.findLatestByUserAndCourse(userId, courseId);
      if (!latest) continue;

      const model = CourseProgressReadModel.create({
        id: nanoid(),
        userId,
        courseId,
        lessonsCompleted,
        lessonsTotal,
        percent,
        lastSeenAt: latest.lastSeenAt,
        lastSeenLessonId: latest.lessonId,
      });

      await this.readModelRepo.upsert(model);
      rebuilt++;
    }

    const elapsedMs = Date.now() - startMs;
    this.logger.log(`Rebuilt ${String(rebuilt)} read-model rows in ${String(elapsedMs)} ms.`);
  }
}
