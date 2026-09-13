/**
 * WHY this file exists:
 * Deterministic, network-free WhisperAdapter used when WHISPER_MODE=mock
 * (CI). The seed library's one lesson has no media on disk (see
 * `seed-catalog.ts`), so a real whisper.cpp would never even be reached — a
 * contract run that shipped a ~75 MB ggml model would be paying for a binary
 * nothing executes. This adapter skips ffmpeg's audio and whisper's inference
 * entirely and writes a fixed two-cue SRT, so
 * `POST /libraries/{id}/transcriptions` exercises the full run — 202, the
 * walk, cue parsing, the transcript rows — without a model file anywhere.
 */
import { writeFile } from 'node:fs/promises';

import { Injectable } from '@nestjs/common';

import type {
  TranscribeRequest,
  TranscribeResult,
  WhisperAdapter,
} from '../domain/transcription/whisper.port';

const MOCK_SRT = `1
00:00:00,000 --> 00:00:02,000
Mock transcript line one.

2
00:00:02,000 --> 00:00:04,000
Mock transcript line two.
`;

@Injectable()
export class MockWhisperAdapter implements WhisperAdapter {
  async transcribe(req: TranscribeRequest): Promise<TranscribeResult> {
    const srtAbsolutePath = `${req.outBaseAbsolutePath}.srt`;
    await writeFile(srtAbsolutePath, MOCK_SRT, 'utf8');
    return { srtAbsolutePath };
  }
}
