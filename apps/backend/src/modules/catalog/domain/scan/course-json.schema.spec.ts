/**
 * Unit tests for the course.json v1 + v2 parser and normaliseCourseJson.
 * All original v1 cases are preserved; v2 cases are appended below.
 */
import { describe, expect, it } from 'vitest';

import { CourseJsonInvalidError } from './scan.errors';
import { normaliseCourseJson, parseCourseJson } from './course-json.schema';

function json(obj: unknown): string {
  return JSON.stringify(obj);
}

describe('parseCourseJson', () => {
  // ---------------------------------------------------------------------------
  // V1 — original suite (must not regress)
  // ---------------------------------------------------------------------------

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
      if (result.schemaVersion === 1) {
        expect(result.instructor).toBe('Alice');
      }
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

    it('throws when schemaVersion is 3', () => {
      expect(() => parseCourseJson(json({ schemaVersion: 3, title: 'X' }))).toThrow(
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

  // ---------------------------------------------------------------------------
  // V2 — new cases
  // ---------------------------------------------------------------------------

  describe('v2 happy path', () => {
    it('parses a minimal v2 document', () => {
      const result = parseCourseJson(json({ schemaVersion: 2, title: 'My Course' }));
      expect(result.schemaVersion).toBe(2);
      expect(result.title).toBe('My Course');
    });

    it('parses a full v2 document', () => {
      const doc = {
        schemaVersion: 2,
        title: 'Full Course',
        description: 'All fields.',
        instructorNames: ['Alice', 'Bob'],
        studioName: 'Acme Studio',
        tags: ['typescript', 'backend'],
        level: 'intermediate',
        language: 'en-US',
        releaseDate: '2026-01-15',
        posterUrl: 'https://example.com/poster.jpg',
        externalIds: [{ source: 'imdb', externalId: 'tt1234', url: 'https://imdb.com/tt1234' }],
        sections: [{ title: 'Intro', lessons: [{ title: 'L1', file: '01.mp4' }] }],
      };

      const result = parseCourseJson(json(doc));

      expect(result.schemaVersion).toBe(2);
      if (result.schemaVersion === 2) {
        expect(result.instructorNames).toEqual(['Alice', 'Bob']);
        expect(result.studioName).toBe('Acme Studio');
        expect(result.tags).toEqual(['typescript', 'backend']);
        expect(result.level).toBe('intermediate');
        expect(result.language).toBe('en-US');
        expect(result.releaseDate).toBe('2026-01-15');
        expect(result.posterUrl).toBe('https://example.com/poster.jpg');
        expect(result.externalIds).toHaveLength(1);
        expect(result.externalIds![0]!.source).toBe('imdb');
      }
    });

    it('ignores v2-only fields on a v1 document (open-world)', () => {
      // v1 file with extra v2 fields — parser does not promote them
      const result = parseCourseJson(
        json({
          schemaVersion: 1,
          title: 'Test',
          tags: ['typescript'],
          level: 'beginner',
          instructorNames: ['Alice'],
        }),
      );
      // Must still be v1
      expect(result.schemaVersion).toBe(1);
      // v1 type does not have tags/level — we only check the returned shape
    });
  });

  describe('v2 field validation', () => {
    it('rejects schemaVersion: 3', () => {
      expect(() => parseCourseJson(json({ schemaVersion: 3, title: 'X' }))).toThrow(
        CourseJsonInvalidError,
      );
    });

    it('rejects invalid releaseDate (month 13)', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 2, title: 'T', releaseDate: '2026-13-01' })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('rejects invalid releaseDate (datetime format)', () => {
      expect(() =>
        parseCourseJson(
          json({ schemaVersion: 2, title: 'T', releaseDate: '2026-01-15T00:00:00Z' }),
        ),
      ).toThrow(CourseJsonInvalidError);
    });

    it('rejects invalid level', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 2, title: 'T', level: 'expert+' })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('rejects non-array instructorNames', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 2, title: 'T', instructorNames: 'Alice' })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('rejects instructorNames with a non-string element', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 2, title: 'T', instructorNames: ['Alice', 42] })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('rejects non-string studioName', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 2, title: 'T', studioName: 123 })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('does NOT reject a non-BCP47 language string at parse level', () => {
      // Language format validation is on the aggregate boundary, not the parser
      expect(() =>
        parseCourseJson(json({ schemaVersion: 2, title: 'T', language: 'not-bcp47!!!' })),
      ).not.toThrow();
    });

    it('rejects non-string language', () => {
      expect(() => parseCourseJson(json({ schemaVersion: 2, title: 'T', language: 123 }))).toThrow(
        CourseJsonInvalidError,
      );
    });

    it('rejects malformed posterUrl', () => {
      expect(() =>
        parseCourseJson(json({ schemaVersion: 2, title: 'T', posterUrl: 'not-a-url' })),
      ).toThrow(CourseJsonInvalidError);
    });

    it('rejects externalIds with missing source', () => {
      expect(() =>
        parseCourseJson(
          json({ schemaVersion: 2, title: 'T', externalIds: [{ externalId: 'abc' }] }),
        ),
      ).toThrow(CourseJsonInvalidError);
    });

    it('rejects externalIds with empty externalId', () => {
      expect(() =>
        parseCourseJson(
          json({ schemaVersion: 2, title: 'T', externalIds: [{ source: 'imdb', externalId: '' }] }),
        ),
      ).toThrow(CourseJsonInvalidError);
    });
  });

  // ---------------------------------------------------------------------------
  // normaliseCourseJson
  // ---------------------------------------------------------------------------

  describe('normaliseCourseJson', () => {
    it('normalises v1 to v2 shape — schemaVersion becomes 2', () => {
      const v1 = parseCourseJson(json({ schemaVersion: 1, title: 'My Course' }));
      const normalised = normaliseCourseJson(v1);
      expect(normalised.schemaVersion).toBe(2);
    });

    it('normalises v1 instructor to instructorNames[0]', () => {
      const v1 = parseCourseJson(
        json({ schemaVersion: 1, title: 'My Course', instructor: 'Alice' }),
      );
      const normalised = normaliseCourseJson(v1);
      expect(normalised.instructorNames).toEqual(['Alice']);
    });

    it('preserves title and description in v1 → v2 round-trip', () => {
      const v1 = parseCourseJson(
        json({ schemaVersion: 1, title: 'My Course', description: 'Desc' }),
      );
      const normalised = normaliseCourseJson(v1);
      expect(normalised.title).toBe('My Course');
      expect(normalised.description).toBe('Desc');
    });

    it('preserves sections in v1 → v2 round-trip', () => {
      const v1 = parseCourseJson(
        json({
          schemaVersion: 1,
          title: 'T',
          sections: [{ title: 'S', lessons: [{ title: 'L', file: '01.mp4' }] }],
        }),
      );
      const normalised = normaliseCourseJson(v1);
      expect(normalised.sections).toHaveLength(1);
      expect(normalised.sections![0]!.title).toBe('S');
    });

    it('v1 with no instructor → normalised has no instructorNames', () => {
      const v1 = parseCourseJson(json({ schemaVersion: 1, title: 'T' }));
      const normalised = normaliseCourseJson(v1);
      expect(normalised.instructorNames).toBeUndefined();
    });

    it('v2 passes through unchanged', () => {
      const v2 = parseCourseJson(
        json({ schemaVersion: 2, title: 'Course', instructorNames: ['Bob'], level: 'advanced' }),
      );
      const normalised = normaliseCourseJson(v2);
      expect(normalised.schemaVersion).toBe(2);
      expect(normalised.instructorNames).toEqual(['Bob']);
      expect(normalised.level).toBe('advanced');
    });

    it('v2 with both instructor and instructorNames → instructorNames wins, instructor dropped', () => {
      // A v2 file authored by a tool that accidentally wrote bare instructor
      // alongside instructorNames. instructorNames must win.
      const raw = JSON.stringify({
        schemaVersion: 2,
        title: 'T',
        instructor: 'OldInstructor',
        instructorNames: ['Alice', 'Bob'],
      });
      const parsed = parseCourseJson(raw);
      const normalised = normaliseCourseJson(parsed);
      expect(normalised.instructorNames).toEqual(['Alice', 'Bob']);
      // bare instructor key must be absent from normalised output
      expect(Object.prototype.hasOwnProperty.call(normalised, 'instructor')).toBe(false);
    });

    it('v2 with bare instructor and no instructorNames → instructor promoted', () => {
      // v2 file with a bare `instructor` field but no `instructorNames`
      const raw = JSON.stringify({
        schemaVersion: 2,
        title: 'T',
        instructor: 'Solo',
      });
      const parsed = parseCourseJson(raw);
      const normalised = normaliseCourseJson(parsed);
      expect(normalised.instructorNames).toEqual(['Solo']);
      expect(Object.prototype.hasOwnProperty.call(normalised, 'instructor')).toBe(false);
    });

    it('v1 with v2-only fields (open-world) — extra fields silently dropped by parser', () => {
      // tags in a v1 doc — the parser ignores them (open-world).
      // After normalisation the result has no tags.
      const result = parseCourseJson(json({ schemaVersion: 1, title: 'T', tags: ['ts', 'node'] }));
      expect(result.schemaVersion).toBe(1);
      const normalised = normaliseCourseJson(result);
      // tags was not carried through the v1 parser, so absent in normalised form
      expect(normalised.tags).toBeUndefined();
    });
  });
});
