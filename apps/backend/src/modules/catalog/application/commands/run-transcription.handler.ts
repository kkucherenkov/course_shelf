/**
 * WHY this file exists:
 * Orchestrates one transcription pass, modelled on `run-scan.handler.ts` down
 * to the fire-and-forget shape:
 *   1. Resolve the scope: a course id (POST /courses/{id}/transcription) yields
 *      its library; otherwise the library id came straight off the URL.
 *   2. Verify the library exists.
 *   3. Refuse when no whisper model is configured — a run that can only fail is
 *      worse than no run.
 *   4. Refuse when a run is already going for this library.
 *   5. Persist a Transcription in status=running and RETURN it (202 Accepted).
 *   6. Fire-and-forget the walk so the response flushes before whisper starts.
 *
 * Scope (E32-F02-S01) narrows the lesson list to one course and nothing else;
 * every later step is identical, skip rule included. It exists because a
 * library-wide run is not affordable: measured on a Pentium Gold 8505,
 * whisper.cpp `base` spends ~19.5 minutes per lesson, so five thousand lessons
 * is weeks of continuous CPU and thirty lessons is one night.
 *
 * A scoped run is blocked by the same already-running guard as a library-wide
 * one. Whisper saturates every core it is given; a second concurrent run halves
 * the first rather than finishing sooner, so "start this instead" has to be an
 * explicit cancel — which is what the 409's detail tells the operator to do.
 *
 * Per lesson, in outline order:
 *   skip rule → audio extraction → whisper → cue parsing → one transaction for
 *   the Transcript and its cues. A failure at any step is recorded against the
 *   lesson and the walk moves on; one unreadable video costs its own lesson,
 *   never the run.
 *
 * Sequential by design. A second concurrent whisper process on the NAS this runs
 * on competes with the first for the same cores rather than finishing sooner —
 * WHISPER_THREADS is the dial that matters, and it belongs to the engine.
 *
 * Restart safety comes from the skip rule rather than from a durable queue:
 * re-running skips everything already on disk, so a crash costs at most the
 * lesson that was in flight.
 *
 * No NestJS HTTP exceptions here — boundaries/element-types enforces this at lint time.
 */
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';
import { AppConfig } from '../../../../common/config/app-config';
import { convertSrtToVtt, extractCues } from '../../../../shared/subtitle-converter';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { FFMPEG_ADAPTER } from '../../domain/scan/ffmpeg-adapter';
import { resolveDetectedLanguage } from '../../domain/transcription/detected-language';
import { derivedTranscriptPath } from '../../domain/transcription/derived-path';
import { decideTranscription } from '../../domain/transcription/skip-rule';
import { Transcription } from '../../domain/transcription/transcription';
import {
  AudioExtractionFailedError,
  TranscriptionAlreadyRunningError,
  TranscriptionNotConfiguredError,
  WhisperFailedError,
} from '../../domain/transcription/transcription.errors';
import { TRANSCRIPT_REPOSITORY } from '../../domain/transcription/transcript.repository';
import { TRANSCRIPTION_REPOSITORY } from '../../domain/transcription/transcription.repository';
import { WHISPER_ADAPTER } from '../../domain/transcription/whisper.port';

import { RunTranscriptionCommand } from './run-transcription.command';

import type { Course } from '../../domain/course/course';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { Lesson } from '../../domain/lesson/lesson';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { Library } from '../../domain/library/library';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { FfmpegAdapter } from '../../domain/scan/ffmpeg-adapter';
import type { TranscriptRepository } from '../../domain/transcription/transcript.repository';
import type { TranscriptionRepository } from '../../domain/transcription/transcription.repository';
import type { WhisperAdapter } from '../../domain/transcription/whisper.port';

/**
 * Wall-clock budget for decoding one video's audio. One hour: ffprobe's 30s is
 * right for reading a header and wrong by three orders of magnitude for
 * decoding a two-hour lecture on NAS-grade CPU.
 */
const AUDIO_EXTRACT_TIMEOUT_MS = 3_600_000;

/**
 * Minimum gap between two progress publishes for SKIPPED lessons. A resumed run
 * skips hundreds of lessons in a few milliseconds and there is no point in
 * telling the browser about each one; a transcribed or failed lesson always
 * publishes, because it took minutes and the operator is waiting for it.
 */
const SKIP_PROGRESS_INTERVAL_MS = 1000;

