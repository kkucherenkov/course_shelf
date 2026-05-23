/**
 * WHY this file exists:
 * HTTP entry point for admin-only write operations on catalog entities —
 * instructors, studios, tags, and the maintenance/backfill endpoint.
 *
 * All routes are guarded by AdminGuard. Session is not used here because
 * admin upsert operations are actor-agnostic (no per-user ownership on
 * catalog entities).
 *
 * Post-upsert coursesTotal: the UpsertInstructor/Studio/Tag handlers return
 * the aggregate, which carries no coursesTotal count. Rather than extending
 * the handler return type we perform one extra read from the repository after
 * the write — this keeps handlers pure and the controller doing only
 * composition (option (a) from the plan). The repos are injected solely for
 * this count read; all write logic goes through the command bus.
 *
 * Backfill endpoint: fire-and-forget. Returns 202 immediately; the handler
 * publishes progress to the Centrifugo channel `maintenance:backfill:{jobId}`.
 * The handler is the only one responsible for publishing BackfillFinished —
 * if it crashes unexpectedly, the defensive catch here logs the error. The
 * controller never blocks on the dispatch.
 */
import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { AdminGuard } from '../../common/auth/admin.guard';
import { UpsertInstructorCommand } from './application/commands/upsert-instructor.command';
import { UpsertStudioCommand } from './application/commands/upsert-studio.command';
import { UpsertTagCommand } from './application/commands/upsert-tag.command';
import { BackfillCourseMetadataCommand } from './application/commands/backfill-course-metadata.command';
import { INSTRUCTOR_REPOSITORY } from './domain/instructor/instructor.repository';
import { STUDIO_REPOSITORY } from './domain/studio/studio.repository';
import { TAG_REPOSITORY } from './domain/tag/tag.repository';
import { toInstructorDto } from './catalog-entities.dto';
import { toStudioDto } from './catalog-entities.dto';
import { toTagDto } from './catalog-entities.dto';

import type { Instructor } from './domain/instructor/instructor';
import type { Studio } from './domain/studio/studio';
import type { Tag } from './domain/tag/tag';
import type { InstructorRepository } from './domain/instructor/instructor.repository';
import type { StudioRepository } from './domain/studio/studio.repository';
import type { TagRepository } from './domain/tag/tag.repository';
import type {
  InstructorDto,
  StudioDto,
  TagDto,
  UpsertInstructorRequest,
  UpsertStudioRequest,
  UpsertTagRequest,
  BackfillJobAccepted,
  BackfillMetadataRequest,
} from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class CatalogEntitiesAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(INSTRUCTOR_REPOSITORY) private readonly instructorRepo: InstructorRepository,
    @Inject(STUDIO_REPOSITORY) private readonly studioRepo: StudioRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepo: TagRepository,
  ) {}

  // ── Instructors ────────────────────────────────────────────────────────────

  /** POST /api/v1/admin/instructors */
  @Post('instructors')
  @HttpCode(HttpStatus.CREATED)
  async upsertInstructor(@Body() body: UpsertInstructorRequest): Promise<InstructorDto> {
    const aggregate = await this.commandBus.execute<UpsertInstructorCommand, Instructor>(
      new UpsertInstructorCommand(body.displayName, body.slug, body.externalIds),
    );
    const { total: coursesTotal } = await this.instructorRepo.findCoursesForInstructor(
      aggregate.id,
      { offset: 0, limit: 0 },
    );
    return toInstructorDto(aggregate, coursesTotal);
  }

  // ── Studios ────────────────────────────────────────────────────────────────

  /** POST /api/v1/admin/studios */
  @Post('studios')
  @HttpCode(HttpStatus.CREATED)
  async upsertStudio(@Body() body: UpsertStudioRequest): Promise<StudioDto> {
    const aggregate = await this.commandBus.execute<UpsertStudioCommand, Studio>(
      new UpsertStudioCommand(body.displayName, body.slug, body.externalIds),
    );
    const { total: coursesTotal } = await this.studioRepo.findCoursesForStudio(aggregate.id, {
      offset: 0,
      limit: 0,
    });
    return toStudioDto(aggregate, coursesTotal);
  }

  // ── Tags ───────────────────────────────────────────────────────────────────

  /** POST /api/v1/admin/tags */
  @Post('tags')
  @HttpCode(HttpStatus.CREATED)
  async upsertTag(@Body() body: UpsertTagRequest): Promise<TagDto> {
    const aggregate = await this.commandBus.execute<UpsertTagCommand, Tag>(
      new UpsertTagCommand(body.displayName, body.slug, body.category ?? null, body.externalIds),
    );
    const { total: coursesTotal } = await this.tagRepo.findCoursesForTag(aggregate.id, {
      offset: 0,
      limit: 0,
    });
    return toTagDto(aggregate, coursesTotal);
  }

  // ── Maintenance ────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/maintenance/backfill-metadata
   *
   * Fire-and-forget: returns 202 immediately. The handler publishes progress
   * events to `maintenance:backfill:{jobId}` on Centrifugo and emits
   * BackfillFinished when done. The caller should subscribe to that channel
   * before this response arrives.
   */
  @Post('maintenance/backfill-metadata')
  @HttpCode(HttpStatus.ACCEPTED)
  startBackfillMetadata(@Body() body: BackfillMetadataRequest): BackfillJobAccepted {
    const jobId = nanoid();
    const channel = `maintenance:backfill:${jobId}`;

    // Dispatch is intentionally not awaited — the handler runs in the background.
    void this.commandBus
      .execute(new BackfillCourseMetadataCommand(body.libraryId, jobId, channel))
      .catch((error: unknown) => {
        // The handler is expected to swallow its own errors and publish BackfillFinished.
        // This catch is a defensive net for genuinely unexpected throws.
        console.error(`[backfill ${jobId}] dispatch crashed:`, error);
      });

    return { jobId };
  }
}
