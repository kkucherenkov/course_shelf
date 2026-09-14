/**
 * Unit tests for EntitySlug value object and the slugify helper.
 *
 * The first block is the anti-drift gate: SLUG_PATTERN is a hand-copied mirror
 * of the OpenAPI document's `CourseSlug`/`EntitySlug` pattern, so the test reads
 * both patterns back out of the spec and compares. A comment saying the two are
 * kept in sync is not a test; this is.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { Slug } from '../course/slug';
import { EntitySlug, SLUG_MAX_LENGTH, SLUG_PATTERN, SLUG_RE, slugify } from './entity-slug';
import { EntitySlugInvalidError } from './shared.errors';

/** The `pattern` of a named schema as written in `packages/specs/openapi/openapi.yaml`. */
function patternFromSpec(schemaName: string): string {
  // Vitest's root is `apps/backend` (see vitest.config.ts).
  const specPath = path.resolve(process.cwd(), '../../packages/specs/openapi/openapi.yaml');
  const doc = readFileSync(specPath, 'utf8');
  const schema = doc.slice(doc.indexOf(`    ${schemaName}:`));
  const line = /^\s*pattern: "(.+)"$/m.exec(schema);
  if (!line?.[1]) throw new Error(`${schemaName} pattern not found in openapi.yaml`);
  // YAML double-quoted scalars halve the backslashes; undo that so the result is
  // the regex source the validator compiles.
  return line[1].replaceAll('\\\\', '\\');
}

describe('SLUG_PATTERN', () => {
  it.each(['CourseSlug', 'EntitySlug'])(
    'is character-for-character the %s pattern in openapi.yaml',
    (schemaName) => {
      expect(SLUG_PATTERN).toBe(patternFromSpec(schemaName));
    },
  );

  it(String.raw`needs the u flag — without it every \p escape matches nothing`, () => {
    // The trap this pattern is one typo away from: `\p{L}` compiles fine in a
    // non-unicode regex and then silently matches no character at all, so a
    // pattern built from it would reject every value instead of the bug it was
    // meant to fix. SLUG_RE must carry `u`.
    expect(SLUG_RE.flags).toContain('u');
    expect(new RegExp(SLUG_PATTERN).test('pragmatic-clean-architecture')).toBe(false);
    expect(SLUG_RE.test('pragmatic-clean-architecture')).toBe(true);
  });
});

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

describe('slugify — non-Latin scripts', () => {
  it('keeps a Cyrillic title instead of collapsing it', () => {
    expect(slugify('Графы и комбинаторика')).toBe('графы-и-комбинаторика');
  });

  it('gives two different Latin-free titles two different slugs', () => {
    // The assertion whose absence cost 253 lessons: every Latin-free title used
    // to strip down to '' and fall back to the single slug 'untitled', so the
    // duplicate-slug guard in the scan walk dropped all but the first course.
    const slugs = [
      'Графы и комбинаторика',
      'Алгоритмы и структуры данных',
      'Дискретная математика',
      '图论与组合数学',
      'Αλγόριθμοι',
    ].map((title) => slugify(title));

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain('untitled');
  });

  it.each([
    ['Графы и комбинаторика', 'графы-и-комбинаторика'],
    ['图论与组合数学', '图论与组合数学'],
    ['Αλγόριθμοι Γραφημάτων', 'αλγόριθμοι-γραφημάτων'],
    ['コンピューター サイエンス', 'コンピューター-サイエンス'],
    ['Café Racer', 'café-racer'],
    ['Café', 'café'],
  ])('slugifies %s', (title, expected) => {
    expect(slugify(title)).toBe(expected);
  });

  it('produces a value both slug value objects accept', () => {
    const slug = slugify('Графы и комбинаторика');
    expect(() => EntitySlug.from(slug, 'Instructor')).not.toThrow();
    expect(() => Slug.from(slug)).not.toThrow();
  });

  it('never leaves half an astral character behind when it truncates', () => {
    // Astral characters are surrogate pairs, so a UTF-16 cut at the cap can
    // land between the halves. A lone surrogate is in no \p{…} class, so the
    // slug regex would reject the whole slug.
    const slug = slugify('𠮷'.repeat(200));
    expect(SLUG_RE.test(slug)).toBe(true);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect([...slug].length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug).not.toMatch(/[\uD800-\uDBFF]$/u);
  });

  it('keeps combining marks that carry meaning inside a word', () => {
    // Devanagari vowel signs are \p{Mc}/\p{Mn}, not letters — dropping them
    // would merge distinct words onto one slug.
    expect(slugify('कंप्यूटर विज्ञान')).toBe('कंप्यूटर-विज्ञान');
  });

  it('still falls back to throwing when nothing sluggable is left', () => {
    expect(() => slugify('♥♥♥ !!! ???')).toThrow(EntitySlugInvalidError);
  });
});

describe('slugify — NFC normalisation', () => {
  // 'й' precomposed (U+0439) vs decomposed (U+0438 + combining breve U+0306).
  // macOS hands out the decomposed form for filenames; the two render
  // identically and must not become two rows under @@unique([libraryId, slug]).
  //
  // The two constants below look identical on screen and ARE different strings.
  // The first `it` asserts exactly that, so an editor or a formatter that
  // normalises this file fails the suite instead of quietly deleting the
  // difference the rest of the block exists to test.
  const PRECOMPOSED = 'Йога';
  const DECOMPOSED = 'Йога';

  it('the two encodings really are different strings', () => {
    expect(PRECOMPOSED).not.toBe(DECOMPOSED);
    expect(PRECOMPOSED.normalize('NFD')).toBe(DECOMPOSED.normalize('NFD'));
  });

  it('slugifies both encodings of one visual title to one slug', () => {
    expect(slugify(DECOMPOSED)).toBe(slugify(PRECOMPOSED));
    expect(slugify(PRECOMPOSED)).toBe('йога');
  });

  it('normalises an explicitly supplied slug on construction', () => {
    const decomposedSlug = 'йога';
    expect(EntitySlug.from(decomposedSlug, 'Tag').value).toBe('йога');
    expect(Slug.from(decomposedSlug).value).toBe('йога');
  });

  it('folds accented Latin the same way', () => {
    expect(slugify('Café')).toBe(slugify('Café'));
  });
});

describe('EntitySlug — Unicode charset', () => {
  it.each(['графы-и-комбинаторика', '图论与组合数学', 'αλγόριθμοι', 'café', 'コンピューター'])(
    'accepts %s',
    (value) => {
      expect(EntitySlug.from(value, 'Tag').value).toBe(value);
    },
  );

  it.each(['Графы', 'Café', '-графы', 'графы-', 'графы_и', 'графы и'])('rejects %s', (value) => {
    expect(() => EntitySlug.from(value, 'Tag')).toThrow(EntitySlugInvalidError);
  });

  it('rejects 101 Cyrillic characters', () => {
    expect(() => EntitySlug.from('а'.repeat(101), 'Tag')).toThrow(EntitySlugInvalidError);
  });
});
