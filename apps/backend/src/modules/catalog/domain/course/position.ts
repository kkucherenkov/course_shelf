/**
 * WHY this file exists:
 * Position enforces that section ordering values are positive integers starting
 * at 1. Encoding this in a value object prevents negative or fractional positions
 * from sneaking in through the application layer.
 */
import { PositionInvalidError } from './course.errors';

export class Position {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * Validates and constructs a Position.
   *
   * Throws PositionInvalidError when the value is not an integer ≥ 1.
   */
  static from(value: number): Position {
    if (!Number.isInteger(value) || value < 1) {
      throw new PositionInvalidError(value);
    }
    return new Position(value);
  }

  equals(other: Position): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
