/**
 * WHY this file exists:
 * Plain data object carrying the inputs for an instructor upsert operation.
 * The command is dispatched by both the admin HTTP controller and the
 * MetadataLinker scan helper so the handler logic is not duplicated.
 */
import type { ExternalIdRef } from '../../domain/shared-vo/external-id-ref';

export class UpsertInstructorCommand {
  constructor(
    public readonly displayName: string,
    public readonly slug: string | undefined,
    public readonly externalIds: readonly ExternalIdRef[] | undefined,
  ) {}
}
