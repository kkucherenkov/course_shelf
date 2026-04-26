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
import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { UpdateCourseMetadataCommand } from './application/commands/update-course-metadata.command';
import { ListCoursesQuery } from './application/queries/list-courses.query';
import { GetCourseQuery } from './application/queries/get-course.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { CourseDto, CourseListDto, UpdateCourseRequest } from '@app/api-client-ts';

@Controller({ path: 'courses', version: '1' })
export class CoursesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/courses?libraryId=… */
  @Get()
  async listCourses(
    @Session() session: SessionContext,
    @Query('libraryId') libraryId?: string,
  ): Promise<CourseListDto> {
    const actor = session.user;
    const items = await this.queryBus.execute<ListCoursesQuery, CourseDto[]>(
      new ListCoursesQuery(actor, libraryId),
    );
    return { items };
  }

  /** GET /api/v1/courses/:id */
  @Get(':id')
  async getCourse(@Param('id') id: string, @Session() session: SessionContext): Promise<CourseDto> {
    const actor = session.user;
    return this.queryBus.execute<GetCourseQuery, CourseDto>(new GetCourseQuery(id, actor));
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
    const patch: { title?: string; description?: string; slug?: string } = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.slug !== undefined) patch.slug = body.slug;

    return this.commandBus.execute<UpdateCourseMetadataCommand, CourseDto>(
      new UpdateCourseMetadataCommand(id, actor, patch),
    );
  }
}
