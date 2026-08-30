/**
 * WHY this file exists:
 * Orchestrates one transcription pass over a library, modelled on
 * `run-scan.handler.ts` down to the fire-and-forget shape:
 *   1. Verify the library exists.
 *   2. Refuse when no whisper model is configured — a run that can only fail is
 *      worse than no run.
 *   3. Refuse when a run is already going for this library.
 *   4. Persist a Transcription in status=running and RETURN it (202 Accepted).
 *   5. Fire-and-forget the walk so the response flushes before whisper starts.
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
import { mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';
import { AppConfig } from '../../../../common/config/app-config';
import { convertSrtToVtt, extractCues } from '../../../../shared/subtitle-converter';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { LibraryNotFoundError } from '../../domain/library/library.errors';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { FFMPEG_ADAPTER } from '../../domain/scan/ffmpeg-adapter';
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
 * `-l auto` lets whisper detect the language but gives us nothing to read the
 * detection back from, so an auto run is recorded as `und` — the convention
 * `Subtitle.fromFile` already uses for a sidecar with no language suffix. It
 * also keeps the string "auto" out of generated filenames.
 */
function resolveLanguage(configured: string): string {
  return configured === 'auto' ? 'und' : configured;
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
    const library = await this.libraryRepo.findById(command.libraryId);
    if (!library) throw new LibraryNotFoundError(command.libraryId);

    // Refuse before persisting anything: a run with no model can only fail.
    if (!this.appConfig.transcription.configured) throw new TranscriptionNotConfiguredError();

    const running = await this.transcriptions.findRunningForLibrary(command.libraryId);
    if (running) throw new TranscriptionAlreadyRunningError(command.libraryId);

    // The total is known up front because the walk needs the lesson list anyway,
    // and a progress bar without a denominator is a spinner with extra steps.
    const lessons = await this.loadLessons(library.id);

    const transcription = Transcription.start({
      id: nanoid(),
      libraryId: library.id,
      force: command.force,
      lessonsTotal: lessons.length,
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
    });

    // Fire-and-forget so the event loop can flush the 202 before whisper starts.
    Promise.resolve()
      .then(() => this.walk(transcription, library, lessons, channel))
      .catch(() => {
        // walk() handles its own errors and persists the terminal state. This
        // catch is a belt-and-suspenders guard for a truly unexpected throw.
      });

    return transcription;
  }

  /**
   * Every lesson in the library, course by course. One query per course rather
   * than one per lesson; the catalog has no lessons-by-library port and adding
   * one for a walk that then spends hours in whisper would be optimising the
   * wrong three milliseconds.
   */
  private async loadLessons(libraryId: string): Promise<Lesson[]> {
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
  ): Promise<void> {
    const language = resolveLanguage(this.appConfig.transcription.language);
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
      });
    };

    try {
      const existing = await this.transcripts.findGeneratedForLessons(
        lessons.map((l) => l.id),
        language,
      );

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
          await this.transcribeLesson(transcription, library, lesson, language);
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

      const { srtAbsolutePath } = await this.whisper.transcribe({
        audioAbsolutePath: audioPath,
        outBaseAbsolutePath: outBase,
      });

      const srt = await readFile(srtAbsolutePath, 'utf8');
      const cues = extractCues(convertSrtToVtt(srt));

      await this.transcripts.replaceGenerated({
        lessonId: lesson.id,
        language,
        sourcePath: relativeVideoPath,
        sourceMtime: lesson.mtime,
        sourceSize: lesson.sizeBytes,
        derivedPath: srtAbsolutePath,
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
