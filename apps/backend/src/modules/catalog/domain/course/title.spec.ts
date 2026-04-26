import { describe, expect, it } from 'vitest';

import { Title } from './title';
import { CourseTitleInvalidError } from './course.errors';

describe('Title', () => {
  describe('happy paths', () => {
    it('accepts a normal title', () => {
      const t = Title.from('Introduction to TypeScript');
      expect(t.value).toBe('Introduction to TypeScript');
    });

    it('trims surrounding whitespace', () => {
      const t = Title.from('  Trimmed Title  ');
      expect(t.value).toBe('Trimmed Title');
    });

    it('accepts exactly 200 characters', () => {
      const raw = 'a'.repeat(200);
      const t = Title.from(raw);
      expect(t.value).toHaveLength(200);
    });
  });

  describe('rejection branches', () => {
    it('rejects empty string', () => {
      expect(() => Title.from('')).toThrow(CourseTitleInvalidError);
    });

    it('rejects whitespace-only string', () => {
      expect(() => Title.from('   ')).toThrow(CourseTitleInvalidError);
    });

    it('rejects titles longer than 200 characters', () => {
      expect(() => Title.from('a'.repeat(201))).toThrow(CourseTitleInvalidError);
    });
  });

  describe('equals', () => {
    it('returns true for identical values', () => {
      expect(Title.from('Hello').equals(Title.from('Hello'))).toBe(true);
    });

    it('returns false for different values', () => {
      expect(Title.from('Hello').equals(Title.from('World'))).toBe(false);
    });
  });
});
