/**
 * WHY this file exists:
 * HTTP entry point for Course CRUD. Mirrors the ScansController pattern:
 * a separate controller keeps course-specific routing clean and avoids cluttering
 * CatalogController (which owns the /libraries routes).
 *
 * Pattern:
 *   1. Extract the actor from @Session() — resolved by the global SessionGuard.
 *   2. Dispatch a Command or Query via the CQRS bus.
 *   3. Return the result shaped as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping here.
 *
 * PATCH is admin-only (AdminGuard). GET endpoints require an authenticated session
 * and forward the actor into the query so the handler can apply grant-based
 * filtering.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { UpdateCourseMetadataCommand } from './application/commands/update-course-metadata.command';
import { MarkCourseCompleteCommand } from './application/commands/mark-course-complete.command';
import { ResetCourseProgressCommand } from './application/commands/reset-course-progress.command';
import { RunScanCommand } from './application/commands/run-scan.command';
import { RunTranscriptionCommand } from './application/commands/run-transcription.command';
import { toScanDto } from './scans.dto';
import { toTranscriptionDto } from './transcriptions.dto';
import {
  ListCoursesQuery,
  type CourseListDurationBucket,
  type CourseListSort,
  type CourseListStatus,
} from './application/queries/list-courses.query';
import { GetCourseQuery } from './application/queries/get-course.query';
import { GetCourseOutlineQuery } from './application/queries/get-course-outline.query';
import { GetCourseDownloadEstimateQuery } from './application/queries/get-course-download-estimate.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { Scan } from './domain/scan/scan';
import type { Transcription } from './domain/transcription/transcription';
import type {
  CourseDto,
  CourseDownloadEstimateDto,
  CourseListDto,
  CourseOutlineDto,
  ScanDto,
  StartTranscriptionRequest,
  TranscriptionDto,
  UpdateCourseRequest,
} from '@app/api-client-ts';

const VALID_STATUSES: ReadonlySet<CourseListStatus> = new Set([
  'all',
  'not-started',
  'in-progress',
  'completed',
]);
const VALID_SORTS: ReadonlySet<CourseListSort> = new Set([
  'recently-watched',
  'newest',
  'alphabetical',
  'duration',
]);
const VALID_DURATION_BUCKETS: ReadonlySet<CourseListDurationBucket> = new Set([
  'all',
  'lt5',
  '5to10',
  '10to20',
  'gt20',
]);

function parseStatus(raw: string | undefined): CourseListStatus {
  return raw && VALID_STATUSES.has(raw as CourseListStatus) ? (raw as CourseListStatus) : 'all';
}

function parseSort(raw: string | undefined): CourseListSort {
  return raw && VALID_SORTS.has(raw as CourseListSort)
    ? (raw as CourseListSort)
    : 'recently-watched';
}

function parseDurationBucket(raw: string | undefined): CourseListDurationBucket {
  return raw && VALID_DURATION_BUCKETS.has(raw as CourseListDurationBucket)
    ? (raw as CourseListDurationBucket)
    : 'all';
}

@Controller({ path: 'courses', version: '1' })
export class CoursesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/courses?libraryId=…&status=…&durationBucket=…&instructorId=…&sort=… */
  @Get()
  async listCourses(
    @Session() session: SessionContext,
    @Query('libraryId') libraryId?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('durationBucket') durationBucket?: string,
    @Query('instructorId') instructorId?: string,
  ): Promise<CourseListDto> {
    const actor = session.user;
    const items = await this.queryBus.execute<ListCoursesQuery, CourseDto[]>(
      new ListCoursesQuery(
        actor,
        libraryId,
        parseStatus(status),
        parseSort(sort),
        parseDurationBucket(durationBucket),
        instructorId,
      ),
    );
    return { items };
  }

  /** GET /api/v1/courses/:id */
  @Get(':id')
  async getCourse(@Param('id') id: string, @Session() session: SessionContext): Promise<CourseDto> {
    const actor = session.user;
    return this.queryBus.execute<GetCourseQuery, CourseDto>(new GetCourseQuery(id, actor));
  }

  /** GET /api/v1/courses/:id/outline */
  @Get(':id/outline')
  async getCourseOutline(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<CourseOutlineDto> {
    const actor = session.user;
    return this.queryBus.execute<GetCourseOutlineQuery, CourseOutlineDto>(
      new GetCourseOutlineQuery(id, actor),
    );
  }

  /** GET /api/v1/courses/:id/download-estimate */
  @Get(':id/download-estimate')
  async getCourseDownloadEstimate(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<CourseDownloadEstimateDto> {
    const actor = session.user;
    return this.queryBus.execute<GetCourseDownloadEstimateQuery, CourseDownloadEstimateDto>(
      new GetCourseDownloadEstimateQuery(id, actor),
    );
  }

  /** POST /api/v1/courses/:id/mark-complete */
  @Post(':id/mark-complete')
  @HttpCode(HttpStatus.OK)
  async markCourseComplete(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<CourseOutlineDto> {
    const actor = session.user;
    return this.commandBus.execute<MarkCourseCompleteCommand, CourseOutlineDto>(
      new MarkCourseCompleteCommand(id, actor),
    );
  }

  /** POST /api/v1/courses/:id/reset-progress */
  @Post(':id/reset-progress')
  @HttpCode(HttpStatus.OK)
  async resetCourseProgress(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<CourseOutlineDto> {
    const actor = session.user;
    return this.commandBus.execute<ResetCourseProgressCommand, CourseOutlineDto>(
      new ResetCourseProgressCommand(id, actor),
    );
  }

  /**
   * POST /api/v1/courses/:id/rescan — admin only (E32-F01-S02)
   * Scopes the scan to this course's on-disk folder instead of the whole
   * library. Accepts and returns exactly like POST /libraries/:id/scans.
   */
  @UseGuards(AdminGuard)
  @Post(':id/rescan')
  @HttpCode(HttpStatus.ACCEPTED)
  async rescanCourse(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<ScanDto> {
    const scan = await this.commandBus.execute<RunScanCommand, Scan>(
      new RunScanCommand(undefined, session.user.id, { courseId: id }),
    );
    return toScanDto(scan);
  }

  /**
   * POST /api/v1/courses/:id/transcription — admin only (E32-F02-S01)
   * Transcribes only this course's lessons instead of the whole library.
   * Accepts and returns exactly like POST /libraries/:id/transcriptions.
   */
  @UseGuards(AdminGuard)
  @Post(':id/transcription')
  @HttpCode(HttpStatus.ACCEPTED)
  async startCourseTranscription(
    @Param('id') id: string,
    @Session() session: SessionContext,
    @Body() body?: StartTranscriptionRequest,
  ): Promise<TranscriptionDto> {
    const transcription = await this.commandBus.execute<RunTranscriptionCommand, Transcription>(
      new RunTranscriptionCommand(
        undefined,
        body?.force ?? false,
        session.user.id,
        { courseId: id },
        body?.language,
      ),
    );
    return toTranscriptionDto(transcription);
  }

  /** PATCH /api/v1/courses/:id — admin only */
  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateCourse(
    @Param('id') id: string,
    @Body() body: UpdateCourseRequest,
    @Session() session: SessionContext,
  ): Promise<CourseDto> {
    const actor = session.user;
    const patch: UpdateCourseMetadataCommand['patch'] = {};

    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.slug !== undefined) patch.slug = body.slug;

    if (body.posterUrl !== undefined) patch.posterUrl = body.posterUrl;
    if (body.level !== undefined) patch.level = body.level;
    if (body.language !== undefined) patch.language = body.language;
    if (body.releaseDate !== undefined) {
      patch.releaseDate = body.releaseDate === null ? null : new Date(body.releaseDate);
    }
    if (body.sourceUpdatedAt !== undefined) {
      patch.sourceUpdatedAt = body.sourceUpdatedAt === null ? null : new Date(body.sourceUpdatedAt);
    }
    if (body.externalIds !== undefined) patch.externalIds = body.externalIds;

    // Rating fields must be supplied together or both omitted. Reject lopsided input.
    if (body.ratingAverage !== undefined || body.ratingCount !== undefined) {
      if (body.ratingAverage === undefined || body.ratingCount === undefined) {
        throw new BadRequestException({
          code: 'rating-fields-must-be-paired',
          detail: 'ratingAverage and ratingCount must be supplied together (or both omitted).',
        });
      }
      patch.ratingAverage = body.ratingAverage;
      patch.ratingCount = body.ratingCount;
    }

    if (body.instructorIds !== undefined) patch.instructorIds = body.instructorIds;
    if (body.studioIds !== undefined) patch.studioIds = body.studioIds;
    if (body.tagIds !== undefined) patch.tagIds = body.tagIds;

    return this.commandBus.execute<UpdateCourseMetadataCommand, CourseDto>(
      new UpdateCourseMetadataCommand(id, actor, patch),
    );
  }
}
