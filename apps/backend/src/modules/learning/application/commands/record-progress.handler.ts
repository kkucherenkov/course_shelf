/**
 * WHY this file exists:
 * Orchestrates the "record lesson progress" use case.
 *
 * Steps:
 *   1. Load lesson → LessonNotFoundError if missing.
 *   2. Load parent course (for libraryId) → defensive LessonNotFoundError if orphan.
 *   3. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   4. Load existing aggregate (upsert semantics): if absent, start a new one.
 *   5. Call aggregate.record() or capture completedThisCall from start().
 *   6. Persist via repo (upsert — idempotent even when accepted=false).
 *   7. If completedThisCall: publish LessonCompleted via EventBus (exactly once
 *      per (userId, lessonId) — the aggregate's idempotency gate guarantees this).
 *   8. Return LessonProgressDto mapped from the post-merge aggregate.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import {
  COURSE_REPOSITORY,
  LESSON_REPOSITORY,
  LessonNotFoundError,
} from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonCompleted } from '../../domain/progress/lesson-completed.event';
import { LessonProgressRecorded } from '../../domain/progress/lesson-progress-recorded.event';
import { LessonProgress } from '../../domain/progress/lesson-progress';
import { LESSON_PROGRESS_REPOSITORY } from '../../domain/progress/lesson-progress.repository';

import { RecordProgressCommand } from './record-progress.command';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { LessonProgressRepository } from '../../domain/progress/lesson-progress.repository';
import type { LessonProgressDto } from '@app/api-client-ts';

function toDto(p: LessonProgress): LessonProgressDto {
  return {
    lessonId: p.lessonId,
    positionSeconds: p.positionSeconds,
    durationSeconds: p.durationSeconds,
    percent: p.percent,
    completed: p.completed,
    lastSeenAt: p.lastSeenAt.toISOString(),
    // exactOptionalPropertyTypes: omit the key entirely when undefined.
    ...(p.completedAt === undefined ? {} : { completedAt: p.completedAt.toISOString() }),
  };
}

@CommandHandler(RecordProgressCommand)
export class RecordProgressHandler implements ICommandHandler<
  RecordProgressCommand,
  LessonProgressDto
> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(LESSON_PROGRESS_REPOSITORY) private readonly progressRepo: LessonProgressRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RecordProgressCommand): Promise<LessonProgressDto> {
    const { lessonId, positionSeconds, durationSeconds, clientUpdatedAt, actor } = command;

    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) {
      throw new LessonNotFoundError(lessonId);
    }

    // Load parent course to obtain libraryId for grant evaluation.
    // Orphan lesson is our own data inconsistency — surface as 404.
    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      throw new LessonNotFoundError(lessonId);
    }

    const allowed = await this.authz.canSee(actor, {
      kind: 'lesson',
      id: lessonId as never,
      courseId: lesson.courseId as CourseId,
      libraryId: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const existing = await this.progressRepo.findByUserAndLesson(actor.id, lessonId);

    const result = existing
      ? existing.record({ positionSeconds, clientUpdatedAt })
      : LessonProgress.start({
          id: nanoid(),
          userId: actor.id,
          lessonId,
          durationSeconds,
          positionSeconds,
          clientUpdatedAt,
        });

    // Persist regardless of accepted flag — upsert is idempotent.
    await this.progressRepo.save(result.aggregate);

    if (result.accepted) {
      // LessonProgressRecorded fires on every accepted write (in-progress or completed).
      // Publish first so downstream projections always receive the position update
      // before the completion notification.
      this.eventBus.publish(
        new LessonProgressRecorded(
          actor.id,
          lessonId,
          course.id,
          result.aggregate.positionSeconds,
          result.aggregate.lastSeenAt,
        ),
      );
    }

    if (result.completedThisCall) {
      this.eventBus.publish(
        new LessonCompleted(
          actor.id,
          lessonId,
          course.id,
          // completedAt is always set when completedThisCall is true.
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          result.aggregate.completedAt!,
        ),
      );
    }

    return toDto(result.aggregate);
  }
}
