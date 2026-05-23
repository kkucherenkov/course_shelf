/**
 * WHY this file exists:
 * HTTP entry point for the public catalog read endpoints — instructors, studios,
 * and tags. All six endpoints are available to any authenticated user; there is no
 * admin gate (catalog entities are public catalogue, not admin-only data).
 *
 * Pattern mirrors CoursesController and SearchController:
 *   1. Parse and validate query params defensively (BadRequestException for
 *      obviously invalid input such as negative offset — this is input parsing,
 *      not a business rule, so the exception belongs here).
 *   2. Dispatch a Query via QueryBus.
 *   3. Return the result verbatim from the handler — no further mapping.
 *
 * Slug params are not pre-validated at this layer. An invalid slug format reaches
 * the handler which returns "not found" — the correct 404 outcome.
 *
 * Pagination defaults: offset=0, limit=20, max=100.
 */
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { ListInstructorsQuery } from './application/queries/list-instructors.query';
import { GetInstructorQuery } from './application/queries/get-instructor.query';
import { ListStudiosQuery } from './application/queries/list-studios.query';
import { GetStudioQuery } from './application/queries/get-studio.query';
import { ListTagsQuery } from './application/queries/list-tags.query';
import { GetTagQuery } from './application/queries/get-tag.query';

import type {
  InstructorListDto,
  InstructorDetailDto,
  StudioListDto,
  StudioDetailDto,
  TagListDto,
  TagDetailDto,
} from '@app/api-client-ts';

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface Pagination {
  offset: number;
  limit: number;
}

/**
 * Parse and validate raw offset/limit query-string values.
 * Throws BadRequestException (HTTP 400) for negative or non-integer inputs.
 * Falls back to defaults when the params are absent.
 */
function parsePagination(
  rawOffset: string | undefined,
  rawLimit: string | undefined,
  opts: { defaultLimit?: number; maxLimit?: number } = {},
): Pagination {
  const defaultLimit = opts.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = opts.maxLimit ?? MAX_LIMIT;

  let offset = 0;
  if (rawOffset !== undefined) {
    const parsed = Number.parseInt(rawOffset, 10);
    if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
      throw new BadRequestException({
        code: 'invalid-pagination-param',
        detail: `offset must be a non-negative integer; got "${rawOffset}".`,
      });
    }
    if (parsed < 0) {
      throw new BadRequestException({
        code: 'invalid-pagination-param',
        detail: `offset must be >= 0; got ${String(parsed)}.`,
      });
    }
    offset = parsed;
  }

  let limit = defaultLimit;
  if (rawLimit !== undefined) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
      throw new BadRequestException({
        code: 'invalid-pagination-param',
        detail: `limit must be a positive integer; got "${rawLimit}".`,
      });
    }
    if (parsed <= 0) {
      throw new BadRequestException({
        code: 'invalid-pagination-param',
        detail: `limit must be > 0; got ${String(parsed)}.`,
      });
    }
    limit = Math.min(parsed, maxLimit);
  }

  return { offset, limit };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller({ path: 'catalog', version: '1' })
export class CatalogEntitiesController {
  constructor(private readonly queryBus: QueryBus) {}

  // ── Instructors ────────────────────────────────────────────────────────────

  /** GET /api/v1/catalog/instructors?offset=&limit=&search= */
  @Get('instructors')
  listInstructors(
    @Query('offset') rawOffset?: string,
    @Query('limit') rawLimit?: string,
    @Query('search') search?: string,
  ): Promise<InstructorListDto> {
    const { offset, limit } = parsePagination(rawOffset, rawLimit);
    return this.queryBus.execute<ListInstructorsQuery, InstructorListDto>(
      new ListInstructorsQuery(offset, limit, search),
    );
  }

  /** GET /api/v1/catalog/instructors/:slug */
  @Get('instructors/:slug')
  getInstructor(
    @Param('slug') slug: string,
    @Query('coursesOffset') rawCoursesOffset?: string,
    @Query('coursesLimit') rawCoursesLimit?: string,
  ): Promise<InstructorDetailDto> {
    const { offset: coursesOffset, limit: coursesLimit } = parsePagination(
      rawCoursesOffset,
      rawCoursesLimit,
    );
    return this.queryBus.execute<GetInstructorQuery, InstructorDetailDto>(
      new GetInstructorQuery(slug, coursesOffset, coursesLimit),
    );
  }

  // ── Studios ────────────────────────────────────────────────────────────────

  /** GET /api/v1/catalog/studios?offset=&limit=&search= */
  @Get('studios')
  listStudios(
    @Query('offset') rawOffset?: string,
    @Query('limit') rawLimit?: string,
    @Query('search') search?: string,
  ): Promise<StudioListDto> {
    const { offset, limit } = parsePagination(rawOffset, rawLimit);
    return this.queryBus.execute<ListStudiosQuery, StudioListDto>(
      new ListStudiosQuery(offset, limit, search),
    );
  }

  /** GET /api/v1/catalog/studios/:slug */
  @Get('studios/:slug')
  getStudio(
    @Param('slug') slug: string,
    @Query('coursesOffset') rawCoursesOffset?: string,
    @Query('coursesLimit') rawCoursesLimit?: string,
  ): Promise<StudioDetailDto> {
    const { offset: coursesOffset, limit: coursesLimit } = parsePagination(
      rawCoursesOffset,
      rawCoursesLimit,
    );
    return this.queryBus.execute<GetStudioQuery, StudioDetailDto>(
      new GetStudioQuery(slug, coursesOffset, coursesLimit),
    );
  }

  // ── Tags ───────────────────────────────────────────────────────────────────

  /** GET /api/v1/catalog/tags?offset=&limit=&search=&category= */
  @Get('tags')
  listTags(
    @Query('offset') rawOffset?: string,
    @Query('limit') rawLimit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ): Promise<TagListDto> {
    const { offset, limit } = parsePagination(rawOffset, rawLimit);
    return this.queryBus.execute<ListTagsQuery, TagListDto>(
      new ListTagsQuery(offset, limit, search, category),
    );
  }

  /** GET /api/v1/catalog/tags/:slug */
  @Get('tags/:slug')
  getTag(
    @Param('slug') slug: string,
    @Query('coursesOffset') rawCoursesOffset?: string,
    @Query('coursesLimit') rawCoursesLimit?: string,
  ): Promise<TagDetailDto> {
    const { offset: coursesOffset, limit: coursesLimit } = parsePagination(
      rawCoursesOffset,
      rawCoursesLimit,
    );
    return this.queryBus.execute<GetTagQuery, TagDetailDto>(
      new GetTagQuery(slug, coursesOffset, coursesLimit),
    );
  }
}
