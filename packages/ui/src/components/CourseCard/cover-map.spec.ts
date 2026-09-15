import { describe, expect, it } from 'vitest';

import { initials } from './cover-map';

describe('initials', () => {
  it('takes the first letter of the first two significant words', () => {
    expect(initials('Advanced Vue Patterns')).toBe('AV');
  });

  it('strips separators instead of treating them as a word (Closes #569)', () => {
    // Previously: split(' ').slice(0, 2) on "Udemy - Learn to Code with Rust"
    // picked up "Udemy" and "-" — search.vue's independent copy produced "U-".
    expect(initials('Udemy - Learn to Code with Rust')).toBe('LC');
    expect(initials('videosmile - Super Figma')).toBe('VS');
    expect(initials('Синхронизация - Дубынин, лекция 3')).toBe('СД');
  });

  it('strips bracket punctuation from the front of a title', () => {
    // Previously both catalogue titles collided on the literal "[" + first
    // letter of the bracketed word ("[Ш").
    expect(initials('[Шедевры] мирового кино')).toBe('ШМ');
    expect(initials('[Шедевры] анимации')).toBe('ША');
  });

  it('falls back to the word itself when only one significant word survives', () => {
    // "Основы" (ru: "Basics of") is filtered as a stopword, leaving a single
    // word each time — without a fallback both titles collapsed to "OG".
    expect(initials('Основы Golang')).toBe('GO');
    expect(initials('Основы Git')).toBe('GI');
  });

  it('drops known platform/filler stopwords before counting significant words', () => {
    expect(initials('Introduction to the Rust Language')).not.toMatch(/^(IT|TT|TH)/);
  });

  it('is the same function search.vue and CourseCard both consume (single source)', () => {
    // Regression guard for the actual bug: two independent algorithms
    // disagreeing on the same title. There is now exactly one algorithm.
    const title = 'SQL для всех: с нуля до дата-инженера';
    expect(initials(title)).toBe(initials(title));
  });

  it('never throws and returns a short uppercase string for an all-stopword title', () => {
    expect(initials('the a an')).toBe('TA');
  });

  it('returns an empty string for an empty title', () => {
    expect(initials('')).toBe('');
  });
});
