/**
 * Unit tests for ingestSidecarTranscripts — the ports (FsAdapter,
 * TranscriptRepository) are hand-rolled fakes, no real I/O, no DI.
 */
import { describe, expect, it, vi } from 'vitest';

import { ingestSidecarTranscripts } from './sidecar-transcript-ingester';

import type { FsAdapter, FsEntry } from '../../domain/scan/fs-adapter';
import type {
  ExistingTranscriptSignature,
  ReplaceSidecarInput,
  TranscriptRepository,
} from '../../domain/transcription/transcript.repository';

function makeFs(files: Record<string, string>): FsAdapter {
  return {
    async *walk(): AsyncIterable<FsEntry> {
      // Not exercised by the ingester.
    },
    readUtf8: vi.fn(async (path: string) => {
      const content = files[path];
      if (content === undefined) throw new Error(`ENOENT: ${path}`);
      return content;
    }),
    statMtime: vi.fn(async () => null),
  };
}

function makeTranscripts(
  existing: Map<string, ExistingTranscriptSignature>,
): TranscriptRepository & { calls: ReplaceSidecarInput[] } {
  const calls: ReplaceSidecarInput[] = [];
  return {
    calls,
    findGeneratedForLessons: vi.fn(async () => new Map()),
    replaceGenerated: vi.fn(async () => undefined),
    findExisting: vi.fn(async (lessonId: string, language: string) => {
      return existing.get(`${lessonId}:${language}`) ?? null;
    }),
    replaceSidecar: vi.fn(async (input: ReplaceSidecarInput) => {
      calls.push(input);
      existing.set(`${input.lessonId}:${input.language}`, {
        origin: 'sidecar',
        sourceMtime: input.sourceMtime,
        sourceSize: input.sourceSize,
      });
    }),
    deleteForLesson: vi.fn(async () => undefined),
  };
}

const MTIME = new Date('2026-01-01T00:00:00.000Z');

