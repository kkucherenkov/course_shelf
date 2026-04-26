/**
 * WHY this file exists:
 * HTTP entry point for the Learning bounded context's bookmark slice. Separated
 * from ProgressController because the routes have distinct path prefixes
 * (lessons/:lessonId/bookmarks vs bookmarks/:id) and keeping them in a
 * dedicated file avoids mixing two different resource shapes in one controller.
 *
 * Responsibilities:
 *   1. Resolve session → actor (id + role).
 *   2. Dispatch Command or Query via CQRS bus.
 *   3. Return the result typed per the OpenAPI spec.
 *
 * No business logic, no Prisma, no domain mapping here.
 * UnauthorizedException (401) is the only NestJS exception allowed in a
 * controller. All domain errors are thrown by handlers and translated by
 * HttpExceptionFilter to application/problem+json.
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
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { CreateBookmarkCommand } from './application/commands/create-bookmark.command';
import { DeleteBookmarkCommand } from './application/commands/delete-bookmark.command';
import { UpdateBookmarkCommand } from './application/commands/update-bookmark.command';
import { ListBookmarksQuery } from './application/queries/list-bookmarks.query';

import type { Request } from 'express';
import type {
  BookmarkDto,
  BookmarkListDto,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from '@app/api-client-ts';

@UseGuards(SessionGuard)
@Controller({ version: '1' })
export class BookmarksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
  ) {}

  private async resolveActor(req: Request): Promise<{ id: string; role: string }> {
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    return { id: session.user.id, role };
  }

  /** GET /api/v1/lessons/:lessonId/bookmarks */
  @Get('lessons/:lessonId/bookmarks')
  async listBookmarks(
    @Param('lessonId') lessonId: string,
    @Req() req: Request,
  ): Promise<BookmarkListDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<ListBookmarksQuery, BookmarkListDto>(
      new ListBookmarksQuery(lessonId, actor),
    );
  }

  /** POST /api/v1/lessons/:lessonId/bookmarks */
  @Post('lessons/:lessonId/bookmarks')
  @HttpCode(HttpStatus.CREATED)
  async createBookmark(
    @Param('lessonId') lessonId: string,
    @Body() body: CreateBookmarkRequest,
    @Req() req: Request,
  ): Promise<BookmarkDto> {
    const actor = await this.resolveActor(req);
    return this.commandBus.execute<CreateBookmarkCommand, BookmarkDto>(
      new CreateBookmarkCommand(lessonId, body.positionSeconds, body.label, actor),
    );
  }

  /** PATCH /api/v1/bookmarks/:id */
  @Patch('bookmarks/:id')
  async updateBookmark(
    @Param('id') id: string,
    @Body() body: UpdateBookmarkRequest,
    @Req() req: Request,
  ): Promise<BookmarkDto> {
    const actor = await this.resolveActor(req);
    return this.commandBus.execute<UpdateBookmarkCommand, BookmarkDto>(
      new UpdateBookmarkCommand(id, body.positionSeconds, body.label, actor),
    );
  }

  /** DELETE /api/v1/bookmarks/:id */
  @Delete('bookmarks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBookmark(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const actor = await this.resolveActor(req);
    await this.commandBus.execute(new DeleteBookmarkCommand(id, actor));
  }
}
