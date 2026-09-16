/**
 * WHY this file exists:
 * `POST /api/v1/courses/{id}/quizzes` — walks every lesson in the course.
 * Its own controller for the same reason GenerateLessonQuizController is:
 * a distinct base path from every other controller in this module.
 */
import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { GenerateQuizCommand } from './application/commands/generate-quiz.command';

import type { QuizGenerationAccepted } from './application/commands/generate-quiz.handler';
import type { GenerateQuizRequest, QuizGenerationAcceptedDto } from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'courses/:id/quizzes', version: '1' })
export class GenerateCourseQuizController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(
    @Param('id') id: string,
    @Body() body?: GenerateQuizRequest,
  ): Promise<QuizGenerationAcceptedDto> {
    return this.commandBus.execute<GenerateQuizCommand, QuizGenerationAccepted>(
      new GenerateQuizCommand(undefined, id, body?.modelId, body?.cleanupEnabled ?? true),
    );
  }
}
