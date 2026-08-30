/**
 * Unit tests for TranscriptionsController.
 *
 * Only the two controller-layer decisions live here — everything else is a bare
 * bus dispatch already covered by the handler specs:
 *   - an omitted request body means `force: false`;
 *   - an omitted `?limit` means the contract's default of 20.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Transcription } from './domain/transcription/transcription';
import { TranscriptionsController } from './transcriptions.controller';

import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { SessionContext } from '../../common/auth/decorators';

const session: SessionContext = { user: { id: 'u1', role: 'admin' }, sessionId: 'sess-1' };

function makeRun(): Transcription {
  return Transcription.start({
    id: 'run-1',
    libraryId: 'lib-1',
    force: false,
    lessonsTotal: 3,
  });
}

describe('TranscriptionsController', () => {
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let controller: TranscriptionsController;

  beforeEach(() => {
    commandBus = { execute: vi.fn().mockResolvedValue(makeRun()) } as unknown as CommandBus;
    queryBus = { execute: vi.fn().mockResolvedValue({ items: [] }) } as unknown as QueryBus;
    controller = new TranscriptionsController(commandBus, queryBus);
  });

  it('defaults force to false when the body is omitted', async () => {
    const dto = await controller.startTranscription('lib-1', session);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ libraryId: 'lib-1', force: false, actorUserId: 'u1' }),
    );
    expect(dto.status).toBe('running');
    expect(dto.lessonsTotal).toBe(3);
  });

  it('passes force through when the body carries it', async () => {
    await controller.startTranscription('lib-1', session, { force: true });

    expect(commandBus.execute).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
  });

  it('defaults the history limit to 20', async () => {
    await controller.listLibraryTranscriptions('lib-1');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ libraryId: 'lib-1', limit: 20 }),
    );
  });

  it('honours an explicit limit', async () => {
    await controller.listLibraryTranscriptions('lib-1', '5');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });
});
