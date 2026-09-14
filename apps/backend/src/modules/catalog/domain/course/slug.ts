/**
 * WHY this file exists:
 * Slug is a value object that enforces the URL-safe slug invariant on construction.
 * The regex lives in shared-vo/entity-slug and is copied verbatim from the
 * OpenAPI schema, so the domain and the wire contract share a single source of
 * truth — and `CourseSlug` and `EntitySlug` cannot drift apart from each other
 * either, which they previously could because each held its own copy.
 *
 * Branding via Brand<string, 'CourseSlug'> prevents accidental assignment of a
 * plain string where a Slug value object is expected at compile time.
 */
import { brand } from '../../../../shared/branded-id';
import { SLUG_RE } from '../shared-vo/entity-slug';
import { CourseSlugInvalidError } from './course.errors';

import type { Brand } from '../../../../shared/branded-id';

/** Phantom-branded raw value. Used so domain types distinguish Slug from string. */
export type CourseSlugBrand = Brand<string, 'CourseSlug'>;

export class Slug {
  readonly value: CourseSlugBrand;

  private constructor(value: string) {
    this.value = brand<string, 'CourseSlug'>(value);
  }

  /**
   * Validates and constructs a Slug. Trims leading/trailing whitespace before
   * applying the regex so superficial padding does not cause a spurious error,
   * and normalises to NFC so the two encodings of a non-ASCII title collapse
   * onto one value — `@@unique([libraryId, slug])` compares bytes, and cannot
   * otherwise see `графы` and its decomposed twin as the same slug.
   *
   * Throws CourseSlugInvalidError when the trimmed value does not match.
   */
  static from(raw: string): Slug {
    const trimmed = raw.trim().normalize('NFC');
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
