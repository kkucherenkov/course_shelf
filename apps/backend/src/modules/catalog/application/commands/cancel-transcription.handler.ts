/**
 * WHY this file exists:
 * Marks a running transcription cancelled. Cancellation is cooperative: this
 * handler only writes the terminal status, and the walk — which re-reads its own
 * run between lessons — stops after the lesson it is currently working on. The
 * in-flight whisper child is deliberately allowed to finish rather than being
 * killed, because a killed child leaves a truncated `.srt` behind.
 *
 * That is also why the route answers 202 rather than 200: the run has been asked
 * to stop, not observed stopping. The DTO returned still shows `running` when
 * the walk is mid-lesson, and the aggregate's own status is already `cancelled`.
 *
 * Cancelling an already-terminal run throws TranscriptionInTerminalStateError
 * (409) from the aggregate itself — no status check is duplicated here.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { TranscriptionNotFoundError } from '../../domain/transcription/transcription.errors';
import { TRANSCRIPTION_REPOSITORY } from '../../domain/transcription/transcription.repository';
import { toTranscriptionDto } from '../../transcriptions.dto';

import { CancelTranscriptionCommand } from './cancel-transcription.command';

import type { TranscriptionRepository } from '../../domain/transcription/transcription.repository';
import type { TranscriptionDto } from '@app/api-client-ts';

@CommandHandler(CancelTranscriptionCommand)
export class CancelTranscriptionHandler implements ICommandHandler<
  CancelTranscriptionCommand,
  TranscriptionDto
> {
  constructor(
    @Inject(TRANSCRIPTION_REPOSITORY) private readonly transcriptions: TranscriptionRepository,
  ) {}

  async execute(command: CancelTranscriptionCommand): Promise<TranscriptionDto> {
    const transcription = await this.transcriptions.findById(command.transcriptionId);
    if (!transcription) {
      throw new TranscriptionNotFoundError(
        `No transcription with id ${command.transcriptionId} exists.`,
      );
    }

    transcription.cancel();
    await this.transcriptions.save(transcription);

    return toTranscriptionDto(transcription);
  }
}
