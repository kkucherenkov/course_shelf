/**
 * WHY this file exists:
 * Plain data object carrying the inputs for a studio upsert operation.
 * Mirrors UpsertInstructorCommand — studios are structurally identical to
 * instructors in terms of upsert semantics.
 */
import type { ExternalIdRef } from '../../domain/shared-vo/external-id-ref';

export class UpsertStudioCommand {
  constructor(
    public readonly displayName: string,
    public readonly slug: string | undefined,
    public readonly externalIds: readonly ExternalIdRef[] | undefined,
  ) {}
}
