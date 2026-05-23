/**
 * WHY this file exists:
 * EntitySlug is a generalised slug value object for lightweight aggregates
 * (Instructor, Studio, Tag). It enforces the same URL-safe regex as the
 * course-specific Slug VO so the invariant is defined once and reused
 * rather than copy-pasted per entity.
 *
 * The entity name is passed at call site (e.g. "Instructor") so error
 * messages identify which aggregate owns the invalid slug.
 *
 * `slugify` is a companion helper that derives a valid slug from a human
 * display name. It is used by upsert handlers to generate slugs from
 * names when the caller does not supply an explicit slug.
 */
import { brand } from '../../../../shared/branded-id';
import { EntitySlugInvalidError } from './shared.errors';

import type { Brand } from '../../../../shared/branded-id';

/** Phantom-branded raw value — distinguishes an EntitySlug from a plain string at compile time. */
export type EntitySlugBrand = Brand<string, 'EntitySlug'>;

/**
 * Regex shared with course/slug.ts — lowercase alphanum + hyphen,
 * 1–100 chars, no leading/trailing hyphen.
 */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/;

export class EntitySlug {
  readonly value: EntitySlugBrand;

  private constructor(value: string) {
    this.value = brand<string, 'EntitySlug'>(value);
  }

  /**
   * Validates and constructs an EntitySlug. Trims leading/trailing whitespace
   * before applying the regex so superficial padding does not cause spurious
   * errors.
   *
   * @param raw        Raw string to validate.
   * @param entityName Human-readable entity name for the error message.
   * @throws EntitySlugInvalidError when the trimmed value does not match.
   */
  static from(raw: string, entityName: string): EntitySlug {
    const trimmed = raw.trim();
    if (!SLUG_RE.test(trimmed)) {
      throw new EntitySlugInvalidError(entityName, raw);
    }
    return new EntitySlug(trimmed);
  }

  /** Structural equality — two EntitySlugs with the same value are equal. */
  equals(other: EntitySlug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Derives a valid slug from a human display name by:
 *   1. Lowercasing the entire string.
 *   2. Replacing each run of non-alphanumeric characters with a single hyphen.
 *   3. Trimming leading/trailing hyphens.
 *   4. Truncating to 100 characters (ensuring no trailing hyphen after truncation).
 *
 * When given a non-empty input whose normalised form is non-empty, the result
 * is guaranteed to satisfy the slug regex. Throws EntitySlugInvalidError when
 * the input slugifies to an empty string (e.g. input is all symbols).
 *
 * Used by upsert handlers to derive slugs from display names.
 */
export function slugify(input: string): string {
  const lower = input.toLowerCase();
  // Replace any run of non-alphanumeric chars with a single hyphen
  const hyphenated = lower.replaceAll(/[^a-z0-9]+/g, '-');
  // Trim leading and trailing hyphens
  const trimmed = hyphenated.replaceAll(/^-+|-+$/g, '');
  // Truncate to 100 chars; then trim any trailing hyphen introduced by mid-word cut
  const truncated = trimmed.slice(0, 100).replace(/-+$/, '');

  if (truncated.length === 0) {
    throw new EntitySlugInvalidError('Entity', input);
  }

  return truncated;
}
