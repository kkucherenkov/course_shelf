/**
 * WHY this file exists:
 * Note is the aggregate root for the per-user, per-lesson note slice.
 * It owns all invariants:
 *   - body is trimmed on entry.
 *   - After trimming, body must be 1..16384 characters long.
 *     An empty string after trim is rejected (NoteInvalidError).
 *     A body exceeding 16384 chars after trim is also rejected.
 *   - setBody() applies the same rules and advances updatedAt.
 *
 * No Prisma types. No NestJS decorators. Infrastructure stays in infra/.
 */
import { NoteInvalidError } from './note.errors';

const BODY_MAX = 16_384;

function validateBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new NoteInvalidError('Note body must not be empty after trimming.');
  }
  if (trimmed.length > BODY_MAX) {
    throw new NoteInvalidError(
      `Note body must be at most ${String(BODY_MAX)} characters (got ${String(trimmed.length)}).`,
    );
  }
  return trimmed;
}

export interface NoteProps {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  body: string;
  readonly createdAt: Date;
  updatedAt: Date;
}

export class Note {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  body: string;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: NoteProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.lessonId = props.lessonId;
    this.body = props.body;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new Note aggregate.
   * Throws `NoteInvalidError` when:
   *   - body is empty after trimming
   *   - body exceeds 16384 characters after trimming
   */
  static create(params: { id: string; userId: string; lessonId: string; body: string }): Note {
    const body = validateBody(params.body);
    const now = new Date();
    return new Note({
      id: params.id,
      userId: params.userId,
      lessonId: params.lessonId,
      body,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitutes a Note from a persisted row. Bypasses invariant checks
   * because the DB is the source of truth for already-valid rows.
   */
  static reconstitute(props: NoteProps): Note {
    return new Note(props);
  }

  /**
   * Replaces the note body. Applies the same invariants as create():
   *   - trims body
   *   - empty after trim → NoteInvalidError
   *   - length > 16384 after trim → NoteInvalidError
   * Advances updatedAt to now.
   *
   * Returns `this` for convenience.
   */
  setBody(body: string): this {
    this.body = validateBody(body);
    this.updatedAt = new Date();
    return this;
  }
}
