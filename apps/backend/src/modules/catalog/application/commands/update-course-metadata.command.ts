/**
 * WHY this file exists:
 * Plain data object carrying the inputs for an admin-only metadata update.
 * The patch is a partial — all fields are optional but at least one must
 * be set (enforced by express-openapi-validator upstream; the handler does not
 * re-check because the validator already rejected empty-patch requests).
 *
 * Null semantics for *Ids arrays:
 *   - undefined (key absent): leave the field unchanged.
 *   - null: clear all associations (equivalent to passing []).
 *   - string[]: set-replace with the given ids.
 *
 * Date fields (releaseDate, sourceUpdatedAt) arrive as Date objects — the
 * controller is responsible for parsing ISO strings before constructing this
 * command.
 */
import type { CourseLevel } from '../../domain/course/course';
import type { ExternalIdRef } from '../../domain/shared-vo/external-id-ref';

export class UpdateCourseMetadataCommand {
  constructor(
    public readonly courseId: string,
    public readonly actor: { id: string; role: string },
    public readonly patch: {
      title?: string;
      description?: string;
      slug?: string;
      posterUrl?: string | null;
      level?: CourseLevel | null;
      language?: string | null;
      releaseDate?: Date | null;
      sourceUpdatedAt?: Date | null;
      ratingAverage?: number | null;
      ratingCount?: number | null;
      externalIds?: ExternalIdRef[] | null;
      instructorIds?: string[] | null;
      studioIds?: string[] | null;
      tagIds?: string[] | null;
    },
  ) {}
}
