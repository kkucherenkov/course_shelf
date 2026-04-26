/**
 * Unit tests for the Note aggregate.
 * Covers invariants on Note.create() and setBody():
 *   - body trimming is applied
 *   - empty body after trim → NoteInvalidError
 *   - body exceeding 16384 chars after trim → NoteInvalidError
 *   - setBody applies same rules and advances updatedAt
 */
import { describe, expect, it, vi } from 'vitest';

import { NoteInvalidError } from './note.errors';
import { Note } from './note';

const BASE = { id: 'note-1', userId: 'user-1', lessonId: 'lesson-1' };

describe('Note.create', () => {
  it('creates a note with trimmed body', () => {
    const note = Note.create({ ...BASE, body: '  hello  ' });
    expect(note.body).toBe('hello');
  });

  it('stores readonly ids correctly', () => {
    const note = Note.create({ ...BASE, body: 'hello' });
    expect(note.id).toBe('note-1');
    expect(note.userId).toBe('user-1');
    expect(note.lessonId).toBe('lesson-1');
  });

  it('createdAt and updatedAt are equal on create', () => {
    const note = Note.create({ ...BASE, body: 'hello' });
    expect(note.createdAt.getTime()).toBe(note.updatedAt.getTime());
  });

  it('throws NoteInvalidError when body is empty after trim', () => {
    expect(() => Note.create({ ...BASE, body: '   ' })).toThrow(NoteInvalidError);
  });

  it('throws NoteInvalidError when body is empty string', () => {
    expect(() => Note.create({ ...BASE, body: '' })).toThrow(NoteInvalidError);
  });

  it('throws NoteInvalidError when body exceeds 16384 chars after trim', () => {
    const long = 'a'.repeat(16_385);
    expect(() => Note.create({ ...BASE, body: long })).toThrow(NoteInvalidError);
  });

  it('accepts body of exactly 16384 chars', () => {
    const maxBody = 'a'.repeat(16_384);
    const note = Note.create({ ...BASE, body: maxBody });
    expect(note.body.length).toBe(16_384);
  });

  it('accepts body of 1 char', () => {
    const note = Note.create({ ...BASE, body: 'a' });
    expect(note.body).toBe('a');
  });

  it('16385 chars become valid if leading/trailing spaces reduce it to <=16384', () => {
    // Body padded with spaces: after trim length is exactly 16384
    const spacePadded = ' ' + 'a'.repeat(16_384) + ' ';
    const note = Note.create({ ...BASE, body: spacePadded });
    expect(note.body.length).toBe(16_384);
  });
});

describe('Note.setBody', () => {
  it('replaces the body with trimmed value', () => {
    const note = Note.create({ ...BASE, body: 'old' });
    note.setBody('  new  ');
    expect(note.body).toBe('new');
  });

  it('throws NoteInvalidError for empty body after trim', () => {
    const note = Note.create({ ...BASE, body: 'old' });
    expect(() => note.setBody('   ')).toThrow(NoteInvalidError);
  });

  it('throws NoteInvalidError for body exceeding 16384 chars', () => {
    const note = Note.create({ ...BASE, body: 'old' });
    expect(() => note.setBody('a'.repeat(16_385))).toThrow(NoteInvalidError);
  });

  it('advances updatedAt on setBody', () => {
    vi.useFakeTimers();
    const note = Note.create({ ...BASE, body: 'old' });
    const before = note.updatedAt.getTime();
    vi.advanceTimersByTime(100);
    note.setBody('new');
    expect(note.updatedAt.getTime()).toBeGreaterThan(before);
    vi.useRealTimers();
  });

  it('does not change createdAt on setBody', () => {
    vi.useFakeTimers();
    const note = Note.create({ ...BASE, body: 'old' });
    const createdAt = note.createdAt.getTime();
    vi.advanceTimersByTime(100);
    note.setBody('new');
    expect(note.createdAt.getTime()).toBe(createdAt);
    vi.useRealTimers();
  });

  it('returns this for chaining', () => {
    const note = Note.create({ ...BASE, body: 'old' });
    const result = note.setBody('new');
    expect(result).toBe(note);
  });
});
