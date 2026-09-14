import { describe, expect, it } from 'vitest';

import { resolveDetectedLanguage } from './detected-language';

describe('resolveDetectedLanguage', () => {
  it('trusts a detected ru', () => {
    expect(resolveDetectedLanguage('ru', 'und')).toBe('ru');
  });

  it('trusts a detected en', () => {
    expect(resolveDetectedLanguage('en', 'und')).toBe('en');
  });

  it('is case-insensitive', () => {
    expect(resolveDetectedLanguage('RU', 'und')).toBe('ru');
  });

  it('falls back when detection is undefined', () => {
    expect(resolveDetectedLanguage(undefined, 'und')).toBe('und');
  });

  it('falls back on an unsupported language (misdetection guard)', () => {
    expect(resolveDetectedLanguage('uk', 'und')).toBe('und');
  });

  it('falls back on garbage input', () => {
    expect(resolveDetectedLanguage('not a language tag', 'und')).toBe('und');
  });
});
