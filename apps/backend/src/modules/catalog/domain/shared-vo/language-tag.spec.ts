/**
 * Unit tests for the LanguageTag value object.
 */
import { describe, expect, it } from 'vitest';

import { LanguageTag } from './language-tag';
import { LanguageTagInvalidError } from './shared.errors';

describe('LanguageTag', () => {
  describe('happy paths', () => {
    it('accepts a simple 2-letter language code', () => {
      const t = LanguageTag.from('en');
      expect(t.value).toBe('en');
    });

    it('accepts a 3-letter language code', () => {
      const t = LanguageTag.from('zho');
      expect(t.value).toBe('zho');
    });

    it('accepts language + region and uppercases region', () => {
      const t = LanguageTag.from('en-us');
      expect(t.value).toBe('en-US');
    });

    it('accepts already-correct casing unchanged', () => {
      const t = LanguageTag.from('en-US');
      expect(t.value).toBe('en-US');
    });

    it('normalises primary subtag to lowercase', () => {
      const t = LanguageTag.from('EN-US');
      expect(t.value).toBe('en-US');
    });

    it('title-cases 4-char script subtag', () => {
      const t = LanguageTag.from('zh-hant');
      expect(t.value).toBe('zh-Hant');
    });

    it('handles language + script + region', () => {
      const t = LanguageTag.from('sr-latn-rs');
      expect(t.value).toBe('sr-Latn-RS');
    });

    it('trims surrounding whitespace', () => {
      const t = LanguageTag.from('  en-US  ');
      expect(t.value).toBe('en-US');
    });
  });

  describe('rejection branches', () => {
    it('rejects empty string', () => {
      expect(() => LanguageTag.from('')).toThrow(LanguageTagInvalidError);
    });

    it('rejects whitespace only', () => {
      expect(() => LanguageTag.from('   ')).toThrow(LanguageTagInvalidError);
    });

    it('rejects a single letter primary tag', () => {
      expect(() => LanguageTag.from('e')).toThrow(LanguageTagInvalidError);
    });

    it('rejects a primary tag longer than 3 letters', () => {
      expect(() => LanguageTag.from('engl')).toThrow(LanguageTagInvalidError);
    });

    it('rejects a subtag longer than 8 characters', () => {
      expect(() => LanguageTag.from('en-toolongsubtag')).toThrow(LanguageTagInvalidError);
    });

    it('rejects a subtag shorter than 2 characters', () => {
      expect(() => LanguageTag.from('en-U')).toThrow(LanguageTagInvalidError);
    });

    it('rejects tags with underscores (POSIX locale style)', () => {
      expect(() => LanguageTag.from('en_US')).toThrow(LanguageTagInvalidError);
    });

    it('rejects numeric-only primary subtag', () => {
      expect(() => LanguageTag.from('123')).toThrow(LanguageTagInvalidError);
    });
  });

  describe('equals', () => {
    it('returns true for two equivalent tags', () => {
      expect(LanguageTag.from('en-US').equals(LanguageTag.from('EN-us'))).toBe(true);
    });

    it('returns false for different tags', () => {
      expect(LanguageTag.from('en').equals(LanguageTag.from('fr'))).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the normalised tag string', () => {
      expect(LanguageTag.from('zh-hant').toString()).toBe('zh-Hant');
    });
  });
});
