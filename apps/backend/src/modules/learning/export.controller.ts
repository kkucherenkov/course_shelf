/**
 * WHY this file exists:
 * HTTP entry point for E28-F01-S01 — download a lesson or course as a
 * Markdown ZIP. Access mirrors LessonsController/CoursesController exactly
 * (design §7: "access-controlled the same way the underlying data is"), so
 * this uses the ordinary `@Session()` + QueryBus pattern every other
 * catalog/learning read uses — no signed token, no @AllowAnonymous(), unlike
 * StreamingController's video/material routes, which exist precisely
 * because an <img>/<video> tag cannot send an Authorization header. A ZIP
 * download triggered by a click can.
 *
 * `@Res()` is the same documented NestJS escape hatch CoursesController's
 * poster route and StreamingController use: the response is a byte stream
 * with a custom Content-Type, not a JSON return value. Exceptions thrown
 * before the stream starts (LessonNotFoundError, PermissionDenied, …) still
 * reach HttpExceptionFilter normally — @Res() only takes over the success
 * path.
 *
 * These two routes are exempt from the OpenAPI response-body validator
 * (application/zip, no JSON schema to validate) — see
 * common/openapi/openapi-validator.middleware.ts ignorePaths.
 */
import { Controller, Get, Param, Res } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { ExportCourseQuery } from './application/queries/export-course.query';
import { ExportLessonQuery } from './application/queries/export-lesson.query';
import { streamZip } from './infra/zip-writer';

import type { SessionContext } from '../../common/auth/decorators';
import type { ExportBundle } from './domain/export/export-bundle';
import type { Response } from 'express';

@Controller({ version: '1' })
export class ExportController {
  constructor(private readonly queryBus: QueryBus) {}

  /** GET /api/v1/lessons/:lessonId/export */
  @Get('lessons/:lessonId/export')
  async exportLesson(
    @Param('lessonId') lessonId: string,
    @Session() session: SessionContext,
    @Res() res: Response,
  ): Promise<void> {
    const bundle = await this.queryBus.execute<ExportLessonQuery, ExportBundle>(
      new ExportLessonQuery(lessonId, session.user),
    );
    streamZip(res, bundle, bundle.suggestedFileName);
  }

  /** GET /api/v1/courses/:courseId/export */
  @Get('courses/:courseId/export')
  async exportCourse(
    @Param('courseId') courseId: string,
    @Session() session: SessionContext,
    @Res() res: Response,
  ): Promise<void> {
    const bundle = await this.queryBus.execute<ExportCourseQuery, ExportBundle>(
      new ExportCourseQuery(courseId, session.user),
    );
    streamZip(res, bundle, bundle.suggestedFileName);
  }
}
