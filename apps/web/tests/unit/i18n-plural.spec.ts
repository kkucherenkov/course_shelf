import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '../../i18n/locales/en';
import ru from '../../i18n/locales/ru';
import { ruPluralRule } from '../../i18n/plural-rules';

// Regression coverage for #582/#594: vue-i18n's built-in pluralization
// defaults to English's two-form rule and silently mis-selects every
// three-form Russian `{n} X | {n} Y | {n} Z` message without an explicit
// `pluralRules.ru`. This exercises the rule directly against the classic
// CLDR trap values, then the real `en`/`ru` message trees end-to-end through
// a throwaway `createI18n` instance (composition mode, matching
// `i18n.config.ts`) so a regression in either the rule or a locale string
// fails here instead of only in the browser.

describe('ruPluralRule', () => {
  it.each([
    [0, 2], // many: "0 задач"
    [1, 0], // one: "1 задача"
    [2, 1], // few: "2 задачи"
    [3, 1],
    [4, 1],
    [5, 2], // many: "5 задач"
    [11, 2], // many, not "one" — x11 exception
    [12, 2],
    [14, 2],
    [21, 0], // one: "21 задача"
    [22, 1], // few: "22 задачи"
    [101, 0], // one: "101 задача"
    [111, 2], // many, not "one" — x11 exception persists past 100
    [112, 2],
  ])('choice=%i resolves to form index %i', (choice, expected) => {
    expect(ruPluralRule(choice)).toBe(expected);
  });
});

describe('locale pluralization end-to-end', () => {
  const i18n = createI18n({
    legacy: false,
    locale: 'ru',
    fallbackLocale: 'en',
    messages: { en, ru },
    pluralRules: { ru: ruPluralRule },
  });
  const t = i18n.global.t;

  it('picks the correct Russian noun form for a plain {n} message', () => {
    expect(t('pages.browse.subtitle', { n: 0 })).toBe('0 курсов');
    expect(t('pages.browse.subtitle', { n: 1 })).toBe('1 курс');
    expect(t('pages.browse.subtitle', { n: 2 })).toBe('2 курса');
    expect(t('pages.browse.subtitle', { n: 21 })).toBe('21 курс');
  });

  it('keeps courses and lessons independently pluralized (#594 double-plural split)', () => {
    expect(t('pages.admin.dashboard.statLibrariesMetaCourses', { n: 68 })).toBe('68 курсов');
    expect(t('pages.admin.dashboard.statLibrariesMetaLessons', { n: 5973 })).toBe('5973 урока');
  });

  it('repeats the {libraryId} prefix across every plural form', () => {
    expect(t('pages.admin.dashboard.statLastScanMeta', { libraryId: 'abc12345', n: 1 })).toBe(
      'Библиотека abc12345 · 1 файл',
    );
    expect(t('pages.admin.dashboard.statLastScanMeta', { libraryId: 'abc12345', n: 2 })).toBe(
      'Библиотека abc12345 · 2 файла',
    );
    expect(t('pages.admin.dashboard.statLastScanMeta', { libraryId: 'abc12345', n: 5 })).toBe(
      'Библиотека abc12345 · 5 файлов',
    );
  });

  it('repeats the search query across every plural form', () => {
    expect(t('pages.search.headerCount', { n: 1, q: 'react' })).toBe(
      '1 результат по запросу «react»',
    );
    expect(t('pages.search.headerCount', { n: 2, q: 'react' })).toBe(
      '2 результата по запросу «react»',
    );
    expect(t('pages.search.headerCount', { n: 5, q: 'react' })).toBe(
      '5 результатов по запросу «react»',
    );
  });

  it('falls back to English two-form pluralization unaffected by the ru rule', () => {
    i18n.global.locale.value = 'en';
    expect(t('pages.browse.subtitle', { n: 0 })).toBe('0 courses');
    expect(t('pages.browse.subtitle', { n: 1 })).toBe('1 course');
    expect(t('pages.browse.subtitle', { n: 2 })).toBe('2 courses');
    i18n.global.locale.value = 'ru';
  });
});
