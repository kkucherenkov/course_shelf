/**
 * Unit tests for RecordProgressBatchHandler.
 *
 * The handler delegates per-item writes to RecordProgressCommand via CommandBus.
 * CommandBus is fully mocked — no real NestJS module, no DB.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';

import { RecordProgressBatchCommand } from './record-progress-batch.command';
import { RecordProgressBatchHandler } from './record-progress-batch.handler';

import type { LessonProgressDto } from '@app/api-client-ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTOR = { id: 'user-1', role: 'user' };

function makeDto(lessonId: string, lastSeenAt: string): LessonProgressDto {
  return {
    lessonId,
    positionSeconds: 30,
    durationSeconds: 100,
    percent: 30,
    completed: false,
    lastSeenAt,
  };
}

function makeCommandBus(executeFn: (cmd: unknown) => Promise<unknown>) {
  return { execute: vi.fn(executeFn) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RecordProgressBatchHandler', () => {
  describe('three items, three different outcomes', () => {
    it('returns accepted, stale, and forbidden results in input order', async () => {
      // lessonA: clientUpdatedAt === lastSeenAt  → accepted
      // lessonB: clientUpdatedAt < lastSeenAt    → stale
      // lessonC: PermissionDenied thrown         → forbidden

      const lessonAClientTs = '2026-04-25T14:00:00.000Z';
      const lessonBClientTs = '2026-04-20T08:00:00.000Z';
      const lessonBServerTs = '2026-04-22T10:00:00.000Z';
      const lessonCClientTs = '2026-04-01T00:00:00.000Z';

      const commandBus = makeCommandBus(async (cmd: unknown) => {
        const c = cmd as { lessonId: string };
        if (c.lessonId === 'lessonA') return makeDto('lessonA', lessonAClientTs);
        if (c.lessonId === 'lessonB') return makeDto('lessonB', lessonBServerTs);
        // lessonC
        throw new PermissionDenied('no grant');
      });

      const handler = new RecordProgressBatchHandler(commandBus as never);

      const { results } = await handler.execute(
        new RecordProgressBatchCommand(
          [
            {
              lessonId: 'lessonA',
              positionSeconds: 30,
              durationSeconds: 100,
              clientUpdatedAt: new Date(lessonAClientTs),
            },
            {
              lessonId: 'lessonB',
              positionSeconds: 20,
              durationSeconds: 100,
              clientUpdatedAt: new Date(lessonBClientTs),
            },
            {
              lessonId: 'lessonC',
              positionSeconds: 10,
              durationSeconds: 100,
              clientUpdatedAt: new Date(lessonCClientTs),
            },
          ],
          ACTOR,
        ),
      );

      expect(results).toHaveLength(3);

      expect(results[0]).toEqual({
        status: 'accepted',
        state: makeDto('lessonA', lessonAClientTs),
      });
      expect(results[1]).toEqual({ status: 'stale', state: makeDto('lessonB', lessonBServerTs) });
      expect(results[2]).toEqual({ status: 'forbidden', lessonId: 'lessonC' });
    });
  });

  describe('equal timestamps are accepted, not stale', () => {
    it('returns accepted when clientUpdatedAt === lastSeenAt', async () => {
      const ts = '2026-04-25T14:00:00.000Z';
      const commandBus = makeCommandBus(async () => makeDto('lessonD', ts));
      const handler = new RecordProgressBatchHandler(commandBus as never);

      const { results } = await handler.execute(
        new RecordProgressBatchCommand(
          [
            {
              lessonId: 'lessonD',
              positionSeconds: 50,
              durationSeconds: 100,
              clientUpdatedAt: new Date(ts),
            },
          ],
          ACTOR,
        ),
      );

      expect(results[0]).toMatchObject({ status: 'accepted' });
    });
  });

  describe('non-PermissionDenied error bubbles', () => {
    it('re-throws unexpected errors and does not return results', async () => {
      const commandBus = makeCommandBus(async () => {
        throw new Error('boom');
      });
      const handler = new RecordProgressBatchHandler(commandBus as never);

      await expect(
        handler.execute(
          new RecordProgressBatchCommand(
            [
              {
                lessonId: 'lessonE',
                positionSeconds: 10,
                durationSeconds: 100,
                clientUpdatedAt: new Date(),
              },
            ],
            ACTOR,
          ),
        ),
      ).rejects.toThrow('boom');
    });
  });

  describe('empty items array', () => {
    it('returns empty results array without calling CommandBus', async () => {
      const commandBus = makeCommandBus(async () => {
        throw new Error('should not be called');
      });
      const handler = new RecordProgressBatchHandler(commandBus as never);

      const { results } = await handler.execute(new RecordProgressBatchCommand([], ACTOR));

      expect(results).toHaveLength(0);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('sequential ordering', () => {
    it('calls CommandBus in the same order as input items', async () => {
      const order: string[] = [];
      const commandBus = makeCommandBus(async (cmd: unknown) => {
        const c = cmd as { lessonId: string };
        order.push(c.lessonId);
        return makeDto(c.lessonId, '2026-04-25T00:00:00.000Z');
      });
      const handler = new RecordProgressBatchHandler(commandBus as never);

      const items = ['lessonX', 'lessonY', 'lessonZ'].map((id) => ({
        lessonId: id,
        positionSeconds: 1,
        durationSeconds: 10,
        clientUpdatedAt: new Date('2026-04-25T00:00:00.000Z'),
      }));

      await handler.execute(new RecordProgressBatchCommand(items, ACTOR));

      expect(order).toEqual(['lessonX', 'lessonY', 'lessonZ']);

      // Also verify calls are in input order via mock.calls
      const callLessonIds = vi
        .mocked(commandBus.execute)
        .mock.calls.map((args) => (args[0] as { lessonId: string }).lessonId);
      expect(callLessonIds).toEqual(['lessonX', 'lessonY', 'lessonZ']);
    });
  });
});
