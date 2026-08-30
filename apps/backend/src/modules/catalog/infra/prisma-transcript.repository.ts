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
import { unlink } from 'node:fs/promises';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type {
  ExistingTranscriptSignature,
  GeneratedTranscriptSignature,
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
