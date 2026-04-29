/**
 * WHY this file exists:
 * Orchestrates the "issue material download URL" use case, mirroring the
 * same step ordering as IssueStreamTokenHandler (existence → parent →
 * authorization → action) to prevent oracle attacks.
 *
 * Steps:
 *   1. Load lesson → 404 if missing.
 *   2. Load parent course (for libraryId) → defensive fallthrough to 404.
 *   3. Evaluate grant → 403 if non-admin without access.
 *      Materials inherit their parent lesson's ACL — no separate grant needed.
 *   4. Mint a short-lived material-scoped token via StreamTokenSigner.signMaterial.
 *   5. Return { url, token, expiresAt } — the URL carries the token as a query
 *      param so a plain <a href download> works without extra headers.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import {
  COURSE_REPOSITORY,
  LESSON_REPOSITORY,
  LessonNotFoundError,
} from '../../../../common/catalog-tokens';
import { AppConfig } from '../../../../common/config/app-config';
import { PermissionDenied } from '../../../../shared/domain-error';
import { StreamTokenSigner } from '../../domain/stream-token/stream-token-signer';

import { IssueMaterialDownloadQuery } from './issue-material-download.query';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { MaterialDownloadUrlDto } from '@app/api-client-ts';

@QueryHandler(IssueMaterialDownloadQuery)
export class IssueMaterialDownloadHandler implements IQueryHandler<
  IssueMaterialDownloadQuery,
  MaterialDownloadUrlDto
> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    private readonly signer: StreamTokenSigner,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(query: IssueMaterialDownloadQuery): Promise<MaterialDownloadUrlDto> {
    const lesson = await this.lessonRepo.findById(query.lessonId);
    if (!lesson) {
      throw new LessonNotFoundError(query.lessonId);
    }

    // Load parent course to obtain libraryId for grant evaluation.
    // Orphan lesson (missing parent) is our own data inconsistency — surface
    // as 404 rather than 500 per the canonical pattern.
    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      throw new LessonNotFoundError(query.lessonId);
    }

    const allowed = await this.authz.canSee(query.actor, {
      kind: 'lesson',
      id: lesson.id,
      courseId: lesson.courseId as CourseId,
      libraryId: course.libraryId as LibraryId,
    });

    if (!allowed) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const { token, expiresAt } = this.signer.signMaterial({
      userId: query.actor.id,
      lessonId: lesson.id,
      materialId: query.materialId,
      ttlSeconds: this.appConfig.streaming.ttlSeconds,
    });

    const url = `/api/v1/stream/materials/${query.materialId}?token=${encodeURIComponent(token)}`;

    return {
      url,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
