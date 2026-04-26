/**
 * WHY this file exists:
 * HTTP entry point for the Learning bounded context's note slice. Separated
 * from ProgressController and BookmarksController because notes have a
 * distinct resource shape (single per-(user, lesson) row, no list).
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
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { DeleteNoteCommand } from './application/commands/delete-note.command';
import { UpsertNoteCommand } from './application/commands/upsert-note.command';
import { GetNoteQuery } from './application/queries/get-note.query';

import type { Request } from 'express';
import type { NoteDto, UpsertNoteRequest } from '@app/api-client-ts';

@UseGuards(SessionGuard)
@Controller({ path: 'notes', version: '1' })
export class NotesController {
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

  /** PUT /api/v1/notes */
  @Put()
  async upsertNote(@Body() body: UpsertNoteRequest, @Req() req: Request): Promise<NoteDto> {
    const actor = await this.resolveActor(req);
    return this.commandBus.execute<UpsertNoteCommand, NoteDto>(
      new UpsertNoteCommand(body.lessonId, body.body, actor),
    );
  }

  /** GET /api/v1/notes/:lessonId */
  @Get(':lessonId')
  async getNote(@Param('lessonId') lessonId: string, @Req() req: Request): Promise<NoteDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<GetNoteQuery, NoteDto>(new GetNoteQuery(lessonId, actor));
  }

  /** DELETE /api/v1/notes/:lessonId */
  @Delete(':lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(@Param('lessonId') lessonId: string, @Req() req: Request): Promise<void> {
    const actor = await this.resolveActor(req);
    await this.commandBus.execute(new DeleteNoteCommand(lessonId, actor));
  }
}
