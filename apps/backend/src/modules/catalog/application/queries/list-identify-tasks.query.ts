/** WHY this file exists: inputs for listing identify tasks with optional filters. */
import type { IdentifyTaskStatus } from '../../domain/identify/identify-task';

export class ListIdentifyTasksQuery {
  constructor(
    public readonly status: IdentifyTaskStatus | undefined,
    public readonly courseId: string | undefined,
  ) {}
}
