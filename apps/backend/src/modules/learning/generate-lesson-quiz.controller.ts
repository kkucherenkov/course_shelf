/**
 * WHY this file exists:
 * `POST /api/v1/lessons/{id}/quizzes` is addressed by a lesson id, not a
 * course, so it cannot share GenerateCourseQuizController's `courses/:id`
 * base path — same reasoning as TranscriptionCancelController's own file.
 * Admin-only, same as every generation/review route in this feature.
 */
import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { GenerateQuizCommand } from './application/commands/generate-quiz.command';

import type { QuizGenerationAccepted } from './application/commands/generate-quiz.handler';
import type { GenerateQuizRequest, QuizGenerationAcceptedDto } from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'lessons/:id/quizzes', version: '1' })
export class GenerateLessonQuizController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(
    @Param('id') id: string,
    @Body() body?: GenerateQuizRequest,
  ): Promise<QuizGenerationAcceptedDto> {
    return this.commandBus.execute<GenerateQuizCommand, QuizGenerationAccepted>(
      new GenerateQuizCommand(id, undefined, body?.modelId, body?.cleanupEnabled ?? true),
    );
  }
}
