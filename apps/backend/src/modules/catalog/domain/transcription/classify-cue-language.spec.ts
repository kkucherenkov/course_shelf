import { describe, expect, it } from 'vitest';

import { classifyScript, classifyTranscriptLanguage } from './classify-cue-language';

const RUSSIAN_TEXT =
  'Добро пожаловать на этот курс. Сегодня мы поговорим о том, как устроена ' +
  'архитектура приложения и почему это важно для каждого разработчика.';

const ENGLISH_TEXT =
  'Welcome to this course. Today we are going to talk about how the ' +
  'application architecture is built and why it matters for every developer.';

describe('classifyScript', () => {
  it('classifies a Russian-majority text as ru', () => {
    expect(classifyScript(RUSSIAN_TEXT)).toBe('ru');
  });

  it('classifies an English-majority text as en', () => {
    expect(classifyScript(ENGLISH_TEXT)).toBe('en');
  });

  it('returns undefined for text with too little alphabetic content', () => {
    expect(classifyScript('1 2 3 ... 42')).toBeUndefined();
    expect(classifyScript('')).toBeUndefined();
  });

  it('returns undefined for a short fragment even if it leans one way', () => {
    // Real risk named in the ticket: a short/noisy clip must not be classified
    // on a handful of characters.
    expect(classifyScript('да да')).toBeUndefined();
  });

  it('a longer mixed text is classified by whichever script has more letters', () => {
    const mostlyEnglishWithOneRussianWord = `${ENGLISH_TEXT} привет`;
    expect(classifyScript(mostlyEnglishWithOneRussianWord)).toBe('en');
  });
});

describe('classifyTranscriptLanguage', () => {
  it('returns ru for Russian cue text', () => {
    expect(classifyTranscriptLanguage(RUSSIAN_TEXT, 'und')).toBe('ru');
  });

  it('returns en for English cue text', () => {
    expect(classifyTranscriptLanguage(ENGLISH_TEXT, 'und')).toBe('en');
  });

  it('falls back to the configured default when the text cannot be classified', () => {
    expect(classifyTranscriptLanguage('42', 'und')).toBe('und');
    expect(classifyTranscriptLanguage('42', 'en')).toBe('en');
  });
});
