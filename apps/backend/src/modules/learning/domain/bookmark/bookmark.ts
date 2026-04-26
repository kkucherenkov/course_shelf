/**
 * WHY this file exists:
 * Bookmark is the aggregate root for the per-user, per-lesson bookmark slice.
 * It owns all invariants:
 *   - positionSeconds >= 0 (negative positions are meaningless).
 *   - label, when provided, is trimmed; after trim it must be 1–200 chars.
 *     An empty string after trim is rejected (BookmarkInvalidError).
 *   - update() requires at least one field to be defined; if both positionSeconds
 *     and label are undefined the call throws BookmarkUpdateEmptyError.
 *   - label === null on update() explicitly clears the stored label;
 *     label === undefined leaves the stored label untouched.
 *
 * No Prisma types. No NestJS decorators. Infrastructure stays in infra/.
 */
import { BookmarkInvalidError, BookmarkUpdateEmptyError } from './bookmark.errors';

const LABEL_MAX = 200;

function validateLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) {
    throw new BookmarkInvalidError('Bookmark label must not be empty after trimming.');
  }
  if (trimmed.length > LABEL_MAX) {
    throw new BookmarkInvalidError(
      `Bookmark label must be at most ${String(LABEL_MAX)} characters (got ${String(trimmed.length)}).`,
    );
  }
  return trimmed;
}

function validatePosition(positionSeconds: number): void {
  if (positionSeconds < 0) {
    throw new BookmarkInvalidError(`positionSeconds must be >= 0, got ${String(positionSeconds)}.`);
  }
}

export interface BookmarkProps {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  positionSeconds: number;
  label: string | undefined;
  readonly createdAt: Date;
  updatedAt: Date;
}

export class Bookmark {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  positionSeconds: number;
  label: string | undefined;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: BookmarkProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.lessonId = props.lessonId;
    this.positionSeconds = props.positionSeconds;
    this.label = props.label;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new Bookmark aggregate.
   * Throws `BookmarkInvalidError` when:
   *   - positionSeconds < 0
   *   - label is provided but empty after trim, or exceeds 200 chars
   */
  static create(params: {
    id: string;
    userId: string;
    lessonId: string;
    positionSeconds: number;
    label?: string;
  }): Bookmark {
    validatePosition(params.positionSeconds);

    const label = params.label === undefined ? undefined : validateLabel(params.label);

    const now = new Date();
    return new Bookmark({
      id: params.id,
      userId: params.userId,
      lessonId: params.lessonId,
      positionSeconds: params.positionSeconds,
      label,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitutes a Bookmark from a persisted row. Bypasses invariant checks
   * because the DB is the source of truth for already-valid rows.
   */
  static reconstitute(props: BookmarkProps): Bookmark {
    return new Bookmark(props);
  }

  /**
   * Applies a partial update.
   *
   * Rules:
   *   - At least one of positionSeconds / label must not be undefined; otherwise
   *     throws BookmarkUpdateEmptyError.
   *   - label === null clears the stored label.
   *   - label === undefined leaves the stored label untouched.
   *   - label === string (non-null) trims and validates; throws BookmarkInvalidError
   *     on empty-after-trim or too long.
   *   - positionSeconds < 0 throws BookmarkInvalidError.
   *
   * Returns `this` for convenience.
   */
  update(patch: { positionSeconds?: number; label?: string | null }): this {
    if (patch.positionSeconds === undefined && patch.label === undefined) {
      throw new BookmarkUpdateEmptyError();
    }

    if (patch.positionSeconds !== undefined) {
      validatePosition(patch.positionSeconds);
      this.positionSeconds = patch.positionSeconds;
    }

    if (patch.label === null) {
      this.label = undefined;
    } else if (patch.label !== undefined) {
      this.label = validateLabel(patch.label);
    }
    // label === undefined → no-op (leave untouched)

    this.updatedAt = new Date();
    return this;
  }
}
