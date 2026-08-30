/**
 * WHY this file exists:
 * The endpoint the admin transcription card polls: the most recent run for a
 * library whatever its status. 404 when the library has never been transcribed —
 * the contract folds "no library" and "no run" into one Not Found.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TranscriptionNotFoundError } from '../../domain/transcription/transcription.errors';
import { TRANSCRIPTION_REPOSITORY } from '../../domain/transcription/transcription.repository';
import { toTranscriptionDto } from '../../transcriptions.dto';

import { GetLatestTranscriptionQuery } from './get-latest-transcription.query';

import type { TranscriptionRepository } from '../../domain/transcription/transcription.repository';
import type { TranscriptionDto } from '@app/api-client-ts';

@QueryHandler(GetLatestTranscriptionQuery)
export class GetLatestTranscriptionHandler implements IQueryHandler<
  GetLatestTranscriptionQuery,
  TranscriptionDto
> {
  constructor(
    @Inject(TRANSCRIPTION_REPOSITORY) private readonly transcriptions: TranscriptionRepository,
  ) {}

  async execute(query: GetLatestTranscriptionQuery): Promise<TranscriptionDto> {
    const transcription = await this.transcriptions.findLatestForLibrary(query.libraryId);
    if (!transcription) {
      throw new TranscriptionNotFoundError('No transcription record found for this library.');
    }
    return toTranscriptionDto(transcription);
  }
}
