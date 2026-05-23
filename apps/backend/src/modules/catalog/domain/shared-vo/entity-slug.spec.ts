/**
 * Unit tests for EntitySlug value object and the slugify helper.
 */
import { describe, expect, it } from 'vitest';

import { EntitySlug, slugify } from './entity-slug';
import { EntitySlugInvalidError } from './shared.errors';

describe('EntitySlug', () => {
  describe('happy paths', () => {
    it('accepts a simple lowercase slug', () => {
      const s = EntitySlug.from('my-instructor', 'Instructor');
      expect(s.value).toBe('my-instructor');
    });

    it('accepts a single character slug', () => {
      const s = EntitySlug.from('a', 'Instructor');
      expect(s.value).toBe('a');
    });

    it('accepts digits', () => {
      const s = EntitySlug.from('studio-101', 'Studio');
      expect(s.value).toBe('studio-101');
    });

    it('accepts exactly 100 characters', () => {
      const raw = 'a' + 'b'.repeat(98) + 'c';
      expect(raw).toHaveLength(100);
      const s = EntitySlug.from(raw, 'Tag');
      expect(s.value).toBe(raw);
    });

    it('trims surrounding whitespace before validating', () => {
      const s = EntitySlug.from('  my-instructor  ', 'Instructor');
      expect(s.value).toBe('my-instructor');
    });
  });

  describe('rejection branches', () => {
    it('rejects empty string', () => {
      expect(() => EntitySlug.from('', 'Instructor')).toThrow(EntitySlugInvalidError);
    });

    it('rejects slug starting with a hyphen', () => {
      expect(() => EntitySlug.from('-bad-slug', 'Studio')).toThrow(EntitySlugInvalidError);
    });

    it('rejects slug ending with a hyphen', () => {
      expect(() => EntitySlug.from('bad-slug-', 'Tag')).toThrow(EntitySlugInvalidError);
    });

    it('rejects uppercase letters', () => {
      expect(() => EntitySlug.from('My-Instructor', 'Instructor')).toThrow(EntitySlugInvalidError);
    });

    it('rejects slug longer than 100 characters', () => {
      const raw = 'a'.repeat(101);
      expect(() => EntitySlug.from(raw, 'Instructor')).toThrow(EntitySlugInvalidError);
    });

    it('rejects underscores', () => {
      expect(() => EntitySlug.from('instructor_name', 'Instructor')).toThrow(
        EntitySlugInvalidError,
      );
    });

    it('rejects whitespace-only after trimming', () => {
      expect(() => EntitySlug.from('   ', 'Instructor')).toThrow(EntitySlugInvalidError);
    });
  });

  describe('equals', () => {
    it('returns true for identical values', () => {
      expect(EntitySlug.from('my-tag', 'Tag').equals(EntitySlug.from('my-tag', 'Tag'))).toBe(true);
    });

    it('returns false for different values', () => {
      expect(EntitySlug.from('tag-a', 'Tag').equals(EntitySlug.from('tag-b', 'Tag'))).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the raw slug string', () => {
      expect(EntitySlug.from('my-studio', 'Studio').toString()).toBe('my-studio');
    });
  });
});

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('John Doe')).toBe('john-doe');
  });

  it('collapses multiple consecutive non-alphanum into one hyphen', () => {
    expect(slugify('Hello  --  World')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('---hello---')).toBe('hello');
  });

  it('truncates to 100 characters', () => {
    const long = 'a'.repeat(200);
    expect(slugify(long)).toHaveLength(100);
  });

  it('removes trailing hyphen after truncation', () => {
    // 99 'a' chars + hyphen + 'b' → after truncate at 100 → '...a-' → strip trailing hyphen
    const input = 'a'.repeat(99) + ' b';
    const result = slugify(input);
    expect(result).not.toMatch(/-$/);
  });

  it('produces a result that satisfies EntitySlug regex', () => {
    const result = slugify('My Great Studio & Co.');
    expect(() => EntitySlug.from(result, 'Studio')).not.toThrow();
  });

  it('throws EntitySlugInvalidError for all-symbol input', () => {
    expect(() => slugify('!!!???')).toThrow(EntitySlugInvalidError);
  });

  it('throws for empty string', () => {
    expect(() => slugify('')).toThrow(EntitySlugInvalidError);
  });

  it('handles mixed case with numbers', () => {
    expect(slugify('Course 101: Advanced NestJS')).toBe('course-101-advanced-nestjs');
  });
});
