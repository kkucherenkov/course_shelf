/**
 * WHY this file exists:
 * HTTP entry point for Course CRUD. Mirrors the ScansController pattern:
 * a separate controller keeps course-specific routing clean and avoids cluttering
 * CatalogController (which owns the /libraries routes).
 *
 * Pattern:
 *   1. Resolve the session → actor (id + role).
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
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { UpdateCourseMetadataCommand } from './application/commands/update-course-metadata.command';
import { ListCoursesQuery } from './application/queries/list-courses.query';
import { GetCourseQuery } from './application/queries/get-course.query';

import type { Request } from 'express';
import type { CourseDto, CourseListDto, UpdateCourseRequest } from '@app/api-client-ts';

@Controller({ path: 'courses', version: '1' })
export class CoursesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
  ) {}

  /**
   * Resolves the session and returns the actor (id + role).
   * Throws UnauthorizedException (401) — the only HTTP exception allowed in a
   * controller; domain errors are thrown by handlers.
   */
  private async resolveActor(req: Request): Promise<{ id: string; role: string }> {
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    return { id: session.user.id, role };
  }

  /** GET /api/v1/courses?libraryId=… */
  @UseGuards(SessionGuard)
  @Get()
  async listCourses(
    @Req() req: Request,
    @Query('libraryId') libraryId?: string,
  ): Promise<CourseListDto> {
    const actor = await this.resolveActor(req);
    const items = await this.queryBus.execute<ListCoursesQuery, CourseDto[]>(
      new ListCoursesQuery(actor, libraryId),
    );
    return { items };
  }

  /** GET /api/v1/courses/:id */
  @UseGuards(SessionGuard)
  @Get(':id')
  async getCourse(@Param('id') id: string, @Req() req: Request): Promise<CourseDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<GetCourseQuery, CourseDto>(new GetCourseQuery(id, actor));
  }

  /** PATCH /api/v1/courses/:id — admin only */
  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateCourse(
    @Param('id') id: string,
    @Body() body: UpdateCourseRequest,
    @Req() req: Request,
  ): Promise<CourseDto> {
    const actor = await this.resolveActor(req);
    const patch: { title?: string; description?: string; slug?: string } = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.slug !== undefined) patch.slug = body.slug;

    return this.commandBus.execute<UpdateCourseMetadataCommand, CourseDto>(
      new UpdateCourseMetadataCommand(id, actor, patch),
    );
  }
}
