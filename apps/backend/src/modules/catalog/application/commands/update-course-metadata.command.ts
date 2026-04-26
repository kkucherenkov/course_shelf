/**
 * WHY this file exists:
 * Plain data object carrying the inputs for an admin-only metadata update.
 * The patch is a partial — all three fields are optional but at least one must
 * be set (enforced by express-openapi-validator upstream; the handler does not
 * re-check because the validator already rejected empty-patch requests).
 */
export class UpdateCourseMetadataCommand {
  constructor(
    public readonly courseId: string,
    public readonly actor: { id: string; role: string },
    public readonly patch: {
      title?: string;
      description?: string;
      slug?: string;
    },
  ) {}
}
