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
});
