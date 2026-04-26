/**
 * Unit tests for LocalFfmpegAdapter.
 *
 * All child_process.execFile calls are mocked — no real ffprobe/ffmpeg binaries
 * are needed. The integration test (local-ffmpeg.adapter.integration.spec.ts)
 * covers the real binary path.
 *
 * Scenarios covered:
 *   1. Happy probe: realistic ffprobe JSON → correct VideoMetadata values.
 *      The fixture exercises both `streams[0].duration` (preferred) and
 *      `format.duration` (fallback) paths via two sub-cases.
 *   2. Missing video stream → FfmpegProbeError.
 *   3. Non-zero exit from ffprobe → FfmpegProbeError.
 *   4. Malformed JSON from ffprobe → FfmpegProbeError.
 *   5. Happy thumbnail: exact execFile args asserted.
 *   6. Non-zero exit from ffmpeg → FfmpegThumbnailError.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// vi.mock is hoisted to the top of the file by Vitest, so the mock is installed
// before any module that imports node:child_process is evaluated.
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// Import AFTER the mock declaration so the binding resolves to the mock.
import { execFile } from 'node:child_process';

import { FfmpegProbeError, FfmpegThumbnailError } from '../domain/scan/scan.errors';
import { LocalFfmpegAdapter } from './local-ffmpeg.adapter';

import type { AppConfig } from '../../../common/config/app-config';

// ---------------------------------------------------------------------------
// Mock helpers
//
// execFile is the callback-style function. promisify wraps it at call time
// (see local-ffmpeg.adapter.ts — promisify is called inside execFileAsync
// each invocation so the mock is picked up fresh every time).
// We mock the callback variant: execFile(cmd, args, opts, cb).
// ---------------------------------------------------------------------------

type ExecFileCb = (error: Error | null, stdout: string, stderr: string) => void;

function mockResolve(stdout: string): void {
  vi.mocked(execFile).mockImplementation(
    // execFileAsync calls execFile(cmd, args, opts, callback).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper mock
    (...args: any[]) => {
      const cb = args.at(-1) as ExecFileCb;
      cb(null, stdout, '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    },
  );
}

function mockReject(message: string): void {
  vi.mocked(execFile).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper mock
    (...args: any[]) => {
      const cb = args.at(-1) as ExecFileCb;
      cb(new Error(message), '', '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    },
  );
}

// ---------------------------------------------------------------------------
// Fixture ffprobe JSON strings
// ---------------------------------------------------------------------------

/** Realistic ffprobe output with duration on the video stream (preferred path). */
const FFPROBE_STREAM_DURATION = JSON.stringify({
  streams: [
    {
      codec_type: 'video',
      codec_name: 'h264',
      width: 1920,
      height: 1080,
      duration: '120.500000',
    },
  ],
  format: {
    duration: '120.500000',
  },
});

/**
 * ffprobe output where duration is only on format, not the stream.
 * Tests the fallback branch (videoStream.duration === undefined).
 */
const FFPROBE_FORMAT_DURATION_FALLBACK = JSON.stringify({
  streams: [
    {
      codec_type: 'video',
      codec_name: 'h264',
      width: 1280,
      height: 720,
      // no duration field on stream
    },
  ],
  format: {
    duration: '60.000000',
  },
});

/** ffprobe output with no video stream (only audio). */
const FFPROBE_NO_VIDEO_STREAM = JSON.stringify({
  streams: [
    {
      codec_type: 'audio',
      codec_name: 'aac',
    },
  ],
  format: { duration: '300' },
});

// ---------------------------------------------------------------------------
// Fake AppConfig
// ---------------------------------------------------------------------------

