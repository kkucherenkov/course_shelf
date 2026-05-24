/**
 * WHY this file exists:
 * Inputs for applying a proposed identify task. mergePolicy, when present,
 * overrides the policy stored on the task. actor is forwarded into the
 * downstream UpdateCourseMetadataCommand.
 */
import type { MergePolicy } from '../../domain/identify/merge-policy';

export class ApplyIdentifyResultCommand {
  constructor(
    public readonly taskId: string,
    public readonly actor: { id: string; role: string },
    public readonly mergePolicy: MergePolicy | undefined,
  ) {}
}
