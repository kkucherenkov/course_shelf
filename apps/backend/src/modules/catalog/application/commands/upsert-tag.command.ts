/**
 * WHY this file exists:
 * Plain data object carrying the inputs for a tag upsert operation.
 * Mirrors UpsertInstructorCommand but adds the optional category field
 * unique to the Tag aggregate.
 */
import type { ExternalIdRef } from '../../domain/shared-vo/external-id-ref';

export class UpsertTagCommand {
  constructor(
    public readonly displayName: string,
    public readonly slug: string | undefined,
    public readonly category: string | null | undefined,
    public readonly externalIds: readonly ExternalIdRef[] | undefined,
  ) {}
}
