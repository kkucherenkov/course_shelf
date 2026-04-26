/**
 * WHY this file exists:
 * Orchestrates the "batch record lesson progress" use case.
 *
 * Iterates items sequentially — not Promise.all — for two reasons:
 *   1. Keeps Prisma writes serial: with 200 items the total latency is bounded and
 *      predictable; parallel writes would race on the same (userId, lessonId) row.
 *   2. Preserves input order deterministically in the output array.
 *
 * Per-item PermissionDenied (covers both "forbidden" and "lesson not found" per the
 * no-oracle rule) is caught and turned into `{ status: 'forbidden', lessonId }`.
 * Any other error re-throws, allowing the whole batch to 500 cleanly.
 *
 * `stale` vs `accepted` classification:
 *   post-merge `lastSeenAt` strictly greater than the client's `clientUpdatedAt`
 *   → `stale` (server already had newer state).
 *   Equal timestamps count as `accepted`.
 */
import { CommandHandler, CommandBus, ICommandHandler } from '@nestjs/cqrs';

import { PermissionDenied } from '../../../../shared/domain-error';
import { RecordProgressCommand } from './record-progress.command';
import { RecordProgressBatchCommand } from './record-progress-batch.command';

import type {
  BatchProgressItemResult,
  BatchProgressResponse,
  LessonProgressDto,
} from '@app/api-client-ts';

@CommandHandler(RecordProgressBatchCommand)
export class RecordProgressBatchHandler implements ICommandHandler<
  RecordProgressBatchCommand,
  BatchProgressResponse
> {
  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: RecordProgressBatchCommand): Promise<BatchProgressResponse> {
    const { items, actor } = command;

    const results: BatchProgressItemResult[] = [];

    for (const item of items) {
      let result: BatchProgressItemResult;

      try {
        const state = await this.commandBus.execute<RecordProgressCommand, LessonProgressDto>(
          new RecordProgressCommand(
            item.lessonId,
            item.positionSeconds,
            item.durationSeconds,
            item.clientUpdatedAt,
            actor,
          ),
        );

        // Strict comparison: equal timestamps are accepted, not stale.
        const serverTs = new Date(state.lastSeenAt).getTime();
        const clientTs = item.clientUpdatedAt.getTime();

        result = serverTs > clientTs ? { status: 'stale', state } : { status: 'accepted', state };
      } catch (error) {
        if (error instanceof PermissionDenied) {
          result = { status: 'forbidden', lessonId: item.lessonId };
        } else {
          throw error;
        }
      }

      results.push(result);
    }

    return { results };
  }
}
