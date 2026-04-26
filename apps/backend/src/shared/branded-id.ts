/**
 * Phantom-typed identifier helper.
 *
 * Two strings carrying the same shape but different brands are not assignable
 * to each other at compile time, so a `Course` id cannot be passed where a
 * `Lesson` id is expected — even though both are strings at runtime.
 *
 *   type CourseId = Brand<string, 'Course'>;
 *   type LessonId = Brand<string, 'Lesson'>;
 *   const c: CourseId = brand<string, 'Course'>('c-123');
 *   const l: LessonId = c; //  Type error.
 */
declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

/**
 * No-op runtime cast that produces a branded value. Validation belongs in the
 * caller — this helper only stamps the type.
 */
export function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}

/** Convenience alias for the common case of string-keyed entity ids. */
export type Id<B extends string> = Brand<string, B>;