/**
 * `-l auto` makes whisper decide the language per file, which is only known
 * after it runs (#501) — `und`, the convention `Subtitle.fromFile` already
 * uses for a sidecar with no language suffix, is the WORKING bucket a
 * lesson's `.srt` is written to before that. It is also the fallback once
 * whisper has run, for whatever `resolveDetectedLanguage` does not trust:
 * nothing whisper prints, an unsupported language, or `mode: mock`, where no
 * detection line exists at all.
 */
function resolveLanguage(configured: string): string {
  return configured === 'auto' ? 'und' : configured;
}

/**
 * The scope pair, spread into every lifecycle event so the UI can say
 * "transcribing <course>" instead of implying a whole-library run. Empty for a
 * library-wide run — the two fields are set together or not at all.
 */
function scopeFields(
  transcription: Transcription,
): { scopeCourseId: string; scopeCourseName: string } | Record<string, never> {
  return transcription.scopeCourseId === undefined
    ? {}
    : {
        scopeCourseId: transcription.scopeCourseId,
        scopeCourseName: transcription.scopeCourseName ?? '',
      };
}

/** The machine-readable keys the contract documents for TranscriptionErrorDto. */
function failureCode(error: unknown): string {
  if (error instanceof WhisperFailedError) return 'whisper-failed';
  if (error instanceof AudioExtractionFailedError) return 'audio-extract-failed';
  return 'transcription-failed';
}

@CommandHandler(RunTranscriptionCommand)
export class RunTranscriptionHandler implements ICommandHandler<
  RunTranscriptionCommand,
  Transcription
