/**
 * Unit tests for the stemMatch utility.
 *
 * Covers:
 *   - Video, material, subtitle, and unsupported kinds.
 *   - Dot-vs-space prefix variant normalisation (1.1 vs 1.1.).
 *   - Single ordinal prefix (`01 - Title`, `01. Title`) → shared stem.
 *   - Subtitle language suffix stripping (`.en.srt` → stem without `.en`).
 *   - Subtitle with no language suffix (`Lesson.srt` → plain stem).
 *   - Unsupported extension passes through.
 *   - File with no extension → unsupported.
 */
import { describe, expect, it } from 'vitest';

import { stemMatch } from './stem-match';

describe('stemMatch', () => {
  // -------------------------------------------------------------------------
  // Kind classification
  // -------------------------------------------------------------------------

  it.each([
    ['/lib/01 - Intro.mp4', 'video'],
    ['/lib/01 - Intro.m4v', 'video'],
    ['/lib/01 - Intro.mkv', 'video'],
    ['/lib/01 - Intro.webm', 'video'],
  ])('%s → kind=video', (path, expectedKind) => {
    expect(stemMatch(path).kind).toBe(expectedKind);
  });

  it.each([
    ['/lib/01 - Notes.pdf', 'material'],
    ['/lib/01 - Notes.md', 'material'],
    ['/lib/01 - Notes.txt', 'material'],
    ['/lib/01 - Screenshot.png', 'material'],
    ['/lib/01 - Screenshot.jpg', 'material'],
    ['/lib/01 - Screenshot.jpeg', 'material'],
  ])('%s → kind=material', (path, expectedKind) => {
    expect(stemMatch(path).kind).toBe(expectedKind);
  });

  it.each([
    ['/lib/01 - Intro.en.srt', 'subtitle'],
    ['/lib/01 - Intro.ru.vtt', 'subtitle'],
    ['/lib/01 - Intro.srt', 'subtitle'],
    ['/lib/01 - Intro.vtt', 'subtitle'],
  ])('%s → kind=subtitle', (path, expectedKind) => {
    expect(stemMatch(path).kind).toBe(expectedKind);
  });

  it.each([
    ['/lib/01 - Data.zip', 'unsupported'],
    ['/lib/01 - Data.docx', 'unsupported'],
    ['/lib/noextension', 'unsupported'],
  ])('%s → kind=unsupported', (path, expectedKind) => {
    expect(stemMatch(path).kind).toBe(expectedKind);
  });

  // -------------------------------------------------------------------------
  // Composite prefix dot-vs-space normalisation
  // -------------------------------------------------------------------------

  it('composite prefix without trailing dot: "1.1 Почему Vim.mp4"', () => {
    const { canonicalStem } = stemMatch('/lib/1.1 Почему Vim.mp4');
    expect(canonicalStem).toBe('1.1 Почему Vim');
  });

  it('composite prefix with trailing dot: "1.1. Почему Vim.pdf"', () => {
    const { canonicalStem } = stemMatch('/lib/1.1. Почему Vim.pdf');
    expect(canonicalStem).toBe('1.1 Почему Vim');
  });

  it('both forms produce the same canonical stem', () => {
    const video = stemMatch('/lib/2.5 Установка на Windows.mp4');
    const material = stemMatch('/lib/2.5. Установка на Windows.pdf');
    expect(video.canonicalStem).toBe(material.canonicalStem);
  });

  it('composite prefix with no title: "2.6.mp4"', () => {
    const { canonicalStem } = stemMatch('/lib/2.6.mp4');
    expect(canonicalStem).toBe('2.6');
  });

  // -------------------------------------------------------------------------
  // Single ordinal prefix normalisation
  // -------------------------------------------------------------------------

  it('"01 - Intro.mp4" and "01 - Intro.pdf" share canonical stem', () => {
    const video = stemMatch('/lib/01 - Intro.mp4');
    const material = stemMatch('/lib/01 - Intro.pdf');
    expect(video.canonicalStem).toBe(material.canonicalStem);
  });

  it('"01. Intro.mp4" and "01 - Intro.mp4" share canonical stem', () => {
    const dotForm = stemMatch('/lib/01. Intro.mp4');
    const dashForm = stemMatch('/lib/01 - Intro.mp4');
    expect(dotForm.canonicalStem).toBe(dashForm.canonicalStem);
  });

  // -------------------------------------------------------------------------
  // Subtitle language stripping
  // -------------------------------------------------------------------------

  it('subtitle with language suffix: "Intro.en.srt" → stem "Intro"', () => {
    const { canonicalStem } = stemMatch('/lib/Intro.en.srt');
    expect(canonicalStem).toBe('Intro');
  });

  it('subtitle with no language suffix: "Intro.srt" → stem "Intro"', () => {
    const { canonicalStem } = stemMatch('/lib/Intro.srt');
    expect(canonicalStem).toBe('Intro');
  });

  it('subtitle with composite prefix and language: "1.1 Lesson.en.srt" → same stem as video', () => {
    const video = stemMatch('/lib/1.1 Lesson.mp4');
    const subtitle = stemMatch('/lib/1.1 Lesson.en.srt');
    expect(video.canonicalStem).toBe(subtitle.canonicalStem);
  });

  it('subtitle with dot-prefix and language: "1.1. Lesson.ru.vtt" → same stem as video', () => {
    const video = stemMatch('/lib/1.1 Lesson.mp4');
    const subtitle = stemMatch('/lib/1.1. Lesson.ru.vtt');
    expect(video.canonicalStem).toBe(subtitle.canonicalStem);
  });

  // -------------------------------------------------------------------------
  // Path with no extension
  // -------------------------------------------------------------------------

  it('file with no extension is unsupported', () => {
    const result = stemMatch('/lib/some_file_no_ext');
    expect(result.kind).toBe('unsupported');
    expect(result.canonicalStem).toBe('some_file_no_ext');
  });

  // -------------------------------------------------------------------------
  // Plain title (no prefix)
  // -------------------------------------------------------------------------

  it('plain file name without ordinal prefix: "Introduction.mp4"', () => {
    const { canonicalStem, kind } = stemMatch('/lib/Introduction.mp4');
    expect(canonicalStem).toBe('Introduction');
    expect(kind).toBe('video');
  });
});
