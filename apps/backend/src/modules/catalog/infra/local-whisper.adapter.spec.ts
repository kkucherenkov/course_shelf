/**
 * Unit tests for LocalWhisperAdapter.
 *
 * The whisper binary is never executed — child_process.execFile is mocked,
 * exactly as in local-ffmpeg.adapter.spec.ts. There is deliberately no
 * integration counterpart: a real run needs a multi-hundred-MB ggml model.
 *
 * Scenarios covered:
 *   1. Exact argv: model, input, threads, language, SRT output base.
 *   2. An explicit language is passed through instead of 'auto'.
 *   3. Non-zero exit → WhisperFailedError.
 *   4. Timeout (execFile kills the child) → WhisperFailedError.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Hoisted by Vitest above every import, so the mock is installed before the
// adapter module binds node:child_process.
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// Imported AFTER the mock declaration so the binding resolves to the mock.
import { execFile } from 'node:child_process';

import { WhisperFailedError } from '../domain/transcription/transcription.errors';
import { LocalWhisperAdapter } from './local-whisper.adapter';

import type { AppConfig, TranscriptionConfig } from '../../../common/config/app-config';

type ExecFileCb = (error: Error | null, stdout: string, stderr: string) => void;

function mockResolve(): void {
  vi.mocked(execFile).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper mock
    (...args: any[]) => {
      (args.at(-1) as ExecFileCb)(null, '', '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    },
  );
}

function mockReject(message: string): void {
  vi.mocked(execFile).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper mock
    (...args: any[]) => {
      (args.at(-1) as ExecFileCb)(new Error(message), '', '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    },
  );
}

function makeAppConfig(overrides: Partial<TranscriptionConfig> = {}): AppConfig {
  const transcription: TranscriptionConfig = {
    whisperPath: 'whisper-cli',
    modelPath: '/models/ggml-base.bin',
    timeoutMs: 21_600_000,
    threads: 4,
    language: 'auto',
    configured: true,
    ...overrides,
  };
  return { transcription } as unknown as AppConfig;
}

describe('LocalWhisperAdapter', () => {
  beforeEach(() => {
    vi.mocked(execFile).mockReset();
  });

  it('invokes the configured binary with model, input, threads, language and SRT output', async () => {
    mockResolve();
    const adapter = new LocalWhisperAdapter(makeAppConfig());

    const result = await adapter.transcribe({
      audioAbsolutePath: '/tmp/a.wav',
      outBaseAbsolutePath: '/data/derived/lib-1/a.mp4.en',
    });

    expect(result.srtAbsolutePath).toBe('/data/derived/lib-1/a.mp4.en.srt');

    const call = vi.mocked(execFile).mock.calls[0];
    expect(call?.[0]).toBe('whisper-cli');
    expect(call?.[1]).toEqual([
      '-m',
      '/models/ggml-base.bin',
      '-f',
      '/tmp/a.wav',
      '-t',
      '4',
      '-l',
      'auto',
      '-osrt',
      '-of',
      '/data/derived/lib-1/a.mp4.en',
    ]);
    // Six hours, not the 30s that is right for ffprobe.
    expect(call?.[2]).toEqual({ timeout: 21_600_000 });
  });

  it('passes an explicit language through instead of auto', async () => {
    mockResolve();
    const adapter = new LocalWhisperAdapter(makeAppConfig({ language: 'ru', threads: 2 }));

    await adapter.transcribe({
      audioAbsolutePath: '/tmp/a.wav',
      outBaseAbsolutePath: '/out/a',
    });

    const args = vi.mocked(execFile).mock.calls[0]?.[1] as string[];
    expect(args.slice(args.indexOf('-l'), args.indexOf('-l') + 2)).toEqual(['-l', 'ru']);
    expect(args.slice(args.indexOf('-t'), args.indexOf('-t') + 2)).toEqual(['-t', '2']);
  });

  it('raises WhisperFailedError when the process exits non-zero', async () => {
    mockReject('Command failed: whisper-cli');
    const adapter = new LocalWhisperAdapter(makeAppConfig());

    await expect(
      adapter.transcribe({ audioAbsolutePath: '/tmp/a.wav', outBaseAbsolutePath: '/out/a' }),
    ).rejects.toBeInstanceOf(WhisperFailedError);
  });

  it('raises WhisperFailedError when the timeout elapses', async () => {
    // execFile reports a timeout by killing the child and calling back with an error.
    mockReject('spawn ETIMEDOUT');
    const adapter = new LocalWhisperAdapter(makeAppConfig());

    await expect(
      adapter.transcribe({ audioAbsolutePath: '/tmp/a.wav', outBaseAbsolutePath: '/out/a' }),
    ).rejects.toMatchObject({ code: 'whisper-failed' });
  });
});
