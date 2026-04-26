/**
 * WHY this file exists:
 * HTTP entry point for the Lesson read model. Mirrors CoursesController:
 * a dedicated controller keeps lesson routing clean and avoids cluttering
 * CatalogController (which owns /libraries routes).
 *
 * Pattern:
 *   1. Extract the actor from @Session() — resolved by the global SessionGuard.
 *   2. Dispatch a Query via the CQRS QueryBus.
 *   3. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no mapping here.
 *
 * GET requires an authenticated session and forwards the actor into the query
 * so the handler can apply grant-based filtering.
 */
import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { GetLessonQuery } from './application/queries/get-lesson.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { LessonDto } from '@app/api-client-ts';

@Controller({ path: 'lessons', version: '1' })
export class LessonsController {
  constructor(private readonly queryBus: QueryBus) {}

  /** GET /api/v1/lessons/:id */
  @Get(':id')
  async getLesson(@Param('id') id: string, @Session() session: SessionContext): Promise<LessonDto> {
    const actor = session.user;
    return this.queryBus.execute<GetLessonQuery, LessonDto>(new GetLessonQuery(id, actor));
  }
}
