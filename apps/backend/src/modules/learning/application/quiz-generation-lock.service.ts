/**
 * WHY this file exists:
 * llama.cpp saturates every core it is given, same as whisper — two
 * concurrent quiz-generation walks for the same course would halve each
 * other rather than finish sooner (E29-F02-S01, mirrors
 * TranscriptionAlreadyRunningError's reasoning). Transcription enforces this
 * with a persisted "is one running" query because its walk can run for
 * hours and must survive a process restart; a quiz-generation walk is
 * orders of magnitude cheaper (text, not audio) and this deployment is a
 * single Node process with no horizontal scaling — an in-memory lock is
 * therefore correct here, not merely convenient, and needs no migration.
 *
 * ponytail: process-lifetime only — a killed process leaves no trace of a
 * run that was in flight (no crash recovery, unlike Transcription's boot-time
 * pass). Upgrade path if that ever bites: a persisted run row, same shape as
 * Transcription's.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizGenerationLockService {
  private readonly runningCourseIds = new Set<string>();

  /** Returns true and marks the course as running, or false if already running. */
  tryAcquire(courseId: string): boolean {
    if (this.runningCourseIds.has(courseId)) return false;
    this.runningCourseIds.add(courseId);
    return true;
  }

  release(courseId: string): void {
    this.runningCourseIds.delete(courseId);
  }
}
