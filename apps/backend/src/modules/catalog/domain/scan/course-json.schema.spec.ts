/**
 * Unit tests for the course.json v1 parser.
 * Covers: happy path, missing schemaVersion, wrong types, unknown extra keys.
 */
import { describe, expect, it } from 'vitest';

import { CourseJsonInvalidError } from './scan.errors';
import { parseCourseJson } from './course-json.schema';

function json(obj: unknown): string {
  return JSON.stringify(obj);
}

describe('parseCourseJson', () => {
  describe('happy path', () => {
    it('parses a minimal valid document', () => {
      const result = parseCourseJson(json({ schemaVersion: 1, title: 'DDD Basics' }));

      expect(result.schemaVersion).toBe(1);
      expect(result.title).toBe('DDD Basics');
      expect(result.sections).toBeUndefined();
    });

    it('parses a full document with sections and lessons', () => {
      const doc = {
        schemaVersion: 1,
        title: 'Advanced NestJS',
        instructor: 'Alice',
        description: 'A deep dive.',
        sections: [
          {
            title: 'Introduction',
            lessons: [{ title: 'Hello World', file: '01 - Hello.mp4' }],
          },
        ],
      };

      const result = parseCourseJson(json(doc));

      expect(result.title).toBe('Advanced NestJS');
      expect(result.instructor).toBe('Alice');
      expect(result.description).toBe('A deep dive.');
      expect(result.sections).toHaveLength(1);
      expect(result.sections![0]!.lessons).toHaveLength(1);
      expect(result.sections![0]!.lessons![0]!.file).toBe('01 - Hello.mp4');
    });

    it('ignores unknown extra keys (open-world)', () => {
      const result = parseCourseJson(
        json({ schemaVersion: 1, title: 'Test', unknownKey: 42, nested: { x: true } }),
      );

      expect(result.title).toBe('Test');
      // TypeScript type does not include unknownKey — just checking no throw.
    });

    it('allows sections with no lessons array', () => {
      const result = parseCourseJson(
        json({ schemaVersion: 1, title: 'T', sections: [{ title: 'S1' }] }),
      );

      expect(result.sections![0]!.lessons).toBeUndefined();
    });
  });

  describe('missing or wrong schemaVersion', () => {
    it('throws CourseJsonInvalidError when schemaVersion is absent', () => {
      expect(() => parseCourseJson(json({ title: 'X' }))).toThrow(CourseJsonInvalidError);
    });

    it('throws when schemaVersion is 2', () => {
      expect(() => parseCourseJson(json({ schemaVersion: 2, title: 'X' }))).toThrow(
        CourseJsonInvalidError,
      );
    });

    it('throws when schemaVersion is a string', () => {
      expect(() => parseCourseJson(json({ schemaVersion: '1', title: 'X' }))).toThrow(
        CourseJsonInvalidError,
      );
    });
  });

  describe('wrong types per field', () => {
    it('throws when title is missing', () => {
      expect(() => parseCourseJson(json({ schemaVersion: 1 }))).toThrow(CourseJsonInvalidError);
    });

    it('throws when title is a number', () => {
      expect(() => parseCourseJson(json({ schemaVersion: 1, title: 42 }))).toThrow(
        CourseJsonInvalidError,
      );
    });

    it('throws when title is empty string', () => {
      expect(() => parseCourseJson(json({ schemaVersion: 1, title: '' }))).toThrow(
        CourseJsonInvalidError,
      );
    });

    it('throws when instructor is a number', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 1, title: 'T', instructor: 123 })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('throws when description is a boolean', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 1, title: 'T', description: true })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('throws when sections is not an array', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 1, title: 'T', sections: 'bad' })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('throws when a section has no title', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 1, title: 'T', sections: [{ lessons: [] }] })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('throws when a lesson has no file', () => {
      expect(() =>
        parseCourseJson(
          json({
            schemaVersion: 1,
            title: 'T',
            sections: [{ title: 'S', lessons: [{ title: 'L' }] }],
          }),
        ),
      ).toThrow(CourseJsonInvalidError);
    });
  });

  describe('JSON parse failure', () => {
    it('throws CourseJsonInvalidError on invalid JSON', () => {
      expect(() => parseCourseJson('{not valid json')).toThrow(CourseJsonInvalidError);
    });

    it('throws when root is not an object', () => {
      expect(() => parseCourseJson(json([1, 2, 3]))).toThrow(CourseJsonInvalidError);
    });
  });
});
