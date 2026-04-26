/**
 * WHY this file exists:
 * HTTP entry point for the Learning bounded context's note slice. Separated
 * from ProgressController and BookmarksController because notes have a
 * distinct resource shape (single per-(user, lesson) row, no list).
 *
 * Responsibilities:
 *   1. Extract the actor from @Session() — resolved by the global SessionGuard.
 *   2. Dispatch Command or Query via CQRS bus.
 *   3. Return the result typed per the OpenAPI spec.
 *
 * No business logic, no Prisma, no domain mapping here.
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { DeleteNoteCommand } from './application/commands/delete-note.command';
import { UpsertNoteCommand } from './application/commands/upsert-note.command';
import { GetNoteQuery } from './application/queries/get-note.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { NoteDto, UpsertNoteRequest } from '@app/api-client-ts';

@Controller({ path: 'notes', version: '1' })
export class NotesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** PUT /api/v1/notes */
  @Put()
  async upsertNote(
    @Body() body: UpsertNoteRequest,
    @Session() session: SessionContext,
  ): Promise<NoteDto> {
    const actor = session.user;
    return this.commandBus.execute<UpsertNoteCommand, NoteDto>(
      new UpsertNoteCommand(body.lessonId, body.body, actor),
    );
  }

  /** GET /api/v1/notes/:lessonId */
  @Get(':lessonId')
  async getNote(
    @Param('lessonId') lessonId: string,
    @Session() session: SessionContext,
  ): Promise<NoteDto> {
    const actor = session.user;
    return this.queryBus.execute<GetNoteQuery, NoteDto>(new GetNoteQuery(lessonId, actor));
  }

  /** DELETE /api/v1/notes/:lessonId */
  @Delete(':lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(
    @Param('lessonId') lessonId: string,
    @Session() session: SessionContext,
  ): Promise<void> {
    const actor = session.user;
    await this.commandBus.execute(new DeleteNoteCommand(lessonId, actor));
  }
}
