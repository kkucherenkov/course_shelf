/**
 * WHY this file exists:
 * EntitySlug is a generalised slug value object for lightweight aggregates
 * (Instructor, Studio, Tag). It owns SLUG_PATTERN / SLUG_RE, which the
 * course-specific Slug VO imports, so the invariant is defined once and reused
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
 * The slug charset, written exactly as it appears in the `CourseSlug` and
 * `EntitySlug` schemas of `packages/specs/openapi/openapi.yaml`. Exported as a
 * string (not just the compiled regex) so `entity-slug.spec.ts` can read the
 * pattern back out of the spec and fail here on drift rather than at runtime.
 *
 * Lowercase Unicode letters, digits, and the hyphen separator:
 *   - `\p{Ll}` cased scripts (Latin, Cyrillic, Greek, Armenian, Georgian…);
 *     uppercase is deliberately excluded, because Postgres unique indexes are
 *     case-sensitive and `Графы`/`графы` would otherwise be two rows.
 *   - `\p{Lo}` caseless scripts — Han, Hebrew, Arabic, Devanagari, Thai.
 *   - `\p{Lm}` modifier letters, e.g. the Japanese prolonged sound mark in
 *     `コンピューター`.
 *   - `\p{M}` interior combining marks, so Indic and Thai vowel signs survive
 *     instead of collapsing into hyphens. Not permitted first or last, where a
 *     mark has nothing to combine with.
 *
 * `\p{…}` is inert without the `u` flag — it compiles and then matches nothing.
 * The regex below carries `u`; the runtime request validator gets it from ajv,
 * whose `unicodeRegExp` option defaults to true (verified against the ajv that
 * `express-openapi-validator` actually resolves).
 */
export const SLUG_PATTERN = String.raw`^[\p{Ll}\p{Lo}\p{Lm}\p{N}](?:[\p{Ll}\p{Lo}\p{Lm}\p{N}\p{M}-]{0,98}[\p{Ll}\p{Lo}\p{Lm}\p{N}])?$`;

/** Compiled form of SLUG_PATTERN. Shared with course/slug.ts. */
export const SLUG_RE = new RegExp(SLUG_PATTERN, 'u');

/** Characters slugify keeps. Anything else becomes a hyphen. */
const SLUG_KEEP_RE = /[^\p{Ll}\p{Lo}\p{Lm}\p{N}\p{M}]+/gu;

/** Trimmed from both ends: hyphens, and marks with nothing left to combine with. */
const SLUG_EDGE_RE = /^[-\p{M}]+|[-\p{M}]+$/gu;

/**
 * A trailing high surrogate — the orphaned first half of an astral character
 * that a UTF-16 truncation cut in two.
 */
const LONE_HIGH_SURROGATE_RE = /[\uD800-\uDBFF]$/u;

/** Maximum slug length — the `maxLength` of the spec schemas. */
export const SLUG_MAX_LENGTH = 100;

export class EntitySlug {
  readonly value: EntitySlugBrand;

  private constructor(value: string) {
    this.value = brand<string, 'EntitySlug'>(value);
  }

  /**
   * Validates and constructs an EntitySlug. Trims leading/trailing whitespace
   * before applying the regex so superficial padding does not cause spurious
   * errors, and normalises to NFC so a caller that supplies a decomposed slug
   * lands on the same stored value — and therefore the same unique index entry
   * — as one that supplies the precomposed form of the same word.
   *
   * @param raw        Raw string to validate.
   * @param entityName Human-readable entity name for the error message.
   * @throws EntitySlugInvalidError when the trimmed value does not match.
   */
  static from(raw: string, entityName: string): EntitySlug {
    const trimmed = raw.trim().normalize('NFC');
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
 *   1. Lowercasing, then normalising to NFC.
 *   2. Replacing each run of characters outside the slug charset with a single hyphen.
 *   3. Trimming leading/trailing hyphens and orphaned combining marks.
 *   4. Truncating to 100 code points (re-trimming the edge afterwards).
 *
 * WHY NFC, and why after lowercasing: `й` reaches us either precomposed
 * (U+0439) or decomposed (U+0438 plus the combining breve U+0306), and macOS
 * hands out the decomposed form for filenames. The two render identically, so
 * without normalisation one folder slugs to `й…` and its twin to `и…` — two
 * rows that `@@unique([libraryId, slug])` cannot see as the same title, which
 * is the whole reason the constraint would still let duplicates through.
 * Lowercasing first and composing after also folds the awkward cases: `Й`
 * decomposed lowercases to `и` + U+0306 and only then composes to `й`.
 *
 * When given a non-empty input whose normalised form is non-empty, the result
 * is guaranteed to satisfy SLUG_RE. Throws EntitySlugInvalidError when the
 * input slugifies to an empty string (e.g. input is all symbols).
 *
 * Used by upsert handlers to derive slugs from display names, and by the scan
 * walk (via `toSlug`) to derive a course slug from its title.
 */
export function slugify(input: string): string {
  const normalised = input.toLowerCase().normalize('NFC');
  // Replace any run of characters outside the slug charset with a single hyphen
  const hyphenated = normalised.replaceAll(SLUG_KEEP_RE, '-');
  // Trim leading and trailing hyphens (and marks left with nothing to combine with)
  const trimmed = hyphenated.replaceAll(SLUG_EDGE_RE, '');
  // Truncate. `slice` counts UTF-16 units and the spec's maxLength counts code
  // points, so the cut is at worst conservative — never over the cap. What it
  // CAN do is land between the halves of an astral character (rare Han), and
  // the lone surrogate left behind is not in any \p{…} class, so SLUG_RE would
  // reject the slug outright. Drop it, then re-trim the edge: the cut can also
  // leave a combining mark with nothing in front of it.
  const truncated = trimmed
    .slice(0, SLUG_MAX_LENGTH)
    .replace(LONE_HIGH_SURROGATE_RE, '')
    .replaceAll(SLUG_EDGE_RE, '');

  if (truncated.length === 0) {
    throw new EntitySlugInvalidError('Entity', input);
  }

  return truncated;
}
