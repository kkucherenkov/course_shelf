/**
 * Unit tests for MockWhisperAdapter — no child process, no network, no
 * whisper.cpp: just a deterministic SRT written to disk and parsed back.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { convertSrtToVtt, extractCues } from '../../../shared/subtitle-converter';
import { MockWhisperAdapter } from './mock-whisper.adapter';

describe('MockWhisperAdapter', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'mock-whisper-'));
  });

  afterEach(async () => {
    await rm(dir, { force: true, recursive: true });
  });

  it('writes the SRT at outBaseAbsolutePath + .srt and returns that path', async () => {
    const adapter = new MockWhisperAdapter();
    const outBase = path.join(dir, 'lesson-1');

    const result = await adapter.transcribe({
      audioAbsolutePath: '/tmp/unused.wav',
      outBaseAbsolutePath: outBase,
    });

    expect(result.srtAbsolutePath).toBe(`${outBase}.srt`);
    await expect(readFile(result.srtAbsolutePath, 'utf8')).resolves.toContain('-->');
  });

  it('produces a deterministic two-cue transcript the real pipeline can parse', async () => {
    const adapter = new MockWhisperAdapter();
    const outBase = path.join(dir, 'lesson-2');

    const { srtAbsolutePath } = await adapter.transcribe({
      audioAbsolutePath: '/tmp/unused.wav',
      outBaseAbsolutePath: outBase,
    });

    const srt = await readFile(srtAbsolutePath, 'utf8');
    const cues = extractCues(convertSrtToVtt(srt));

    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({ startMs: 0, endMs: 2000 });
    expect(cues[1]).toMatchObject({ startMs: 2000, endMs: 4000 });
  });
});
