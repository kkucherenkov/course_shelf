/**
 * Unit tests for the Subtitle value object.
 *
 * Covers:
 *   - Language extraction: `en` from `Lesson.en.srt`, `ru` from `Lesson.ru.vtt`.
 *   - No language suffix → `und` (undetermined).
 *   - Three-letter language code extraction (`eng` from `Lesson.eng.srt`).
 *   - Label derived from the language, not from the video file name.
 *   - dedupeSubtitlePathsByLanguage: one file per language, `.vtt` preferred.
 */
import { describe, expect, it } from 'vitest';

import { Subtitle, dedupeSubtitlePathsByLanguage, languageLabel } from './subtitle';

describe('Subtitle.fromFile', () => {
  // -------------------------------------------------------------------------
  // Language extraction
  // -------------------------------------------------------------------------
  it('extracts two-letter language from .srt suffix', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.en.srt' });
    expect(s.language).toBe('en');
  });

  it('extracts two-letter language from .vtt suffix', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.ru.vtt' });
    expect(s.language).toBe('ru');
  });

  it('extracts three-letter language code', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.eng.srt' });
    expect(s.language).toBe('eng');
  });

  it('language is "und" when no language suffix is present', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.srt' });
    expect(s.language).toBe('und');
  });

  it('language code is normalised to lowercase', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.EN.srt' });
    expect(s.language).toBe('en');
  });

  // -------------------------------------------------------------------------
  // Label derivation
  // -------------------------------------------------------------------------
  it('label names the language, not the file: "Lesson.en.srt" → "English"', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.en.srt' });
    expect(s.label).toBe('English');
  });

  it('label ignores the video stem: "/deep/path/01 - Intro.ru.srt" → "Russian"', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/deep/path/01 - Intro.ru.srt' });
    expect(s.label).toBe('Russian');
  });

  it('label is "Unknown" when the language is undetermined', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/01 - Intro.srt' });
    expect(s.label).toBe('Unknown');
  });

  it('languageLabel falls back to "Unknown" on an unresolvable tag', () => {
    expect(languageLabel('zzz')).toBe('Unknown');
    expect(languageLabel('!!')).toBe('Unknown');
  });

  // -------------------------------------------------------------------------
  // reconstitute
  // -------------------------------------------------------------------------
  it('reconstitute keeps id/language/path and re-derives the label', () => {
    const s = Subtitle.reconstitute({ id: 's1', language: 'ja', path: '/lib/Lesson.ja.srt' });
    expect(s.id).toBe('s1');
    expect(s.language).toBe('ja');
    expect(s.label).toBe('Japanese');
  });
});

describe('dedupeSubtitlePathsByLanguage', () => {
  it('collapses .srt + .vtt of the same language to one track, preferring .vtt', () => {
    expect(
      dedupeSubtitlePathsByLanguage(['/lib/01 - Intro.en.srt', '/lib/01 - Intro.en.vtt']),
    ).toEqual(['/lib/01 - Intro.en.vtt']);
  });

  it('is order-independent', () => {
    expect(
      dedupeSubtitlePathsByLanguage(['/lib/01 - Intro.en.vtt', '/lib/01 - Intro.en.srt']),
    ).toEqual(['/lib/01 - Intro.en.vtt']);
  });

  it('keeps one track per distinct language', () => {
    expect(
      dedupeSubtitlePathsByLanguage([
        '/lib/Intro.ru.srt',
        '/lib/Intro.en.srt',
        '/lib/Intro.en.vtt',
      ]),
    ).toEqual(['/lib/Intro.en.vtt', '/lib/Intro.ru.srt']);
  });

  it('collapses untagged files onto the single "und" track', () => {
    expect(dedupeSubtitlePathsByLanguage(['/lib/Intro.srt', '/lib/Bonus.srt'])).toEqual([
      '/lib/Bonus.srt',
    ]);
  });

  it('breaks ties deterministically on the sorted path', () => {
    const paths = ['/lib/b.en.srt', '/lib/a.en.srt'];
    expect(dedupeSubtitlePathsByLanguage(paths)).toEqual(['/lib/a.en.srt']);
    expect(dedupeSubtitlePathsByLanguage(paths.toReversed())).toEqual(['/lib/a.en.srt']);
  });

  it('returns an empty list for no input', () => {
    expect(dedupeSubtitlePathsByLanguage([])).toEqual([]);
  });
});
