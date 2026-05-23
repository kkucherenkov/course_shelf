/**
 * WHY this file exists:
 * DisplayName enforces that names for lightweight aggregates (Instructor,
 * Studio, Tag) are non-empty after trimming and do not exceed the 200-character
 * display limit. Centralising the invariant here means each aggregate does not
 * repeat the validation logic.
 */
import { DisplayNameInvalidError } from './shared.errors';

const MAX_LENGTH = 200;

export class DisplayName {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Validates and constructs a DisplayName. Trims whitespace before checking
   * so a whitespace-only string is treated as blank.
   *
   * @param raw        Raw string to validate.
   * @param entityName Human-readable entity name for the error message.
   * @throws DisplayNameInvalidError when blank or over-length.
   */
  static from(raw: string, entityName: string): DisplayName {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new DisplayNameInvalidError(entityName, 'must not be empty');
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new DisplayNameInvalidError(
        entityName,
        `must not exceed ${String(MAX_LENGTH)} characters; got ${String(trimmed.length)}`,
      );
    }
    return new DisplayName(trimmed);
  }

  /** Structural equality — two DisplayNames with the same value are equal. */
  equals(other: DisplayName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
