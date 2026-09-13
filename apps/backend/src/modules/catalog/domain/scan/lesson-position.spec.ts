/**
 * Unit tests for assignLessonPositions (E32-F01-S01).
 * Covers the position rule described in lesson-position.ts's WHY comment.
 */
import { describe, expect, it } from 'vitest';

import { parseLessonFileName } from './folder-name.parser';
import { assignLessonPositions } from './lesson-position';

import type { LessonPositionInput } from './lesson-position';

function entry(videoPath: string): LessonPositionInput {
  const basename = videoPath.split('/').pop() ?? videoPath;
  return { videoPath, parsed: parseLessonFileName(basename) };
}

describe('assignLessonPositions', () => {
  it('assigns distinct sequential positions to ordinary "NN - Title" files', () => {
    const entries = [
      entry('/lib/Course/02 - Aggregates.mp4'),
      entry('/lib/Course/01 - Intro.mp4'),
      entry('/lib/Course/03 - Outro.mp4'),
    ];
    const positions = assignLessonPositions(entries);
    expect(positions.get('/lib/Course/01 - Intro.mp4')).toBe(1);
    expect(positions.get('/lib/Course/02 - Aggregates.mp4')).toBe(2);
    expect(positions.get('/lib/Course/03 - Outro.mp4')).toBe(3);
  });

  it('flat suffix-digit shape ("lesson1" … "lesson23"): 23 distinct positions in numeric order', () => {
    const entries = Array.from({ length: 23 }, (_, i) =>
      entry(`/lib/DDD/lesson${String(i + 1)}.mp4`),
    );
    const positions = assignLessonPositions(entries);
    expect(positions.size).toBe(23);
    expect(new Set(positions.values()).size).toBe(23);
    for (let n = 1; n <= 23; n++) {
      expect(positions.get(`/lib/DDD/lesson${String(n)}.mp4`)).toBe(n);
    }
  });

  it('flat composite "N.M" shape (Golang): chapter+lesson compose so repeating M never collides', () => {
    // 16 chapters × 8 lessons — every chapter reuses ordinals 1..8, the exact
    // shape that dropped 112 of 128 lessons pre-fix.
    const entries: LessonPositionInput[] = [];
    for (let chapter = 1; chapter <= 16; chapter++) {
      for (let lesson = 1; lesson <= 8; lesson++) {
        entries.push(entry(`/lib/Golang/${String(chapter)}.${String(lesson)}.mp4`));
      }
    }
    const positions = assignLessonPositions(entries);
    expect(positions.size).toBe(128);
    expect(new Set(positions.values()).size).toBe(128);
    // Chapter-then-lesson order: 1.1, 1.2, …, 1.8, 2.1, … lands in rank order.
    expect(positions.get('/lib/Golang/1.1.mp4')).toBe(1);
    expect(positions.get('/lib/Golang/1.8.mp4')).toBe(8);
    expect(positions.get('/lib/Golang/2.1.mp4')).toBe(9);
    expect(positions.get('/lib/Golang/16.8.mp4')).toBe(128);
  });

  it('genuine same-ordinal collision (two distinct titles both "1. …") resolves via path fallback', () => {
    const entries = [entry('/lib/Course/1. Overview.mp4'), entry('/lib/Course/1. Bonus.mp4')];
    const positions = assignLessonPositions(entries);
    expect(positions.size).toBe(2);
    expect(new Set(positions.values())).toEqual(new Set([1, 2]));
  });

  it('is stable across two calls with the same entries in a different array order', () => {
    const a = [entry('/lib/C/02 - B.mp4'), entry('/lib/C/01 - A.mp4')];
    const b = [entry('/lib/C/01 - A.mp4'), entry('/lib/C/02 - B.mp4')];
    expect(assignLessonPositions(a)).toEqual(assignLessonPositions(b));
  });
});
