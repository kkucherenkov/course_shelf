/**
 * Unit tests for the DisplayName value object.
 */
import { describe, expect, it } from 'vitest';

import { DisplayName } from './display-name';
import { DisplayNameInvalidError } from './shared.errors';

describe('DisplayName', () => {
  describe('happy paths', () => {
    it('accepts a normal display name', () => {
      const d = DisplayName.from('John Doe', 'Instructor');
      expect(d.value).toBe('John Doe');
    });

    it('trims surrounding whitespace', () => {
      const d = DisplayName.from('  Jane Smith  ', 'Instructor');
      expect(d.value).toBe('Jane Smith');
    });

    it('accepts exactly 200 characters', () => {
      const raw = 'a'.repeat(200);
      const d = DisplayName.from(raw, 'Instructor');
      expect(d.value).toHaveLength(200);
    });

    it('accepts a single character', () => {
      const d = DisplayName.from('A', 'Studio');
      expect(d.value).toBe('A');
    });

    it('accepts unicode and special characters', () => {
      const d = DisplayName.from('François & Co.', 'Studio');
      expect(d.value).toBe('François & Co.');
    });
  });

  describe('rejection branches', () => {
    it('rejects empty string', () => {
      expect(() => DisplayName.from('', 'Instructor')).toThrow(DisplayNameInvalidError);
    });

    it('rejects whitespace-only string', () => {
      expect(() => DisplayName.from('   ', 'Studio')).toThrow(DisplayNameInvalidError);
    });

    it('rejects string longer than 200 characters', () => {
      expect(() => DisplayName.from('a'.repeat(201), 'Tag')).toThrow(DisplayNameInvalidError);
    });
  });

  describe('equals', () => {
    it('returns true for identical values', () => {
      expect(
        DisplayName.from('John Doe', 'Instructor').equals(
          DisplayName.from('John Doe', 'Instructor'),
        ),
      ).toBe(true);
    });

    it('returns false for different values', () => {
      expect(
        DisplayName.from('John Doe', 'Instructor').equals(
          DisplayName.from('Jane Doe', 'Instructor'),
        ),
      ).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the trimmed display name', () => {
      expect(DisplayName.from('  My Studio  ', 'Studio').toString()).toBe('My Studio');
    });
  });
});
