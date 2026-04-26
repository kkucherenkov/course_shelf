/**
 * WHY this file exists:
 * HTTP entry point for the Lesson read model. Mirrors CoursesController:
 * a dedicated controller keeps lesson routing clean and avoids cluttering
 * CatalogController (which owns /libraries routes).
 *
 * Pattern:
 *   1. Resolve the session → actor (id + role).
 *   2. Dispatch a Query via the CQRS QueryBus.
 *   3. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping here.
 *
 * GET requires an authenticated session and forwards the actor into the query
 * so the handler can apply grant-based filtering.
 */
import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { GetLessonQuery } from './application/queries/get-lesson.query';

import type { Request } from 'express';
import type { LessonDto } from '@app/api-client-ts';

@Controller({ path: 'lessons', version: '1' })
export class LessonsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
  ) {}

  /**
   * Resolves the session and returns the actor (id + role).
   * Throws UnauthorizedException (401) — the only HTTP exception allowed in
   * a controller; domain errors are thrown by handlers.
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

  /** GET /api/v1/lessons/:id */
  @UseGuards(SessionGuard)
  @Get(':id')
  async getLesson(@Param('id') id: string, @Req() req: Request): Promise<LessonDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<GetLessonQuery, LessonDto>(new GetLessonQuery(id, actor));
  }
}
