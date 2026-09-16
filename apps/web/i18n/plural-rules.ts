// CLDR cardinal-plural categories for Russian: one/few/many by the last one
// or two digits, not by raw magnitude — vue-i18n's default rule is English's
// two-form singular/plural and silently mis-picks all three-form `{n} X | {n}
// Y | {n} Z` messages without this. Mapped to vue-i18n's 0/1/2 pipe indices.
//
// Kept in its own module (rather than inline in `i18n.config.ts`) so it can
// be unit-tested without pulling in `defineI18nConfig`, which only exists as
// a Nuxt build-time auto-import and isn't available under plain Vitest.
export function ruPluralRule(choice: number): number {
  const lastDigit = choice % 10;
  const lastTwoDigits = choice % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) return 0; // one: 1, 21, 101
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return 1; // few: 2-4, 22-24
  return 2; // many: 0, 5-20, 25-30, 11-14…
}
