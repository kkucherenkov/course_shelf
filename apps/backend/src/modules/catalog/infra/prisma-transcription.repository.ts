/**
 * WHY this file exists:
 * Prisma adapter for the TranscriptionRepository port — the only place in the
 * Catalog context that knows about the `transcription` / `transcription_error`
 * tables.
 *
 * Save strategy mirrors PrismaScanRepository: upsert the run row, then
 * delete-and-recreate its error records inside one transaction. The aggregate
 * holds every error in memory for the life of the run, so recreating them is
 * both correct and simpler than diffing.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Transcription } from '../domain/transcription/transcription';

import type { TranscriptionRepository } from '../domain/transcription/transcription.repository';
import type {
  TranscriptionId,
  TranscriptionStatusValue,
} from '../domain/transcription/transcription';

/** Column set every read shares — the aggregate needs all of it, and nothing more. */
const TRANSCRIPTION_SELECT = {
  id: true,
  libraryId: true,
  status: true,
  force: true,
  startedAt: true,
  finishedAt: true,
  lessonsTotal: true,
  lessonsSkipped: true,
  lessonsTranscribed: true,
  lessonsFailed: true,
  errors: { select: { lessonId: true, message: true, code: true } },
} as const;

interface TranscriptionRow {
  id: string;
  libraryId: string;
  status: string;
  force: boolean;
  startedAt: Date;
  finishedAt: Date | null;
  lessonsTotal: number;
  lessonsSkipped: number;
  lessonsTranscribed: number;
  lessonsFailed: number;
  errors: { lessonId: string; message: string; code: string | null }[];
}

@Injectable()
export class PrismaTranscriptionRepository implements TranscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(transcription: Transcription): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.transcription.upsert({
        where: { id: transcription.id },
        create: {
          id: transcription.id,
          libraryId: transcription.libraryId,
          status: transcription.status,
          force: transcription.force,
          startedAt: transcription.startedAt,
          finishedAt: transcription.finishedAt ?? null,
          lessonsTotal: transcription.lessonsTotal,
          lessonsSkipped: transcription.lessonsSkipped,
          lessonsTranscribed: transcription.lessonsTranscribed,
          lessonsFailed: transcription.lessonsFailed,
        },
        update: {
          status: transcription.status,
          finishedAt: transcription.finishedAt ?? null,
          lessonsSkipped: transcription.lessonsSkipped,
          lessonsTranscribed: transcription.lessonsTranscribed,
          lessonsFailed: transcription.lessonsFailed,
        },
      });

      await tx.transcriptionErrorRecord.deleteMany({
        where: { transcriptionId: transcription.id },
      });
      if (transcription.errors.length > 0) {
        await tx.transcriptionErrorRecord.createMany({
          data: transcription.errors.map((e) => ({
            transcriptionId: transcription.id,
            lessonId: e.lessonId,
            message: e.message,
            code: e.code ?? null,
          })),
        });
      }
    });
  }

  async findById(id: string): Promise<Transcription | null> {
    const row = await this.prisma.transcription.findUnique({
      where: { id },
      select: TRANSCRIPTION_SELECT,
    });
    return row ? this.rowToAggregate(row) : null;
  }

  async findLatestForLibrary(libraryId: string): Promise<Transcription | null> {
    const row = await this.prisma.transcription.findFirst({
      where: { libraryId },
      orderBy: { startedAt: 'desc' },
      select: TRANSCRIPTION_SELECT,
    });
    return row ? this.rowToAggregate(row) : null;
  }

  async findRunningForLibrary(libraryId: string): Promise<Transcription | null> {
    const row = await this.prisma.transcription.findFirst({
      where: { libraryId, status: 'running' },
      select: TRANSCRIPTION_SELECT,
    });
    return row ? this.rowToAggregate(row) : null;
  }

  async listForLibrary(libraryId: string, limit: number): Promise<Transcription[]> {
    const rows = await this.prisma.transcription.findMany({
      where: { libraryId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      select: TRANSCRIPTION_SELECT,
    });
    return rows.map((row) => this.rowToAggregate(row));
  }

  // ---------------------------------------------------------------------------
  // Private mapper — row shape → domain aggregate
  // ---------------------------------------------------------------------------
  private rowToAggregate(row: TranscriptionRow): Transcription {
    return Transcription.reconstitute({
      id: row.id as TranscriptionId,
      libraryId: row.libraryId,
      status: row.status as TranscriptionStatusValue,
      force: row.force,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt ?? undefined,
      lessonsTotal: row.lessonsTotal,
      lessonsSkipped: row.lessonsSkipped,
      lessonsTranscribed: row.lessonsTranscribed,
      lessonsFailed: row.lessonsFailed,
      errors: row.errors.map((e) => ({
        lessonId: e.lessonId,
        message: e.message,
        ...(e.code === null ? {} : { code: e.code }),
      })),
    });
  }
}
