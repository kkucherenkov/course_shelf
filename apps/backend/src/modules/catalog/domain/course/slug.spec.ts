import { describe, expect, it } from 'vitest';

import { Slug } from './slug';
import { CourseSlugInvalidError } from './course.errors';

describe('Slug', () => {
  describe('happy paths', () => {
    it('accepts a simple lowercase slug', () => {
      const s = Slug.from('my-course');
      expect(s.value).toBe('my-course');
    });

    it('accepts a single character slug', () => {
      const s = Slug.from('a');
      expect(s.value).toBe('a');
    });

    it('accepts digits', () => {
      const s = Slug.from('course-101');
      expect(s.value).toBe('course-101');
    });

    it('accepts exactly 100 characters', () => {
      const raw = 'a' + 'b'.repeat(98) + 'c';
      expect(raw).toHaveLength(100);
      const s = Slug.from(raw);
      expect(s.value).toBe(raw);
    });

    it('trims surrounding whitespace before validating', () => {
      const s = Slug.from('  my-course  ');
      expect(s.value).toBe('my-course');
    });
  });

  describe('rejection branches', () => {
    it('rejects empty string', () => {
      expect(() => Slug.from('')).toThrow(CourseSlugInvalidError);
    });

    it('rejects slug starting with a hyphen', () => {
      expect(() => Slug.from('-bad-slug')).toThrow(CourseSlugInvalidError);
    });

    it('rejects slug ending with a hyphen', () => {
      expect(() => Slug.from('bad-slug-')).toThrow(CourseSlugInvalidError);
    });

    it('rejects uppercase letters', () => {
      expect(() => Slug.from('My-Course')).toThrow(CourseSlugInvalidError);
    });

    it('rejects slug longer than 100 characters', () => {
      const raw = 'a'.repeat(101);
      expect(() => Slug.from(raw)).toThrow(CourseSlugInvalidError);
    });

    it('rejects special characters', () => {
      expect(() => Slug.from('course_name')).toThrow(CourseSlugInvalidError);
    });
  });

  describe('equals', () => {
    it('returns true for identical values', () => {
      expect(Slug.from('my-course').equals(Slug.from('my-course'))).toBe(true);
    });

    it('returns false for different values', () => {
      expect(Slug.from('my-course').equals(Slug.from('other-course'))).toBe(false);
    });
  });
});
