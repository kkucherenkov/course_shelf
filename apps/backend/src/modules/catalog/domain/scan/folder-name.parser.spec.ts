/**
 * Unit tests for the folder-name and lesson-file-name parsers.
 * Covers: NN-hyphen prefix, NN-dot prefix, bare title, extension stripping,
 * unsupported extensions.
 */
import { describe, expect, it } from 'vitest';

import { parseFolderName, parseLessonFileName } from './folder-name.parser';

describe('parseFolderName', () => {
  it('parses "01 - Title" form', () => {
    const result = parseFolderName('01 - Introduction to DDD');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Introduction to DDD');
  });

  it('parses "01. Title" form', () => {
    const result = parseFolderName('02. Aggregates and Entities');
    expect(result.ordinal).toBe(2);
    expect(result.label).toBe('Aggregates and Entities');
  });

  it('handles multi-digit ordinals', () => {
    const result = parseFolderName('12 - Chapter Twelve');
    expect(result.ordinal).toBe(12);
    expect(result.label).toBe('Chapter Twelve');
  });

  it('returns bare title with no ordinal when no prefix', () => {
    const result = parseFolderName('Bonus Material');
    expect(result.ordinal).toBeUndefined();
    expect(result.label).toBe('Bonus Material');
  });

  it('trims surrounding whitespace', () => {
    const result = parseFolderName('  03 - Trimmed  ');
    expect(result.ordinal).toBe(3);
    expect(result.label).toBe('Trimmed');
  });

  it('parses Russian "Модуль NN - Title" word-prefixed form', () => {
    const result = parseFolderName('Модуль 2 - Настройки окружения');
    expect(result.ordinal).toBe(2);
    expect(result.label).toBe('Настройки окружения');
  });

  it('parses Russian "Глава NN. Title" word-prefixed form', () => {
    const result = parseFolderName('Глава 2. Продвинутые техники');
    expect(result.ordinal).toBe(2);
    expect(result.label).toBe('Продвинутые техники');
  });

  it('parses English "Module N - Title" word-prefixed form', () => {
    const result = parseFolderName('Module 1 - Setup');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Setup');
  });

  it('parses multi-word prefix "Часть 1 - Введение"', () => {
    const result = parseFolderName('Часть 1 - Введение');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Введение');
  });

  it('numeric prefix wins over the word-prefix branch', () => {
    // Whatever leading text is here, "01 -" wins because tier 1 fires first.
    const result = parseFolderName('01 - Module 7 Real');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Module 7 Real');
  });

  // -------------------------------------------------------------------------
  // Extended Tier-1 separators (Russian / Skillbox / Stepik conventions):
  // space-only, underscore, and bare numeric.
  // -------------------------------------------------------------------------

  it('parses "01 Title" (space-only separator)', () => {
    const result = parseFolderName('01 Введение');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Введение');
  });

  it('parses "1 Title" (single digit, space separator)', () => {
    const result = parseFolderName('3 Обработка Ошибок');
    expect(result.ordinal).toBe(3);
    expect(result.label).toBe('Обработка Ошибок');
  });

  it('parses "01_Title" (underscore separator)', () => {
    const result = parseFolderName('01_Ready, Set, Code');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Ready, Set, Code');
  });

  it('parses bare numeric "07" — keeps the digits as the label fallback', () => {
    const result = parseFolderName('07');
    expect(result.ordinal).toBe(7);
    expect(result.label).toBe('07');
  });

  it('parses bare numeric "1" — keeps the single digit as the label', () => {
    const result = parseFolderName('1');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('1');
  });

  it('siblings "1 Урок" / "2 Урок" collapse to the same generic label (acknowledged trade-off)', () => {
    // Both folders extract the same descriptive word as the label. Downstream
    // (RunScanHandler) deduplicates these into a single section — the cost of
    // making space-only separators work for the common Russian convention
    // `01 Введение` is that two folders sharing a single descriptive word lose
    // their distinction. This test pins the parser behaviour so we notice
    // accidental drift in handler logic that depends on it.
    const a = parseFolderName('1 Урок');
    const b = parseFolderName('2 Урок');
    expect(a.ordinal).toBe(1);
    expect(b.ordinal).toBe(2);
    expect(a.label).toBe(b.label);
    expect(a.label).toBe('Урок');
  });

  it('"Часть 1" (word-prefixed, no rest) keeps the original as label fallback', () => {
    const result = parseFolderName('Часть 1');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Часть 1');
  });

  it('"Module 1 Setup" (word-prefixed, space-only separator after ordinal)', () => {
    const result = parseFolderName('Module 1 Setup');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Setup');
  });

  it('plain numeric-looking input with trailing letters does not match ("01a")', () => {
    // `01a` is neither a valid prefix nor a bare ordinal — the trailing `a`
    // is not a recognised separator. Falls through to bare-title handling.
    const result = parseFolderName('01a');
    expect(result.ordinal).toBeUndefined();
    expect(result.label).toBe('01a');
  });

  // -------------------------------------------------------------------------
  // Marker-introduced ordinal (#499) — same tier as parseLessonFileName's.
  // -------------------------------------------------------------------------

  it('parses a "#"-marked ordinal mid-title (folder form)', () => {
    const result = parseFolderName('Лекция #9. Этология');
    expect(result.ordinal).toBe(9);
    expect(result.label).toBe('Лекция #9. Этология');
  });
});

