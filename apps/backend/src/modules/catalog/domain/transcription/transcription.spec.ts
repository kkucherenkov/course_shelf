/**
 * Unit tests for the Transcription aggregate lifecycle.
 * Covers: start, the three counters, reconstitute, all three terminal
 * transitions, and mutation refusal after each of them.
 */
import { describe, expect, it } from 'vitest';

import { TranscriptionInTerminalStateError } from './transcription.errors';
import { Transcription } from './transcription';

const NOW = new Date('2026-08-29T12:00:00.000Z');

function running(): Transcription {
  return Transcription.start({
    id: 't1',
    libraryId: 'lib-1',
    force: false,
    lessonsTotal: 3,
    bootId: 'boot-1',
  });
}

/** Every way a run can be closed, so each terminal state is proven to lock it. */
const CLOSERS: readonly [string, (t: Transcription) => void][] = [
  ['complete', (t) => t.complete()],
  ['fail', (t) => t.fail()],
  ['cancel', (t) => t.cancel()],
  ['interrupt', (t) => t.interrupt()],
];

describe('Transcription aggregate', () => {
  describe('start', () => {
    it('starts running with zeroed counters and the known total', () => {
      const t = Transcription.start({
        id: 't1',
        libraryId: 'lib-1',
        force: true,
        lessonsTotal: 3,
        bootId: 'boot-1',
        now: NOW,
      });

      expect(t.id).toBe('t1');
      expect(t.libraryId).toBe('lib-1');
      expect(t.bootId).toBe('boot-1');
      expect(t.force).toBe(true);
      expect(t.status).toBe('running');
      expect(t.lessonsTotal).toBe(3);
      expect(t.lessonsSkipped).toBe(0);
      expect(t.lessonsTranscribed).toBe(0);
      expect(t.lessonsFailed).toBe(0);
      expect(t.errors).toHaveLength(0);
      expect(t.startedAt).toBe(NOW);
      expect(t.finishedAt).toBeUndefined();
    });
  });

  describe('counters', () => {
    it('counts skips, successes and failures independently', () => {
      const t = running();
      t.recordSkipped();
      t.recordSkipped();
      t.recordTranscribed();
      t.recordFailure({ lessonId: 'l3', message: 'whisper died', code: 'whisper-failed' });

      expect(t.lessonsSkipped).toBe(2);
      expect(t.lessonsTranscribed).toBe(1);
      expect(t.lessonsFailed).toBe(1);
      expect(t.errors).toHaveLength(1);
      expect(t.errors[0]).toMatchObject({ lessonId: 'l3', code: 'whisper-failed' });
    });

    it('leaves the total untouched — a failure does not shrink the run', () => {
      const t = running();
      t.recordFailure({ lessonId: 'l1', message: 'unreadable' });

      expect(t.lessonsTotal).toBe(3);
      expect(t.status).toBe('running');
    });
  });

  describe('reconstitute', () => {
    it('restores a persisted run verbatim, terminal state included', () => {
      const t = Transcription.reconstitute({
        id: 't1' as Transcription['id'],
        libraryId: 'lib-1',
        status: 'succeeded',
        force: false,
        startedAt: NOW,
        bootId: 'boot-1',
        finishedAt: NOW,
        lessonsTotal: 10,
        lessonsSkipped: 8,
        lessonsTranscribed: 1,
        lessonsFailed: 1,
        errors: [{ lessonId: 'l9', message: 'boom' }],
        scopeCourseId: 'course-1',
        scopeCourseName: 'Pragmatic Clean Architecture',
      });

      expect(t.status).toBe('succeeded');
      expect(t.lessonsSkipped).toBe(8);
      expect(t.errors).toHaveLength(1);
      expect(t.scopeCourseId).toBe('course-1');
      expect(t.scopeCourseName).toBe('Pragmatic Clean Architecture');
      expect(() => t.recordSkipped()).toThrow(TranscriptionInTerminalStateError);
    });
  });

  describe('scope (E32-F02-S01)', () => {
    it('is absent for a library-wide run', () => {
      const t = running();

      expect(t.scopeCourseId).toBeUndefined();
      expect(t.scopeCourseName).toBeUndefined();
    });

    it('names the course a scoped run was started for', () => {
      const t = Transcription.start({
        id: 't-scoped',
        libraryId: 'lib-1',
        force: false,
        lessonsTotal: 3,
        bootId: 'boot-1',
        scope: { courseId: 'course-1', courseName: 'Pragmatic Clean Architecture' },
      });

      expect(t.scopeCourseId).toBe('course-1');
      expect(t.scopeCourseName).toBe('Pragmatic Clean Architecture');
    });
  });

  describe('terminal transitions', () => {
    it('completes with a finishedAt', () => {
      const t = running();
      t.complete(NOW);

      expect(t.status).toBe('succeeded');
      expect(t.finishedAt).toEqual(NOW);
    });

    it('fails with a finishedAt', () => {
      const t = running();
      t.fail(NOW);

      expect(t.status).toBe('failed');
      expect(t.finishedAt).toEqual(NOW);
    });

    it('cancels with a finishedAt', () => {
      const t = running();
      t.cancel();

      expect(t.status).toBe('cancelled');
      expect(t.finishedAt).toBeDefined();
    });

    it('interrupts with a finishedAt', () => {
      const t = running();
      t.interrupt(NOW);

      expect(t.status).toBe('interrupted');
      expect(t.finishedAt).toEqual(NOW);
    });
  });

  describe('terminal-state guard', () => {
    it.each(CLOSERS)('refuses every mutation after %s()', (_name, close) => {
      const t = running();
      close(t);

      const mutations: (() => void)[] = [
        () => t.recordSkipped(),
        () => t.recordTranscribed(),
        () => t.recordFailure({ lessonId: 'x', message: 'y' }),
        () => t.complete(),
        () => t.fail(),
        () => t.cancel(),
        () => t.interrupt(),
      ];

      for (const mutate of mutations) {
        expect(mutate).toThrow(TranscriptionInTerminalStateError);
      }
    });
  });
});
