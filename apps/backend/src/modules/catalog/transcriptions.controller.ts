/**
 * WHY this file exists:
 * HTTP entry point for transcription runs on a library, shaped exactly like
 * ScansController: admin-only, POST answers 202 with the freshly-persisted
 * running aggregate while the walk continues behind the response.
 *
 * The cancel route lives in `transcription-cancel.controller.ts` because its
 * path is `/transcriptions/{id}/cancel` — not under `/libraries/{id}`.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { RunTranscriptionCommand } from './application/commands/run-transcription.command';
import { GetLatestTranscriptionQuery } from './application/queries/get-latest-transcription.query';
import { ListTranscriptionsQuery } from './application/queries/list-transcriptions.query';
import { toTranscriptionDto } from './transcriptions.dto';

import type { SessionContext } from '../../common/auth/decorators';
import type { Transcription } from './domain/transcription/transcription';
import type {
  StartTranscriptionRequest,
  TranscriptionDto,
  TranscriptionListDto,
} from '@app/api-client-ts';

/** Contract default for `?limit`; the validator caps the value at 100. */
const DEFAULT_LIST_LIMIT = 20;

@UseGuards(AdminGuard)
@Controller({ path: 'libraries/:id/transcriptions', version: '1' })
export class TranscriptionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /api/v1/libraries/:id/transcriptions
   * Accepts the run and returns 202 with the running aggregate. The walk starts
   * once this response has flushed.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async startTranscription(
    @Param('id') id: string,
    @Session() session: SessionContext,
    @Body() body?: StartTranscriptionRequest,
  ): Promise<TranscriptionDto> {
    const transcription = await this.commandBus.execute<RunTranscriptionCommand, Transcription>(
      new RunTranscriptionCommand(id, body?.force ?? false, session.user.id),
    );
    return toTranscriptionDto(transcription);
  }

  /** GET /api/v1/libraries/:id/transcriptions — history, newest first. */
  @Get()
  async listLibraryTranscriptions(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ): Promise<TranscriptionListDto> {
    // The validator has already rejected anything outside 1..100; the fallback
    // covers the omitted-parameter case only.
    const parsed = limit === undefined ? Number.NaN : Number(limit);
    return this.queryBus.execute<ListTranscriptionsQuery, TranscriptionListDto>(
      new ListTranscriptionsQuery(id, Number.isNaN(parsed) ? DEFAULT_LIST_LIMIT : parsed),
    );
  }

  /** GET /api/v1/libraries/:id/transcriptions/latest — what the admin card polls. */
  @Get('latest')
  async getLatestLibraryTranscription(@Param('id') id: string): Promise<TranscriptionDto> {
    return this.queryBus.execute<GetLatestTranscriptionQuery, TranscriptionDto>(
      new GetLatestTranscriptionQuery(id),
    );
  }
}
