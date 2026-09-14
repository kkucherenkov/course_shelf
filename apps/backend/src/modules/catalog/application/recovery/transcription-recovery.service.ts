/**
 * WHY this file exists:
 * A killed process (SIGKILL, a container recreate mid-run) leaves no chance
 * to write a terminal state — the fire-and-forget walk in
 * `RunTranscriptionHandler` dies with it, and the row it was updating stays
 * `status: running` forever. The at-most-one-running-per-library guard
 * (`TranscriptionAlreadyRunningError`) then refuses every future run until
 * someone edits the row by hand (#525).
 *
 * Recovery happens at BOOT, not at failure time — a SIGKILL gives the old
 * process no chance to recover itself, so the next process has to. "No live
 * owner" is decidable rather than guessed: `AppConfig.bootId` is a random id
 * generated once per process start and stamped on every run it starts. By the
 * time this hook fires, the current process has started nothing yet, so any
 * `running` row it finds necessarily belongs to an earlier, now-dead process
 * — a single equality check, no heartbeat staleness window to tune.
 *
 * Per-lesson work survives on its own (transcripts are committed one lesson
 * at a time, and the skip rule makes a re-run cheap) — this hook only clears
 * the run's own status so the already-running guard lets a new run start. It
 * never touches Transcript rows.
 */
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { AppConfig } from '../../../../common/config/app-config';
import { TRANSCRIPTION_REPOSITORY } from '../../domain/transcription/transcription.repository';

import type { TranscriptionRepository } from '../../domain/transcription/transcription.repository';

@Injectable()
export class TranscriptionRecoveryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TranscriptionRecoveryService.name);

  constructor(
    @Inject(TRANSCRIPTION_REPOSITORY) private readonly transcriptions: TranscriptionRepository,
    private readonly appConfig: AppConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const stale = await this.transcriptions.findStaleRunning(this.appConfig.bootId);
    for (const transcription of stale) {
      transcription.interrupt();
      await this.transcriptions.save(transcription);
    }

    if (stale.length > 0) {
      this.logger.warn(
        `Recovered ${String(stale.length)} transcription run(s) left running by a ` +
          `previous process: ${stale.map((t) => t.id).join(', ')}`,
      );
    }
  }
}
