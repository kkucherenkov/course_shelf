/**
 * WHY this file exists:
 * Orchestrates the "batch record lesson progress" use case.
 *
 * Iterates items sequentially — not Promise.all — for two reasons:
 *   1. Keeps Prisma writes serial: with 200 items the total latency is bounded and
 *      predictable; parallel writes would race on the same (userId, lessonId) row.
 *   2. Preserves input order deterministically in the output array.
 *
 * Per-item PermissionDenied AND LessonNotFoundError both become
 * `{ status: 'forbidden', lessonId }` — that is the no-oracle rule the spec
 * states for this operation: "`forbidden` covers both 'no READ grant' and
 * 'lesson does not exist'". Only PermissionDenied was caught until #321, so an
 * unknown lesson id escaped as a 404 that (a) aborted the whole batch, which
 * the spec says per-item failures must never do, and (b) told the caller the
 * lesson does not exist, which is the oracle the rule exists to deny — and it
 * echoed the id back in `detail`. An offline client syncing a batch that
 * happens to include a since-deleted lesson lost the other 199 writes.
 *
 * Any other error re-throws, allowing the whole batch to 500 cleanly.
 *
 * `stale` vs `accepted` classification:
 *   post-merge `lastSeenAt` strictly greater than the client's `clientUpdatedAt`
 *   → `stale` (server already had newer state).
 *   Equal timestamps count as `accepted`.
 */
import { CommandHandler, CommandBus, ICommandHandler } from '@nestjs/cqrs';

import { LessonNotFoundError } from '../../../../common/catalog-tokens';
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
        if (error instanceof PermissionDenied || error instanceof LessonNotFoundError) {
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
