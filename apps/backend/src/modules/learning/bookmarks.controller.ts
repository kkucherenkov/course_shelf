/**
 * WHY this file exists:
 * HTTP entry point for the Learning bounded context's bookmark slice. Separated
 * from ProgressController because the routes have distinct path prefixes
 * (lessons/:lessonId/bookmarks vs bookmarks/:id) and keeping them in a
 * dedicated file avoids mixing two different resource shapes in one controller.
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
  Res,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { CreateBookmarkCommand } from './application/commands/create-bookmark.command';
import { DeleteBookmarkCommand } from './application/commands/delete-bookmark.command';
import { UpdateBookmarkCommand } from './application/commands/update-bookmark.command';
import { ListBookmarksQuery } from './application/queries/list-bookmarks.query';

import type { CreateBookmarkResult } from './application/commands/create-bookmark.handler';
import type { SessionContext } from '../../common/auth/decorators';
import type { Response } from 'express';
import type {
  BookmarkDto,
  BookmarkListDto,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from '@app/api-client-ts';

@Controller({ version: '1' })
export class BookmarksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/lessons/:lessonId/bookmarks */
  @Get('lessons/:lessonId/bookmarks')
  async listBookmarks(
    @Param('lessonId') lessonId: string,
    @Session() session: SessionContext,
  ): Promise<BookmarkListDto> {
    const actor = session.user;
    return this.queryBus.execute<ListBookmarksQuery, BookmarkListDto>(
      new ListBookmarksQuery(lessonId, actor),
    );
  }

  /**
   * POST /api/v1/lessons/:lessonId/bookmarks
   *
   * `@HttpCode` can't express the 200-on-replay/201-on-create split (#285), so
   * the status is set explicitly from the handler's `created` flag instead.
   */
  @Post('lessons/:lessonId/bookmarks')
  async createBookmark(
    @Param('lessonId') lessonId: string,
    @Body() body: CreateBookmarkRequest,
    @Session() session: SessionContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BookmarkDto> {
    const actor = session.user;
    const result = await this.commandBus.execute<CreateBookmarkCommand, CreateBookmarkResult>(
      new CreateBookmarkCommand(
        lessonId,
        body.positionSeconds,
        body.label,
        body.idempotencyKey,
        actor,
      ),
    );
    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result.bookmark;
  }

  /** PATCH /api/v1/bookmarks/:id */
  @Patch('bookmarks/:id')
  async updateBookmark(
    @Param('id') id: string,
    @Body() body: UpdateBookmarkRequest,
    @Session() session: SessionContext,
  ): Promise<BookmarkDto> {
    const actor = session.user;
    return this.commandBus.execute<UpdateBookmarkCommand, BookmarkDto>(
      new UpdateBookmarkCommand(id, body.positionSeconds, body.label, actor),
    );
  }

  /** DELETE /api/v1/bookmarks/:id */
  @Delete('bookmarks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBookmark(@Param('id') id: string, @Session() session: SessionContext): Promise<void> {
    const actor = session.user;
    await this.commandBus.execute(new DeleteBookmarkCommand(id, actor));
  }
}