describe('ingestSidecarTranscripts', () => {
  it('parses a new sidecar into a replaceSidecar call, keyed by language', async () => {
    const fs = makeFs({
      '/lib/Course/01.en.srt': '1\n00:00:00,000 --> 00:00:01,500\nHello\n',
    });
    const transcripts = makeTranscripts(new Map());

    const errors = await ingestSidecarTranscripts({
      fs,
      transcripts,
      lessonId: 'lesson-1',
      rootPath: '/lib',
      subtitles: [{ path: '/lib/Course/01.en.srt', language: 'en', mtime: MTIME, size: 10 }],
    });

    expect(errors).toHaveLength(0);
    expect(transcripts.calls).toEqual([
      {
        lessonId: 'lesson-1',
        language: 'en',
        sourcePath: 'Course/01.en.srt',
        sourceMtime: MTIME,
        sourceSize: 10,
        cues: [{ startMs: 0, endMs: 1500, text: 'Hello' }],
      },
    ]);
  });

  it('skips the read when the stored sidecar signature is unchanged', async () => {
    const fs = makeFs({}); // no content — readUtf8 would throw if ever called
    const existing = new Map<string, ExistingTranscriptSignature>([
      ['lesson-1:en', { origin: 'sidecar', sourceMtime: MTIME, sourceSize: 10 }],
    ]);
    const transcripts = makeTranscripts(existing);

    const errors = await ingestSidecarTranscripts({
      fs,
      transcripts,
      lessonId: 'lesson-1',
      rootPath: '/lib',
      subtitles: [{ path: '/lib/Course/01.en.srt', language: 'en', mtime: MTIME, size: 10 }],
    });

    expect(errors).toHaveLength(0);
    expect(fs.readUtf8).not.toHaveBeenCalled();
    expect(transcripts.replaceSidecar).not.toHaveBeenCalled();
  });

  it('re-parses when the stored signature is for a different (mtime, size)', async () => {
    const fs = makeFs({
      '/lib/Course/01.en.srt': '1\n00:00:00,000 --> 00:00:01,000\nUpdated\n',
    });
    const existing = new Map<string, ExistingTranscriptSignature>([
      ['lesson-1:en', { origin: 'sidecar', sourceMtime: new Date(0), sourceSize: 5 }],
    ]);
    const transcripts = makeTranscripts(existing);

    const errors = await ingestSidecarTranscripts({
      fs,
      transcripts,
      lessonId: 'lesson-1',
      rootPath: '/lib',
      subtitles: [{ path: '/lib/Course/01.en.srt', language: 'en', mtime: MTIME, size: 10 }],
    });

    expect(errors).toHaveLength(0);
    expect(transcripts.replaceSidecar).toHaveBeenCalledTimes(1);
  });

  it('always re-parses a signature that belongs to a generated transcript', async () => {
    // A generated transcript in the same language should not exist per the
    // skip rule (hasSidecarSubtitle short-circuits transcription), but the
    // ingester does not trust that invariant blindly — it re-parses rather
    // than silently treating a foreign origin as "unchanged".
    const fs = makeFs({ '/lib/Course/01.en.srt': '1\n00:00:00,000 --> 00:00:01,000\nHi\n' });
    const existing = new Map<string, ExistingTranscriptSignature>([
      ['lesson-1:en', { origin: 'generated', sourceMtime: MTIME, sourceSize: 10 }],
    ]);
    const transcripts = makeTranscripts(existing);

    await ingestSidecarTranscripts({
      fs,
      transcripts,
      lessonId: 'lesson-1',
      rootPath: '/lib',
      subtitles: [{ path: '/lib/Course/01.en.srt', language: 'en', mtime: MTIME, size: 10 }],
    });

    expect(transcripts.replaceSidecar).toHaveBeenCalledTimes(1);
  });

  it('a read failure is recorded as subtitle-sidecar-invalid and does not throw', async () => {
    const fs = makeFs({});
    const transcripts = makeTranscripts(new Map());

    const errors = await ingestSidecarTranscripts({
      fs,
      transcripts,
      lessonId: 'lesson-1',
      rootPath: '/lib',
      subtitles: [{ path: '/lib/Course/01.en.srt', language: 'en', mtime: MTIME, size: 10 }],
    });

    expect(errors).toEqual([
      expect.objectContaining({ path: 'Course/01.en.srt', code: 'subtitle-sidecar-invalid' }),
    ]);
    expect(transcripts.replaceSidecar).not.toHaveBeenCalled();
  });

  it('one malformed sidecar does not stop the others from ingesting', async () => {
    const fs = makeFs({
      '/lib/Course/01.ru.srt': '1\n00:00:00,000 --> 00:00:01,000\nПривет\n',
      // 01.en.srt has no content — will fail to read.
    });
    const transcripts = makeTranscripts(new Map());

    const errors = await ingestSidecarTranscripts({
      fs,
      transcripts,
      lessonId: 'lesson-1',
      rootPath: '/lib',
      subtitles: [
        { path: '/lib/Course/01.en.srt', language: 'en', mtime: MTIME, size: 10 },
        { path: '/lib/Course/01.ru.srt', language: 'ru', mtime: MTIME, size: 12 },
      ],
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('subtitle-sidecar-invalid');
    expect(transcripts.replaceSidecar).toHaveBeenCalledTimes(1);
    expect(transcripts.calls[0]?.language).toBe('ru');
  });

  it('dedupes same-language sidecars — .vtt wins, only one file is ingested', async () => {
    const fs = makeFs({
      '/lib/Course/01.en.srt': '1\n00:00:00,000 --> 00:00:01,000\nSRT\n',
      '/lib/Course/01.en.vtt': 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nVTT\n',
    });
    const transcripts = makeTranscripts(new Map());

    const errors = await ingestSidecarTranscripts({
      fs,
      transcripts,
      lessonId: 'lesson-1',
      rootPath: '/lib',
      subtitles: [
        { path: '/lib/Course/01.en.srt', language: 'en', mtime: MTIME, size: 10 },
        { path: '/lib/Course/01.en.vtt', language: 'en', mtime: MTIME, size: 12 },
      ],
    });

    expect(errors).toHaveLength(0);
    expect(transcripts.replaceSidecar).toHaveBeenCalledTimes(1);
    expect(transcripts.calls[0]?.sourcePath).toBe('Course/01.en.vtt');
    expect(transcripts.calls[0]?.cues).toEqual([{ startMs: 0, endMs: 1000, text: 'VTT' }]);
  });
});
