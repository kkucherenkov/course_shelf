/**
 * WHY this file exists:
 * LanguageTag validates and normalises BCP-47 language tags used by the Course
 * aggregate's `language` field. Validation here ensures that only structurally
 * correct tags enter the domain; deeper locale validation (is "en-XX" a real
 * region?) is out of scope for a self-hosted catalogue.
 *
 * Normalisation follows BCP-47 conventions:
 *   - Primary language subtag → lowercased  (e.g. "EN"   → "en")
 *   - Region subtag           → uppercased  (e.g. "en-us" → "en-US")
 *   - Script subtag (4-char)  → title-cased (e.g. "zh-hant" → "zh-Hant")
 * Other subtags are left as-is.
 */
import { LanguageTagInvalidError } from './shared.errors';

/**
 * Matches the BCP-47 subset accepted by this system:
 *   - 2–3 letter primary language subtag (ISO 639)
 *   - Optionally followed by one or more hyphen-separated subtags of 2–8
 *     alphanumeric characters (region, script, variant, extension, etc.)
 *
 * Examples: "en", "en-US", "zh-Hant", "sr-Latn-RS"
 */
const LANGUAGE_TAG_RE = /^[a-zA-Z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export class LanguageTag {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Validates and constructs a LanguageTag. Trims whitespace before validation.
   * Normalises subtag casing per BCP-47: primary subtag lowercased, 2-char
   * alpha subtag (region) uppercased, 4-char alpha subtag (script) title-cased.
   *
   * @throws LanguageTagInvalidError when the trimmed value does not match.
   */
  static from(raw: string): LanguageTag {
    const trimmed = raw.trim();
    if (!LANGUAGE_TAG_RE.test(trimmed)) {
      throw new LanguageTagInvalidError(raw);
    }

    const normalised = trimmed
      .split('-')
      .map((subtag, index) => {
        if (index === 0) {
          // Primary language subtag: always lowercase
          return subtag.toLowerCase();
        }
        // Region subtag: exactly 2 alpha chars → uppercase
        if (/^[a-zA-Z]{2}$/.test(subtag)) {
          return subtag.toUpperCase();
        }
        // Script subtag: exactly 4 alpha chars → title case
        if (/^[a-zA-Z]{4}$/.test(subtag)) {
          return subtag.charAt(0).toUpperCase() + subtag.slice(1).toLowerCase();
        }
        // Numeric subtags, variant, extension, etc. → preserve as-is
        return subtag;
      })
      .join('-');

    return new LanguageTag(normalised);
  }

  /** Structural equality — two LanguageTags with the same normalised value are equal. */
  equals(other: LanguageTag): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