> {
  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(TRANSCRIPTION_REPOSITORY) private readonly transcriptions: TranscriptionRepository,
    @Inject(TRANSCRIPT_REPOSITORY) private readonly transcripts: TranscriptRepository,
    @Inject(FFMPEG_ADAPTER) private readonly ffmpeg: FfmpegAdapter,
    @Inject(WHISPER_ADAPTER) private readonly whisper: WhisperAdapter,
    private readonly appConfig: AppConfig,
    private readonly centrifugo: CentrifugoService,
  ) {}

  async execute(command: RunTranscriptionCommand): Promise<Transcription> {
    // A scoped run only ever has a courseId; the library comes from the course.
    let scopeCourse: Course | undefined;
    let libraryId = command.libraryId;
    if (command.scope) {
      const course = await this.courseRepo.findById(command.scope.courseId);
      if (!course) throw new CourseNotFoundError(command.scope.courseId);
      scopeCourse = course;
      libraryId = course.libraryId;
    }
    // Unreachable via the two real call sites (TranscriptionsController always
    // passes libraryId; CoursesController always passes scope) — defensive only.
    if (!libraryId) throw new LibraryNotFoundError('');

    const library = await this.libraryRepo.findById(libraryId);
    if (!library) throw new LibraryNotFoundError(libraryId);

    // Refuse before persisting anything: a run with no model can only fail.
    if (!this.appConfig.transcription.configured) throw new TranscriptionNotConfiguredError();

    const running = await this.transcriptions.findRunningForLibrary(libraryId);
    if (running) throw new TranscriptionAlreadyRunningError(libraryId, running.id);

    // The total is known up front because the walk needs the lesson list anyway,
    // and a progress bar without a denominator is a spinner with extra steps.
    const lessons = await this.loadLessons(library.id, scopeCourse);

    const transcription = Transcription.start({
      id: nanoid(),
      libraryId: library.id,
      force: command.force,
      lessonsTotal: lessons.length,
      bootId: this.appConfig.bootId,
      ...(scopeCourse
        ? { scope: { courseId: scopeCourse.id, courseName: scopeCourse.title } }
        : {}),
    });
    await this.transcriptions.save(transcription);

    const channel = `scans:user:${command.actorUserId}`;
    void this.centrifugo.publish(channel, {
      kind: 'transcription-started',
      transcriptionId: transcription.id,
      libraryId: library.id,
      libraryName: library.name,
      at: new Date().toISOString(),
      lessonsTotal: transcription.lessonsTotal,
      ...scopeFields(transcription),
    });

    // Fire-and-forget so the event loop can flush the 202 before whisper starts.
    Promise.resolve()
      .then(() => this.walk(transcription, library, lessons, channel, command.language))
      .catch(() => {
        // walk() handles its own errors and persists the terminal state. This
        // catch is a belt-and-suspenders guard for a truly unexpected throw.
      });

    return transcription;
  }

  /**
   * The lessons this run will consider: one course's when scoped, otherwise the
   * whole library's, course by course. One query per course rather than one per
   * lesson; the catalog has no lessons-by-library port and adding one for a walk
   * that then spends hours in whisper would be optimising the wrong three
   * milliseconds.
   */
  private async loadLessons(libraryId: string, scopeCourse?: Course): Promise<Lesson[]> {
    if (scopeCourse) return [...(await this.lessonRepo.findByCourse(scopeCourse.id))];

    const courses = await this.courseRepo.findManyByLibrary(libraryId);
    const lessons: Lesson[] = [];
    for (const course of courses) {
      lessons.push(...(await this.lessonRepo.findByCourse(course.id)));
    }
    return lessons;
  }

  // ---------------------------------------------------------------------------
  // The walk — runs after the HTTP response has been sent.
  // ---------------------------------------------------------------------------

  private async walk(
    transcription: Transcription,
    library: Library,
    lessons: readonly Lesson[],
    channel: string,
    requestedLanguage?: string,
  ): Promise<void> {
    // What whisper is told (`auto` included) vs. what the transcript is filed
    // under — the two differ only for `auto`, which reports nothing back.
    const whisperLanguage = requestedLanguage ?? this.appConfig.transcription.language;
    const language = resolveLanguage(whisperLanguage);
    let cancelled = false;
    let lastSkipPublishedAt = 0;

    const publishProgress = (): void => {
      void this.centrifugo.publish(channel, {
        kind: 'transcription-progress',
        transcriptionId: transcription.id,
        libraryId: library.id,
        libraryName: library.name,
        at: new Date().toISOString(),
        lessonsTotal: transcription.lessonsTotal,
        lessonsSkipped: transcription.lessonsSkipped,
        lessonsTranscribed: transcription.lessonsTranscribed,
        lessonsFailed: transcription.lessonsFailed,
        ...scopeFields(transcription),
      });
    };

    try {
      // Auto mode has no single language to filter by up front — whisper
      // decides per lesson, so any language this lesson previously landed in
      // counts as "already done" (#501). An explicit language keeps the
      // narrower lookup: an existing `ru` transcript must not make a
      // `language: en` run skip a lesson it has never produced English for.
      const lessonIds = lessons.map((l) => l.id);
      const existing =
        whisperLanguage === 'auto'
          ? await this.transcripts.findAnyGeneratedForLessons(lessonIds)
          : await this.transcripts.findGeneratedForLessons(lessonIds, language);

      for (const lesson of lessons) {
        // Cancellation is cooperative and checked BETWEEN lessons: an in-flight
        // whisper child is allowed to finish rather than leaving a truncated file.
        if (await this.cancelRequested(transcription.id)) {
          cancelled = true;
          break;
        }

        const decision = decideTranscription({
          hasSidecarSubtitle: lesson.subtitles.length > 0,
          existing: existing.get(lesson.id) ?? null,
          // The lesson row is the catalog's record of the video's (mtime, size):
          // the same pair the scan uses for incremental detection. A video that
          // changed on disk becomes re-transcribable when the next scan notices,
          // which is also when everything else about it is refreshed.
          video: { mtime: lesson.mtime, size: lesson.sizeBytes },
          force: transcription.force,
        });

        if (decision === 'transcribe') {
          await this.transcribeLesson(transcription, library, lesson, language, whisperLanguage);
        } else {
          transcription.recordSkipped();
        }

        // Re-check before persisting: a cancel that landed while whisper was
        // running would otherwise be overwritten by this save and the walk would
        // never notice it. The counters for the lesson just finished are kept —
        // the terminal save below writes them with status=cancelled.
        if (await this.cancelRequested(transcription.id)) {
          cancelled = true;
          break;
        }

        if (decision === 'transcribe') {
          await this.transcriptions.save(transcription);
          publishProgress();
        } else if (Date.now() - lastSkipPublishedAt >= SKIP_PROGRESS_INTERVAL_MS) {
          await this.transcriptions.save(transcription);
          publishProgress();
          lastSkipPublishedAt = Date.now();
        }
      }

      if (cancelled) {
        transcription.cancel();
      } else {
        transcription.complete();
      }
    } catch {
      // Unexpected failure — transition to failed so the run is not stuck running.
      try {
        transcription.fail();
      } catch {
        // Already terminal (should not happen, but be safe).
      }
    } finally {
      void this.centrifugo.publish(channel, {
        kind: 'transcription-finished',
        transcriptionId: transcription.id,
        libraryId: library.id,
        libraryName: library.name,
        at: new Date().toISOString(),
        status: transcription.status,
        lessonsTotal: transcription.lessonsTotal,
        lessonsSkipped: transcription.lessonsSkipped,
        lessonsTranscribed: transcription.lessonsTranscribed,
        lessonsFailed: transcription.lessonsFailed,
        ...scopeFields(transcription),
      });

      await this.transcriptions.save(transcription).catch(() => {
        // Best-effort — nothing else we can do if the DB write fails here.
      });
    }
  }

  /** True when someone asked the run to stop (or it is no longer running at all). */
  private async cancelRequested(transcriptionId: string): Promise<boolean> {
    const fresh = await this.transcriptions.findById(transcriptionId);
    return fresh !== null && fresh.status !== 'running';
  }

  /**
   * One lesson: audio → whisper → cues → rows. Failures are recorded against the
   * lesson, and the temporary `.wav` is removed on both paths — it lives in the
   * container's temp directory rather than on a mounted volume, but a six-hour
   * run leaking one file per lesson would still fill it.
   */
  private async transcribeLesson(
    transcription: Transcription,
    library: Library,
    lesson: Lesson,
    language: string,
    whisperLanguage: string,
  ): Promise<void> {
    const audioPath = path.join(os.tmpdir(), `cs-transcribe-${nanoid()}.wav`);

    try {
      // videoPath is stored library-relative in principle and absolute in
      // practice (the scan records what it walked). Resolving and then relativising
      // normalises both forms; a path that escapes the root comes back starting
      // with '..' and derivedTranscriptPath refuses it.
      const absoluteVideoPath = path.resolve(library.rootPath, lesson.videoPath);
      const relativeVideoPath = path.relative(library.rootPath, absoluteVideoPath);

      const srtPath = derivedTranscriptPath({
        derivedRoot: this.appConfig.derivedPath,
        libraryId: library.id,
        videoPath: relativeVideoPath,
        language,
      });
      // whisper.cpp appends `.srt` to `-of` itself.
      const outBase = srtPath.slice(0, -'.srt'.length);

      await mkdir(path.dirname(srtPath), { recursive: true });

      await this.ffmpeg.extractAudio({
        videoAbsolutePath: absoluteVideoPath,
        outAbsolutePath: audioPath,
        timeoutMs: AUDIO_EXTRACT_TIMEOUT_MS,
      });

      const { srtAbsolutePath, detectedLanguage } = await this.whisper.transcribe({
        audioAbsolutePath: audioPath,
        outBaseAbsolutePath: outBase,
        language: whisperLanguage,
      });

      // `language` is the WORKING bucket the file was just written under
      // (always `und` for auto mode, since detection only happens inside the
      // call above). The FINAL language — what gets persisted and what
      // LessonFileLocator will expect the file to be named — is only known
      // now. Fall back to the deployment's own configured language, not to
      // `language`: an explicit per-request `auto` override on a
      // non-auto-default deployment should still fail toward that default.
      const finalLanguage =
        whisperLanguage === 'auto'
          ? resolveDetectedLanguage(
              detectedLanguage,
              resolveLanguage(this.appConfig.transcription.language),
            )
          : language;

      // LessonFileLocator recomputes this path from the DB's `language`
      // column rather than trusting a stored path — so the file must
      // actually live where that recomputation expects it.
      let finalSrtPath = srtAbsolutePath;
      if (finalLanguage !== language) {
        finalSrtPath = derivedTranscriptPath({
          derivedRoot: this.appConfig.derivedPath,
          libraryId: library.id,
          videoPath: relativeVideoPath,
          language: finalLanguage,
        });
        await rename(srtAbsolutePath, finalSrtPath);
      }

      const srt = await readFile(finalSrtPath, 'utf8');
      const cues = extractCues(convertSrtToVtt(srt));

      await this.transcripts.replaceGenerated({
        lessonId: lesson.id,
        language: finalLanguage,
        sourcePath: relativeVideoPath,
        sourceMtime: lesson.mtime,
        sourceSize: lesson.sizeBytes,
        derivedPath: finalSrtPath,
        cues,
      });

      transcription.recordTranscribed();
    } catch (error) {
      transcription.recordFailure({
        lessonId: lesson.id,
        message: error instanceof Error ? error.message : String(error),
        code: failureCode(error),
      });
    } finally {
      await rm(audioPath, { force: true }).catch(() => {
        // The temp file may never have been created; either way, nothing to do.
      });
    }
  }
}
