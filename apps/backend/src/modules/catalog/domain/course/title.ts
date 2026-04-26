/**
 * WHY this file exists:
 * Title enforces that course and section titles are non-empty after trimming and
 * do not exceed the 200-character display limit. Using a value object instead of
 * a raw string means the invariant is guaranteed at every call site without
 * repeating the validation logic.
 */
import { CourseTitleInvalidError } from './course.errors';

const MAX_LENGTH = 200;

export class Title {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Validates and constructs a Title. Trims whitespace before checking length
   * so " " (whitespace-only) is treated as blank.
   *
   * Throws CourseTitleInvalidError for blank or over-length input.
   */
  static from(raw: string): Title {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new CourseTitleInvalidError('Course title must not be empty.');
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new CourseTitleInvalidError(
        `Course title must not exceed ${String(MAX_LENGTH)} characters; got ${String(trimmed.length)}.`,
      );
    }
    return new Title(trimmed);
  }

  equals(other: Title): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
