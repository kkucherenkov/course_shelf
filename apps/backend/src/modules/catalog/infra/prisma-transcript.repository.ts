/**
 * WHY this file exists:
 * Prisma adapter for the TranscriptRepository port — the only place that knows
 * about the `transcript` / `transcript_cue` tables.
 *
 * `replaceGenerated`/`replaceSidecar` delete by the (lessonId, language) unique
 * key rather than upserting: cues belong to the transcript row and cascade with
 * it, so deleting first is how the old cue set goes away. Both statements share
 * one transaction, because a transcript row without its cues would be read back
 * as "current" by the next walk's skip rule and never repaired. They share one
 * `replace` implementation — origin and `derivedPath` are the only things that
 * differ between a generated and a sidecar transcript.
 *
 * `deleteForLesson` unlinks each deleted row's `derivedPath` with plain
 * `node:fs/promises` rather than the `FsAdapter` port: it is infra-internal
 * cleanup of a file this adapter itself wrote the path for, not a scan-domain
 * concern that needs to be fakeable the way the walk's reads do.
 */
import { rename, unlink } from 'node:fs/promises';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type {
  AnyGeneratedTranscriptSignature,
  ExistingTranscriptSignature,
  GeneratedTranscriptByLanguage,
  GeneratedTranscriptSignature,
  LessonCues,
  ReclassifyGeneratedInput,
  ReplaceGeneratedInput,
  ReplaceSidecarInput,
  TranscriptOriginValue,
  TranscriptRepository,
} from '../domain/transcription/transcript.repository';
import type { SubtitleCue } from '../../../shared/subtitle-converter';

interface ReplaceRowInput {
  readonly lessonId: string;
  readonly language: string;
  readonly origin: TranscriptOriginValue;
  readonly sourcePath: string;
  readonly sourceMtime: Date;
  readonly sourceSize: number;
  readonly derivedPath: string | null;
  readonly cues: readonly SubtitleCue[];
}

