/**
 * Unit tests for TranscriptionRecoveryService. TranscriptionRepository is
 * mocked — the query really selecting a stale row is proven separately in
 * `prisma-transcription.repository.integration.spec.ts` against a real
 * Postgres. This spec is about what the service DOES with what the port
 * returns: interrupt every stale run and persist it, log only when there was
 * something to recover.
 */
import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Transcription } from '../../domain/transcription/transcription';
import { TranscriptionRecoveryService } from './transcription-recovery.service';

import type { TranscriptionRepository } from '../../domain/transcription/transcription.repository';
import type { AppConfig } from '../../../../common/config/app-config';

function makeRun(id: string, bootId: string): Transcription {
  return Transcription.start({ id, libraryId: 'lib-1', force: false, lessonsTotal: 3, bootId });
}

function makeTranscriptions(stale: Transcription[]): TranscriptionRepository {
  return {
    save: vi.fn(async () => undefined),
    findById: vi.fn(async () => null),
    findLatestForLibrary: vi.fn(async () => null),
    findRunningForLibrary: vi.fn(async () => null),
    listForLibrary: vi.fn(async () => []),
    findStaleRunning: vi.fn(async () => stale),
  };
}

function makeAppConfig(bootId = 'boot-current'): AppConfig {
  return { bootId } as unknown as AppConfig;
}

describe('TranscriptionRecoveryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('interrupts and persists every stale run, asking the port for the current bootId', async () => {
    const stale = [makeRun('t1', 'boot-old-1'), makeRun('t2', 'boot-old-2')];
    const transcriptions = makeTranscriptions(stale);
    const service = new TranscriptionRecoveryService(transcriptions, makeAppConfig('boot-current'));

    await service.onApplicationBootstrap();

    expect(transcriptions.findStaleRunning).toHaveBeenCalledWith('boot-current');
    expect(stale.every((t) => t.status === 'interrupted')).toBe(true);
    expect(transcriptions.save).toHaveBeenCalledTimes(2);
    expect(transcriptions.save).toHaveBeenCalledWith(stale[0]);
    expect(transcriptions.save).toHaveBeenCalledWith(stale[1]);
  });

  it('is a silent no-op when nothing is stale', async () => {
    const transcriptions = makeTranscriptions([]);
    const service = new TranscriptionRecoveryService(transcriptions, makeAppConfig());

    await service.onApplicationBootstrap();

    expect(transcriptions.save).not.toHaveBeenCalled();
    expect(Logger.prototype.warn).not.toHaveBeenCalled();
  });

  it('logs a summary naming every recovered run when something was stale', async () => {
    const stale = [makeRun('t1', 'boot-old')];
    const transcriptions = makeTranscriptions(stale);
    const service = new TranscriptionRecoveryService(transcriptions, makeAppConfig());

    await service.onApplicationBootstrap();

    expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining('t1'));
  });
});