function makeAppConfig(overrides?: {
  ffprobePath?: string;
  ffmpegPath?: string;
  thumbnailJpegQuality?: number;
}): AppConfig {
  return {
    ffprobePath: overrides?.ffprobePath ?? 'ffprobe',
    ffmpegPath: overrides?.ffmpegPath ?? 'ffmpeg',
    thumbnailJpegQuality: overrides?.thumbnailJpegQuality ?? 30,
  } as unknown as AppConfig;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LocalFfmpegAdapter', () => {
  let adapter: LocalFfmpegAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new LocalFfmpegAdapter(makeAppConfig());
  });

  // -------------------------------------------------------------------------
  // 1. Happy probe — stream-level duration
  // -------------------------------------------------------------------------
  describe('probe()', () => {
    it('parses metadata from ffprobe JSON (stream duration preferred)', async () => {
      mockResolve(FFPROBE_STREAM_DURATION);

      const meta = await adapter.probe('/videos/lesson.mp4');

      expect(meta.durationSeconds).toBeCloseTo(120.5);
      expect(meta.widthPx).toBe(1920);
      expect(meta.heightPx).toBe(1080);
      expect(meta.codec).toBe('h264');
    });

    it('falls back to format.duration when stream has no duration field', async () => {
      mockResolve(FFPROBE_FORMAT_DURATION_FALLBACK);

      const meta = await adapter.probe('/videos/lesson.mp4');

      expect(meta.durationSeconds).toBeCloseTo(60);
      expect(meta.widthPx).toBe(1280);
      expect(meta.heightPx).toBe(720);
      expect(meta.codec).toBe('h264');
    });

    // -----------------------------------------------------------------------
    // 2. Missing video stream → FfmpegProbeError
    // -----------------------------------------------------------------------
    it('throws FfmpegProbeError when no video stream is present', async () => {
      mockResolve(FFPROBE_NO_VIDEO_STREAM);

      await expect(adapter.probe('/videos/audio-only.mp3')).rejects.toBeInstanceOf(
        FfmpegProbeError,
      );
    });

    // -----------------------------------------------------------------------
    // 3. Non-zero exit → FfmpegProbeError
    // -----------------------------------------------------------------------
    it('throws FfmpegProbeError when execFile rejects (non-zero exit)', async () => {
      mockReject('Command failed: ffprobe exited with code 1');

      await expect(adapter.probe('/videos/bad.mp4')).rejects.toBeInstanceOf(FfmpegProbeError);
    });

    // -----------------------------------------------------------------------
    // 4. Malformed JSON → FfmpegProbeError
    // -----------------------------------------------------------------------
    it('throws FfmpegProbeError when ffprobe stdout is not valid JSON', async () => {
      mockResolve('not json at all {{{');

      await expect(adapter.probe('/videos/lesson.mp4')).rejects.toBeInstanceOf(FfmpegProbeError);
    });

    it('passes correct ffprobe args (no shell)', async () => {
      mockResolve(FFPROBE_STREAM_DURATION);

      await adapter.probe('/videos/lesson.mp4');

      const calls = vi.mocked(execFile).mock.calls;
      expect(calls).toHaveLength(1);
      const [cmd, args] = calls[0]!;
      expect(cmd).toBe('ffprobe');
      expect(args).toEqual([
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        '/videos/lesson.mp4',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Happy thumbnail — exact args asserted
  // -------------------------------------------------------------------------
  describe('writeThumbnail()', () => {
    it('passes the exact expected args to execFile', async () => {
      mockResolve('');

      await adapter.writeThumbnail({
        videoAbsolutePath: '/videos/lesson.mp4',
        outAbsolutePath: '/videos/lesson.thumb.jpg',
        atSecond: 30,
        widthPx: 320,
        heightPx: 180,
        jpegQuality: 30,
      });

      const calls = vi.mocked(execFile).mock.calls;
      expect(calls).toHaveLength(1);
      const [cmd, args] = calls[0]!;
      expect(cmd).toBe('ffmpeg');
      expect(args).toEqual([
        '-ss',
        '30',
        '-i',
        '/videos/lesson.mp4',
        '-frames:v',
        '1',
        '-vf',
        'scale=320:180',
        '-q:v',
        '30',
        '-y',
        '/videos/lesson.thumb.jpg',
      ]);
    });

    // -----------------------------------------------------------------------
    // 6. Non-zero exit → FfmpegThumbnailError
    // -----------------------------------------------------------------------
    it('throws FfmpegThumbnailError when execFile rejects (non-zero exit)', async () => {
      mockReject('Command failed: ffmpeg exited with code 1');

      await expect(
        adapter.writeThumbnail({
          videoAbsolutePath: '/videos/lesson.mp4',
          outAbsolutePath: '/videos/lesson.thumb.jpg',
          atSecond: 30,
          widthPx: 320,
          heightPx: 180,
          jpegQuality: 30,
        }),
      ).rejects.toBeInstanceOf(FfmpegThumbnailError);
    });

    it('uses custom binary paths from AppConfig', async () => {
      mockResolve('');
      const customAdapter = new LocalFfmpegAdapter(
        makeAppConfig({ ffmpegPath: '/usr/local/bin/ffmpeg' }),
      );

      await customAdapter.writeThumbnail({
        videoAbsolutePath: '/v/l.mp4',
        outAbsolutePath: '/v/l.thumb.jpg',
        atSecond: 10,
        widthPx: 320,
        heightPx: 180,
        jpegQuality: 30,
      });

      const [cmd] = vi.mocked(execFile).mock.calls[0]!;
      expect(cmd).toBe('/usr/local/bin/ffmpeg');
    });
  });
});
