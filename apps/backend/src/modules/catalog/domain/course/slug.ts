/**
 * WHY this file exists:
 * Slug is a value object that enforces the URL-safe slug invariant on construction.
 * The regex is copied verbatim from the OpenAPI schema so the domain and wire
 * contract share a single source of truth.
 *
 * Branding via Brand<string, 'CourseSlug'> prevents accidental assignment of a
 * plain string where a Slug value object is expected at compile time.
 */
import { brand } from '../../../../shared/branded-id';
import { CourseSlugInvalidError } from './course.errors';

import type { Brand } from '../../../../shared/branded-id';

/** Phantom-branded raw value. Used so domain types distinguish Slug from string. */
export type CourseSlugBrand = Brand<string, 'CourseSlug'>;

/** Regex from the OpenAPI schema: 1–100 chars, lowercase alphanum + hyphen, no leading/trailing hyphen. */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/;

export class Slug {
  readonly value: CourseSlugBrand;

  private constructor(value: string) {
    this.value = brand<string, 'CourseSlug'>(value);
  }

  /**
   * Validates and constructs a Slug. Trims leading/trailing whitespace before
   * applying the regex so superficial padding does not cause a spurious error.
   *
   * Throws CourseSlugInvalidError when the trimmed value does not match.
   */
  static from(raw: string): Slug {
    const trimmed = raw.trim();
    if (!SLUG_RE.test(trimmed)) {
      throw new CourseSlugInvalidError(raw);
    }
    return new Slug(trimmed);
  }

  /** Structural equality — two Slugs with the same value are equal. */
  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
