import { describe, expect, it } from 'vitest';

import { Position } from './position';
import { PositionInvalidError } from './course.errors';

describe('Position', () => {
  describe('happy paths', () => {
    it('accepts 1', () => {
      const p = Position.from(1);
      expect(p.value).toBe(1);
    });

    it('accepts large positive integers', () => {
      const p = Position.from(100);
      expect(p.value).toBe(100);
    });
  });

  describe('rejection branches', () => {
    it('rejects 0', () => {
      expect(() => Position.from(0)).toThrow(PositionInvalidError);
    });

    it('rejects negative values', () => {
      expect(() => Position.from(-1)).toThrow(PositionInvalidError);
    });

    it('rejects fractional values', () => {
      expect(() => Position.from(1.5)).toThrow(PositionInvalidError);
    });
  });

  describe('equals', () => {
    it('returns true for identical values', () => {
      expect(Position.from(3).equals(Position.from(3))).toBe(true);
    });

    it('returns false for different values', () => {
      expect(Position.from(1).equals(Position.from(2))).toBe(false);
    });
  });
});
