/**
 * WHY this file exists:
 * HTTP entry point for the Learning bounded context's flashcard slice.
 * Separated from NotesController/BookmarksController because flashcards have
 * a distinct resource shape (a review queue, a grade transition) on top of
 * ordinary CRUD.
 *
 * Responsibilities:
 *   1. Extract the actor from @Session() — resolved by the global SessionGuard.
 *   2. Dispatch Command or Query via CQRS bus.
 *   3. Return the result typed per the OpenAPI spec.
 *
 * No business logic, no Prisma, no domain mapping here.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { CreateFlashcardCommand } from './application/commands/create-flashcard.command';
import { DeleteFlashcardCommand } from './application/commands/delete-flashcard.command';
import { GradeFlashcardCommand } from './application/commands/grade-flashcard.command';
import { UpdateFlashcardCommand } from './application/commands/update-flashcard.command';
import { ListDueFlashcardsQuery } from './application/queries/list-due-flashcards.query';
import { ListLessonFlashcardsQuery } from './application/queries/list-lesson-flashcards.query';

import type { SessionContext } from '../../common/auth/decorators';
import type {
  CreateFlashcardRequest,
  FlashcardDto,
  FlashcardListDto,
  GradeFlashcardRequest,
  UpdateFlashcardRequest,
} from '@app/api-client-ts';

const DEFAULT_DUE_LIMIT = 20;
const MIN_DUE_LIMIT = 1;
const MAX_DUE_LIMIT = 100;

/** Parse the ?limit= query param and clamp to [MIN_DUE_LIMIT, MAX_DUE_LIMIT]. */
function parseLimit(limitParam: string | undefined): number {
  const parsed = Number(limitParam ?? String(DEFAULT_DUE_LIMIT));
  return Math.min(
    Math.max(Number.isFinite(parsed) ? parsed : DEFAULT_DUE_LIMIT, MIN_DUE_LIMIT),
    MAX_DUE_LIMIT,
  );
}

@Controller({ version: '1' })
export class FlashcardsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/lessons/:lessonId/flashcards */
  @Get('lessons/:lessonId/flashcards')
  async listLessonFlashcards(
    @Param('lessonId') lessonId: string,
    @Session() session: SessionContext,
  ): Promise<FlashcardListDto> {
    const actor = session.user;
    return this.queryBus.execute<ListLessonFlashcardsQuery, FlashcardListDto>(
      new ListLessonFlashcardsQuery(lessonId, actor),
    );
  }

  /** POST /api/v1/lessons/:lessonId/flashcards */
  @Post('lessons/:lessonId/flashcards')
  @HttpCode(HttpStatus.CREATED)
  async createFlashcard(
    @Param('lessonId') lessonId: string,
    @Body() body: CreateFlashcardRequest,
    @Session() session: SessionContext,
  ): Promise<FlashcardDto> {
    const actor = session.user;
    return this.commandBus.execute<CreateFlashcardCommand, FlashcardDto>(
      new CreateFlashcardCommand(lessonId, body.front, body.back, body.sourceCueId, actor),
    );
  }

  /** GET /api/v1/flashcards/due?limit= */
  @Get('flashcards/due')
  async listDueFlashcards(
    @Session() session: SessionContext,
    @Query('limit') limitParam?: string,
  ): Promise<FlashcardListDto> {
    const actor = session.user;
    return this.queryBus.execute<ListDueFlashcardsQuery, FlashcardListDto>(
      new ListDueFlashcardsQuery(actor, parseLimit(limitParam)),
    );
  }

  /** PATCH /api/v1/flashcards/:id */
  @Patch('flashcards/:id')
  async updateFlashcard(
    @Param('id') id: string,
    @Body() body: UpdateFlashcardRequest,
    @Session() session: SessionContext,
  ): Promise<FlashcardDto> {
    const actor = session.user;
    return this.commandBus.execute<UpdateFlashcardCommand, FlashcardDto>(
      new UpdateFlashcardCommand(id, body.front, body.back, actor),
    );
  }

  /** DELETE /api/v1/flashcards/:id */
  @Delete('flashcards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFlashcard(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<void> {
    const actor = session.user;
    await this.commandBus.execute(new DeleteFlashcardCommand(id, actor));
  }

  /** POST /api/v1/flashcards/:id/grade */
  @Post('flashcards/:id/grade')
  @HttpCode(HttpStatus.OK)
  async gradeFlashcard(
    @Param('id') id: string,
    @Body() body: GradeFlashcardRequest,
    @Session() session: SessionContext,
  ): Promise<FlashcardDto> {
    const actor = session.user;
    return this.commandBus.execute<GradeFlashcardCommand, FlashcardDto>(
      new GradeFlashcardCommand(id, body.grade, actor),
    );
  }
}
