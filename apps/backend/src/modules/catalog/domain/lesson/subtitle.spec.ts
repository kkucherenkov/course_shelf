/**
 * Unit tests for the Subtitle value object.
 *
 * Covers:
 *   - Language extraction: `en` from `Lesson.en.srt`, `ru` from `Lesson.ru.vtt`.
 *   - No language suffix → `und` (undetermined).
 *   - Three-letter language code extraction (`eng` from `Lesson.eng.srt`).
 *   - Label derivation: extension + language suffix stripped.
 *   - reconstitute bypasses derivation logic.
 */
import { describe, expect, it } from 'vitest';

import { Subtitle } from './subtitle';

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
  it('label strips language suffix + extension: "Lesson.en.srt" → "Lesson"', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.en.srt' });
    expect(s.label).toBe('Lesson');
  });

  it('label strips plain extension when no language suffix: "Lesson.srt" → "Lesson"', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/lib/Lesson.srt' });
    expect(s.label).toBe('Lesson');
  });

  it('label uses basename only: "/deep/path/01 - Intro.en.srt" → "01 - Intro"', () => {
    const s = Subtitle.fromFile({ id: 's1', path: '/deep/path/01 - Intro.en.srt' });
    expect(s.label).toBe('01 - Intro');
  });

  // -------------------------------------------------------------------------
  // reconstitute
  // -------------------------------------------------------------------------
  it('reconstitute stores values as-is', () => {
    const s = Subtitle.reconstitute({
      id: 's1',
      language: 'ja',
      label: 'Japanese Track',
      path: '/lib/Lesson.ja.srt',
    });
    expect(s.id).toBe('s1');
    expect(s.language).toBe('ja');
    expect(s.label).toBe('Japanese Track');
  });
});
