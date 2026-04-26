/**
 * Unit tests for the Scan aggregate lifecycle.
 * Covers: start, recordError, recordFileAdded, recordFileUpdated, recordFileUnchanged,
 * incrementCoursesDiscovered, complete, fail, and terminal-state guard.
 */
import { describe, expect, it } from 'vitest';

import { ScanInTerminalStateError } from './scan.errors';
import { Scan } from './scan';

const NOW = new Date('2026-04-26T00:00:00.000Z');
const FILE = { path: '/lib/01 - Course/01 - Intro.mp4', mtime: NOW, size: 1024 };
const COURSE = {
  path: '/lib/01 - Course',
  title: 'Course A',
  sectionTitles: [],
  lessonFiles: [FILE.path],
};

function terminalOps(scan: Scan): (() => void)[] {
  return [
    () => scan.recordError({ path: 'x', message: 'x' }),
    () => scan.recordFileAdded(FILE),
    () => scan.recordFileUpdated(FILE),
    () => scan.recordFileUnchanged(FILE),
    () => scan.incrementCoursesDiscovered(COURSE),
    () => scan.complete(),
    () => scan.fail(),
  ];
}

describe('Scan aggregate', () => {
  describe('start', () => {
    it('creates a scan with status running and zero counters', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1', now: NOW });

      expect(scan.status).toBe('running');
      expect(scan.filesScanned).toBe(0);
      expect(scan.filesAdded).toBe(0);
      expect(scan.filesUpdated).toBe(0);
      expect(scan.coursesDiscovered).toBe(0);
      expect(scan.errors).toHaveLength(0);
      expect(scan.discoveredFiles).toHaveLength(0);
      expect(scan.startedAt).toBe(NOW);
      expect(scan.finishedAt).toBeUndefined();
    });
  });

  describe('recordError', () => {
    it('appends an error entry', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.recordError({
        path: '/lib/bad.txt',
        message: 'Unsupported',
        code: 'unsupported-extension',
      });

      expect(scan.errors).toHaveLength(1);
      expect(scan.errors[0]).toMatchObject({ path: '/lib/bad.txt', code: 'unsupported-extension' });
    });

    it('does not affect file counters', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.recordError({ path: '/lib/bad.txt', message: 'Bad' });

      expect(scan.filesScanned).toBe(0);
    });
  });

  describe('recordFileAdded', () => {
    it('increments filesScanned and filesAdded', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.recordFileAdded(FILE);

      expect(scan.filesScanned).toBe(1);
      expect(scan.filesAdded).toBe(1);
      expect(scan.filesUpdated).toBe(0);
      expect(scan.discoveredFiles).toHaveLength(1);
    });
  });

  describe('recordFileUpdated', () => {
    it('increments filesScanned and filesUpdated', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.recordFileUpdated(FILE);

      expect(scan.filesScanned).toBe(1);
      expect(scan.filesUpdated).toBe(1);
      expect(scan.filesAdded).toBe(0);
    });
  });

  describe('recordFileUnchanged', () => {
    it('increments filesScanned only', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.recordFileUnchanged(FILE);

      expect(scan.filesScanned).toBe(1);
      expect(scan.filesAdded).toBe(0);
      expect(scan.filesUpdated).toBe(0);
    });
  });

  describe('incrementCoursesDiscovered', () => {
    it('increments the counter and stores the course', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.incrementCoursesDiscovered(COURSE);

      expect(scan.coursesDiscovered).toBe(1);
      expect(scan.courses[0]?.title).toBe('Course A');
    });
  });

  describe('complete', () => {
    it('transitions status to succeeded and sets finishedAt', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.complete(NOW);

      expect(scan.status).toBe('succeeded');
      expect(scan.finishedAt).toBe(NOW);
    });
  });

  describe('fail', () => {
    it('transitions status to failed and sets finishedAt', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.fail(NOW);

      expect(scan.status).toBe('failed');
      expect(scan.finishedAt).toBe(NOW);
    });
  });

  describe('terminal state guard', () => {
    it('throws ScanInTerminalStateError for all mutators after complete', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.complete();

      for (const op of terminalOps(scan)) {
        expect(op).toThrow(ScanInTerminalStateError);
      }
    });

    it('throws ScanInTerminalStateError for all mutators after fail', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.fail();

      for (const op of terminalOps(scan)) {
        expect(op).toThrow(ScanInTerminalStateError);
      }
    });

    it('full lifecycle: start → progress → complete accumulates correctly', () => {
      const scan = Scan.start({ id: 'scan-1', libraryId: 'lib-1' });
      scan.recordFileAdded(FILE);
      scan.recordFileAdded({ ...FILE, path: '/lib/01 - Course/02 - Deep Dive.mp4' });
      scan.recordError({
        path: '/lib/01 - Course/notes.txt',
        message: 'Unsupported',
        code: 'unsupported-extension',
      });
      scan.incrementCoursesDiscovered(COURSE);
      scan.complete(NOW);

      expect(scan.filesScanned).toBe(2);
      expect(scan.filesAdded).toBe(2);
      expect(scan.coursesDiscovered).toBe(1);
      expect(scan.errors).toHaveLength(1);
      expect(scan.status).toBe('succeeded');
    });
  });
});
