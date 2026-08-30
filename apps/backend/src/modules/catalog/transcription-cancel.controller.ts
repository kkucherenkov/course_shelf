/**
 * WHY this file exists:
 * `POST /api/v1/transcriptions/{id}/cancel` is addressed by the run's own id, not
 * by a library, so it cannot share TranscriptionsController's `libraries/:id`
 * base path. One route, its own controller, same AdminGuard.
 *
 * 202 rather than 200: cancellation is cooperative — the walk stops after the
 * lesson it is currently working on.
 */
import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { CancelTranscriptionCommand } from './application/commands/cancel-transcription.command';

import type { TranscriptionDto } from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'transcriptions', version: '1' })
export class TranscriptionCancelController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/cancel')
  @HttpCode(HttpStatus.ACCEPTED)
  async cancelTranscription(@Param('id') id: string): Promise<TranscriptionDto> {
    return this.commandBus.execute<CancelTranscriptionCommand, TranscriptionDto>(
      new CancelTranscriptionCommand(id),
    );
  }
}