@Injectable()
export class PrismaTranscriptRepository implements TranscriptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGeneratedForLessons(
    lessonIds: readonly string[],
    language: string,
  ): Promise<Map<string, GeneratedTranscriptSignature>> {
    if (lessonIds.length === 0) return new Map();

    const rows = await this.prisma.transcript.findMany({
      where: { lessonId: { in: [...lessonIds] }, language, origin: 'generated' },
      select: { lessonId: true, sourceMtime: true, sourceSize: true },
    });

    return new Map(
      rows.map((r) => [r.lessonId, { sourceMtime: r.sourceMtime, sourceSize: r.sourceSize }]),
    );
  }

  async findAnyGeneratedForLessons(
    lessonIds: readonly string[],
  ): Promise<Map<string, AnyGeneratedTranscriptSignature>> {
    if (lessonIds.length === 0) return new Map();

    const rows = await this.prisma.transcript.findMany({
      where: { lessonId: { in: [...lessonIds] }, origin: 'generated' },
      select: { lessonId: true, language: true, sourceMtime: true, sourceSize: true },
      orderBy: { createdAt: 'desc' },
    });

    // A lesson can have more than one generated row (an explicit-language run
    // and a later auto run both touched it) — rows arrive newest first, so
    // the first one seen per lessonId is the one a resumed run would
    // reproduce, and every later duplicate for the same lesson is dropped.
    const result = new Map<string, AnyGeneratedTranscriptSignature>();
    for (const r of rows) {
      if (!result.has(r.lessonId)) {
        result.set(r.lessonId, {
          language: r.language,
          sourceMtime: r.sourceMtime,
          sourceSize: r.sourceSize,
        });
      }
    }
    return result;
  }

  async replaceGenerated(input: ReplaceGeneratedInput): Promise<void> {
    await this.replace({ ...input, origin: 'generated', derivedPath: input.derivedPath });
  }

  async findExisting(
    lessonId: string,
    language: string,
  ): Promise<ExistingTranscriptSignature | null> {
    const row = await this.prisma.transcript.findUnique({
      where: { uq_transcript_lesson_language: { lessonId, language } },
      select: { origin: true, sourceMtime: true, sourceSize: true },
    });
    return row === null
      ? null
      : { origin: row.origin, sourceMtime: row.sourceMtime, sourceSize: row.sourceSize };
  }

  async replaceSidecar(input: ReplaceSidecarInput): Promise<void> {
    await this.replace({ ...input, origin: 'sidecar', derivedPath: null });
  }

  async deleteForLesson(lessonId: string): Promise<void> {
    const rows = await this.prisma.transcript.findMany({
      where: { lessonId },
      select: { derivedPath: true },
    });
    if (rows.length === 0) return;

    await this.prisma.transcript.deleteMany({ where: { lessonId } });

    await Promise.all(
      rows
        .filter((r): r is { derivedPath: string } => r.derivedPath !== null)
        .map((r) =>
          unlink(r.derivedPath).catch(() => {
            // Best-effort: the file may already be gone, or the derived volume
            // may be temporarily unavailable. The DB row is already deleted —
            // that is the source of truth the rest of the app reads.
          }),
        ),
    );
  }

  async findGeneratedByLanguage(language: string): Promise<GeneratedTranscriptByLanguage[]> {
    const rows = await this.prisma.transcript.findMany({
      where: { origin: 'generated', language, derivedPath: { not: null } },
      include: { cues: { select: { text: true }, orderBy: { startMs: 'asc' } } },
    });
    if (rows.length === 0) return [];

    // No FK from Transcript to Lesson (see the file header) — resolve
    // libraryId via two flat batch queries instead of a relation include.
    const lessonIds = [...new Set(rows.map((r) => r.lessonId))];
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, courseId: true },
    });
    const courseIdByLessonId = new Map(lessons.map((l) => [l.id, l.courseId]));

    const courseIds = [...new Set(lessons.map((l) => l.courseId))];
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, libraryId: true },
    });
    const libraryIdByCourseId = new Map(courses.map((c) => [c.id, c.libraryId]));

    const result: GeneratedTranscriptByLanguage[] = [];
    for (const row of rows) {
      const courseId = courseIdByLessonId.get(row.lessonId);
      const libraryId = courseId === undefined ? undefined : libraryIdByCourseId.get(courseId);
      // Defensive — a transcript whose lesson (or course) vanished out from
      // under it is an orphan the scan's own cleanup should have caught;
      // skip rather than crash the whole backfill run over one bad row.
      if (libraryId === undefined || row.derivedPath === null) continue;

      result.push({
        transcriptId: row.id,
        libraryId,
        sourcePath: row.sourcePath,
        derivedPath: row.derivedPath,
        cueText: row.cues.map((c) => c.text).join(' '),
      });
    }
    return result;
  }

  async reclassifyGenerated(input: ReclassifyGeneratedInput): Promise<void> {
    // Disk first — a crash here leaves the DB still pointing at the file
    // that actually exists. Updating the row first and crashing before the
    // rename would leave LessonFileLocator recomputing a path for a file
    // that was never moved there (#529).
    await rename(input.oldDerivedPath, input.newDerivedPath);
    await this.prisma.transcript.update({
      where: { id: input.transcriptId },
      data: { language: input.newLanguage, derivedPath: input.newDerivedPath },
    });
  }

  async findCuesForLesson(lessonId: string): Promise<LessonCues | null> {
    const row = await this.prisma.transcript.findFirst({
      where: { lessonId },
      orderBy: { createdAt: 'desc' },
      select: {
        language: true,
        cues: { select: { startMs: true, endMs: true, text: true }, orderBy: { startMs: 'asc' } },
      },
    });
    return row === null ? null : { language: row.language, cues: row.cues };
  }

  async findCuesForLessons(lessonIds: readonly string[]): Promise<Map<string, LessonCues>> {
    if (lessonIds.length === 0) return new Map();
    // `distinct: ['lessonId']` + orderBy leading with the distinct field is
    // Prisma's DISTINCT ON — one query picks each lesson's most recently
    // created transcript row, same "latest wins" rule as findCuesForLesson.
    const rows = await this.prisma.transcript.findMany({
      where: { lessonId: { in: [...lessonIds] } },
      distinct: ['lessonId'],
      orderBy: [{ lessonId: 'asc' }, { createdAt: 'desc' }],
      select: {
        lessonId: true,
        language: true,
        cues: { select: { startMs: true, endMs: true, text: true }, orderBy: { startMs: 'asc' } },
      },
    });
    return new Map(rows.map((row) => [row.lessonId, { language: row.language, cues: row.cues }]));
  }

  async cueBelongsToLesson(cueId: string, lessonId: string): Promise<boolean> {
    const row = await this.prisma.transcriptCue.findFirst({
      where: { id: cueId, transcript: { lessonId } },
      select: { id: true },
    });
    return row !== null;
  }

  private async replace(input: ReplaceRowInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.transcript.deleteMany({
        where: { lessonId: input.lessonId, language: input.language },
      });

      await tx.transcript.create({
        data: {
          lessonId: input.lessonId,
          language: input.language,
          origin: input.origin,
          sourcePath: input.sourcePath,
          sourceMtime: input.sourceMtime,
          sourceSize: input.sourceSize,
          derivedPath: input.derivedPath,
          cues: {
            createMany: {
              data: input.cues.map((c) => ({
                startMs: c.startMs,
                endMs: c.endMs,
                text: c.text,
              })),
            },
          },
        },
      });
    });
  }
}
