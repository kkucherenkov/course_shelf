/**
 * WHY this file exists:
 * Centralises the Transcription aggregate → TranscriptionDto wire mapping so the
 * controller and every query handler share one shape. Mirrors `scans.dto.ts`.
 *
 * The output type comes from the generated @app/api-client-ts package, so a
 * contract change breaks the build here rather than at runtime.
 */
import type { Transcription } from './domain/transcription/transcription';
import type { TranscriptionDto } from '@app/api-client-ts';

export function toTranscriptionDto(transcription: Transcription): TranscriptionDto {
  return {
    id: transcription.id,
    libraryId: transcription.libraryId,
    status: transcription.status,
    force: transcription.force,
    startedAt: transcription.startedAt.toISOString(),
    ...(transcription.finishedAt === undefined
      ? {}
      : { finishedAt: transcription.finishedAt.toISOString() }),
    lessonsTotal: transcription.lessonsTotal,
    lessonsSkipped: transcription.lessonsSkipped,
    lessonsTranscribed: transcription.lessonsTranscribed,
    lessonsFailed: transcription.lessonsFailed,
    errors: transcription.errors.map((e) => ({
      lessonId: e.lessonId,
      message: e.message,
      ...(e.code === undefined ? {} : { code: e.code }),
    })),
  };
}
