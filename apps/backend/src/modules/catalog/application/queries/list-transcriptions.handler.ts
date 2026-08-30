/**
 * WHY this file exists:
 * Transcription history for one library, newest first. A library with no runs is
 * an empty list rather than a 404 — the contract's `empty` example says so, and
 * a history screen that 404s on a fresh library would be a lie about the library.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { TRANSCRIPTION_REPOSITORY } from '../../domain/transcription/transcription.repository';
import { toTranscriptionDto } from '../../transcriptions.dto';

import { ListTranscriptionsQuery } from './list-transcriptions.query';

import type { LibraryRepository } from '../../domain/library/library.repository';
import type { TranscriptionRepository } from '../../domain/transcription/transcription.repository';
import type { TranscriptionListDto } from '@app/api-client-ts';

@QueryHandler(ListTranscriptionsQuery)
export class ListTranscriptionsHandler implements IQueryHandler<
  ListTranscriptionsQuery,
  TranscriptionListDto
> {
  constructor(
    @Inject(TRANSCRIPTION_REPOSITORY) private readonly transcriptions: TranscriptionRepository,
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
  ) {}

  async execute(query: ListTranscriptionsQuery): Promise<TranscriptionListDto> {
    // An unknown library is a 404, per the contract — otherwise a typo'd id
    // would answer "this library has no runs", which is a different claim.
    const library = await this.libraryRepo.findById(query.libraryId);
    if (!library) throw new LibraryNotFoundError(query.libraryId);

    const runs = await this.transcriptions.listForLibrary(query.libraryId, query.limit);
    return { items: runs.map((run) => toTranscriptionDto(run)) };
  }
}
