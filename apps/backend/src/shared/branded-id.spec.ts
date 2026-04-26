import { describe, expect, it } from 'vitest';

import { brand } from './branded-id';

import type { Brand, Id } from './branded-id';

describe('branded-id', () => {
  it('is a runtime no-op — the value passes through unchanged', () => {
    expect(brand<string, 'Course'>('c-123')).toBe('c-123');
    expect(brand<number, 'Order'>(42)).toBe(42);
  });

  it('produces values whose runtime shape matches the input', () => {
    const id = brand<string, 'Course'>('c-123');
    expect(typeof id).toBe('string');
    expect(id.length).toBe(5);
  });

  it('refuses cross-brand assignments at the type level', () => {
    type CourseId = Brand<string, 'Course'>;
    type LessonId = Brand<string, 'Lesson'>;
    const course: CourseId = brand<string, 'Course'>('c-1');
    // @ts-expect-error — Course is not assignable to Lesson, even though both wrap string.
    const lesson: LessonId = course;
    expect(lesson).toBe('c-1');
  });

  it('also exposes the `Id<B>` shorthand for string-keyed identifiers', () => {
    type CourseId = Id<'Course'>;
    const id: CourseId = brand<string, 'Course'>('c-2');
    expect(id).toBe('c-2');
  });
});
