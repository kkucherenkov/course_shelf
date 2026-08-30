/**
 * WHY this file exists:
 * Prisma adapter for the TranscriptRepository port — the only place that knows
 * about the `transcript` / `transcript_cue` tables.
 *
 * `replaceGenerated` deletes by the (lessonId, language) unique key rather than
 * upserting: cues belong to the transcript row and cascade with it, so deleting
 * first is how the old cue set goes away. Both statements share one transaction,
 * because a transcript row without its cues would be read back as "current" by
 * the next run's skip rule and never repaired.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type {
  GeneratedTranscriptSignature,
  ReplaceGeneratedInput,
  TranscriptRepository,
} from '../domain/transcription/transcript.repository';

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
    await this.prisma.$transaction(async (tx) => {
      await tx.transcript.deleteMany({
        where: { lessonId: input.lessonId, language: input.language },
      });

      await tx.transcript.create({
        data: {
          lessonId: input.lessonId,
          language: input.language,
          origin: 'generated',
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