describe('parseLessonFileName', () => {
  it('parses "01 - Title.mp4"', () => {
    const result = parseLessonFileName('01 - Introduction.mp4');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Introduction');
    expect(result.extension).toBe('.mp4');
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('parses "02. Title.mkv"', () => {
    const result = parseLessonFileName('02. Deep Dive.mkv');
    expect(result.ordinal).toBe(2);
    expect(result.label).toBe('Deep Dive');
    expect(result.extension).toBe('.mkv');
  });

  it('parses bare "Title.mp4" with no ordinal', () => {
    const result = parseLessonFileName('Bonus Episode.mp4');
    expect(result.ordinal).toBeUndefined();
    expect(result.label).toBe('Bonus Episode');
    expect(result.extension).toBe('.mp4');
  });

  it('accepts .m4v extension', () => {
    const result = parseLessonFileName('01 - Lesson.m4v');
    expect(result.extension).toBe('.m4v');
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('accepts .webm extension', () => {
    const result = parseLessonFileName('03 - Webinar.webm');
    expect(result.extension).toBe('.webm');
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('marks .txt as unsupported', () => {
    const result = parseLessonFileName('notes.txt');
    expect(result.extension).toBe('.txt');
    expect(result.unsupportedExtension).toBe(true);
  });

  it('marks .pdf as unsupported', () => {
    const result = parseLessonFileName('slides.pdf');
    expect(result.unsupportedExtension).toBe(true);
  });

  it('marks file with no extension as unsupported', () => {
    const result = parseLessonFileName('README');
    expect(result.unsupportedExtension).toBe(true);
    expect(result.label).toBe('README');
  });

  it('extension comparison is case-insensitive', () => {
    const result = parseLessonFileName('01 - Intro.MP4');
    expect(result.extension).toBe('.mp4');
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('parses composite "N.M Title" lesson form (Neovim-style)', () => {
    const result = parseLessonFileName('2.5 Установка на Windows.mp4');
    expect(result.sectionOrdinal).toBe(2);
    expect(result.ordinal).toBe(5);
    expect(result.label).toBe('Установка на Windows');
    expect(result.extension).toBe('.mp4');
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('parses composite "N.M" without inline title — falls back to bare label', () => {
    const result = parseLessonFileName('2.6.mp4');
    expect(result.sectionOrdinal).toBe(2);
    expect(result.ordinal).toBe(6);
    expect(result.label).toBe('2.6');
    expect(result.extension).toBe('.mp4');
  });

  it('composite pattern wins over the simple "NN. Title" prefix', () => {
    // "2.5 Установка..." would otherwise be misread as ordinal=2,
    // label="5 Установка...". Tier 3 fires first.
    const result = parseLessonFileName('2.5 Установка на Windows.mp4');
    expect(result.label).not.toMatch(/^5\s/);
  });

  it('composite with unsupported extension still records sectionOrdinal/ordinal', () => {
    const result = parseLessonFileName('1.3 Notes.txt');
    expect(result.sectionOrdinal).toBe(1);
    expect(result.ordinal).toBe(3);
    expect(result.label).toBe('Notes');
    expect(result.unsupportedExtension).toBe(true);
  });

  it('accepts .wmv as a supported video extension', () => {
    const result = parseLessonFileName('1 Лекция.wmv');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Лекция');
    expect(result.extension).toBe('.wmv');
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('parses "01 Title.mp4" (space-only separator)', () => {
    const result = parseLessonFileName('01 Введение.mp4');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Введение');
    expect(result.extension).toBe('.mp4');
  });

  it('parses "01_Title.mp4" (underscore separator)', () => {
    const result = parseLessonFileName('01_Intro.mp4');
    expect(result.ordinal).toBe(1);
    expect(result.label).toBe('Intro');
  });

  it('parses bare numeric "07.mp4" — label falls back to the digits', () => {
    const result = parseLessonFileName('07.mp4');
    expect(result.ordinal).toBe(7);
    expect(result.label).toBe('07');
    expect(result.extension).toBe('.mp4');
  });

  // -------------------------------------------------------------------------
  // Tier 4 — trailing digits, no separator (E32-F01-S01).
  // -------------------------------------------------------------------------

  it('parses "lesson23.mp4" — trailing digits with no separator recover the ordinal', () => {
    const result = parseLessonFileName('lesson23.mp4');
    expect(result.ordinal).toBe(23);
    expect(result.label).toBe('lesson23');
    expect(result.extension).toBe('.mp4');
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('parses "lesson1.mp4" through "lesson9.mp4" with distinct single-digit ordinals', () => {
    for (let n = 1; n <= 9; n++) {
      const result = parseLessonFileName(`lesson${String(n)}.mp4`);
      expect(result.ordinal).toBe(n);
    }
  });

  it('parses Cyrillic "Занятие5.mp4"', () => {
    const result = parseLessonFileName('Занятие5.mp4');
    expect(result.ordinal).toBe(5);
    expect(result.label).toBe('Занятие5');
  });

  it('still returns undefined ordinal for a bare title with no trailing digits', () => {
    const result = parseLessonFileName('Bonus Episode.mp4');
    expect(result.ordinal).toBeUndefined();
  });

  it('trailing-digits tier is unsupported-extension-aware', () => {
    const result = parseLessonFileName('lesson23.pdf');
    expect(result.ordinal).toBe(23);
    expect(result.unsupportedExtension).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Marker-introduced ordinal (#499) — real filenames from the maintainer's
  // library. Every one of tiers 1–4 missed these: the `#` sits mid-string,
  // not at the start or end of the basename.
  // -------------------------------------------------------------------------

  it('parses "Лекция #9." marker mid-title', () => {
    const result = parseLessonFileName(
      'Биология поведения человека Лекция #9. Этология [Роберт Сапольски, 2010. Стэнфорд].mp4',
    );
    expect(result.ordinal).toBe(9);
    expect(result.label).toBe(
      'Биология поведения человека Лекция #9. Этология [Роберт Сапольски, 2010. Стэнфорд]',
    );
    expect(result.unsupportedExtension).toBeUndefined();
  });

  it('parses "Лекция #1." marker mid-title, with a full stop before the marker word', () => {
    const result = parseLessonFileName(
      'Биология поведения человека. Лекция #1. Введение [Роберт Сапольски, 2010. Стэнфорд].mp4',
    );
    expect(result.ordinal).toBe(1);
  });

  it('parses "№" as the marker as well as "#"', () => {
    const result = parseLessonFileName('Lecture №12 - Recap.mp4');
    expect(result.ordinal).toBe(12);
  });

  // -------------------------------------------------------------------------
  // Calendar-date basename (#498) — PREFIX_RE used to read the year as the
  // ordinal and split off "MM-DD" as the label.
  // -------------------------------------------------------------------------

  it('keeps a calendar-date basename intact, with no ordinal', () => {
    const result = parseLessonFileName('2022-11-12.mp4');
    expect(result.ordinal).toBeUndefined();
    expect(result.label).toBe('2022-11-12');
  });

  it('two calendar-date session recordings keep distinct, intact labels', () => {
    const a = parseLessonFileName('2022-11-12.mp4');
    const b = parseLessonFileName('2022-11-13.mp4');
    expect(a.label).toBe('2022-11-12');
    expect(b.label).toBe('2022-11-13');
    expect(a.ordinal).toBeUndefined();
    expect(b.ordinal).toBeUndefined();
  });

  it('a genuine numeric prefix still wins when the basename is not a calendar date', () => {
    // Regression guard: CALENDAR_DATE_RE must not swallow "2022 - Title" or
    // similar four-digit-prefixed titles that are not dates.
    const result = parseLessonFileName('2022 - Title.mp4');
    expect(result.ordinal).toBe(2022);
    expect(result.label).toBe('Title');
  });
});
