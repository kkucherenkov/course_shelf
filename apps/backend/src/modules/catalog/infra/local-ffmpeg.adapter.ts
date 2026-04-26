/**
 * WHY this file exists:
 * Concrete FfmpegAdapter backed by child_process.execFile shell-outs to
 * ffprobe and ffmpeg. Used in production; replaced by a fake in unit tests.
 *
 * Deviation from story card (E06-F02-S02):
 *   The card mentioned `fluent-ffmpeg`, but a thin execFile wrapper is simpler,
 *   avoids the dep + @types fight, and keeps the interface surface minimal.
 *   Documented in the commit message per the active task spec.
 *
 * Both calls have a 30s wall-clock timeout enforced by execFile's { timeout }
 * option. On non-zero exit or timeout, the respective DomainError subclass is
 * thrown so the scan handler can record a ScanError and continue.
 *
 * Binary paths are read from AppConfig (FFPROBE_PATH / FFMPEG_PATH env vars),
 * defaulting to 'ffprobe' and 'ffmpeg' (resolved via PATH at runtime).
 */
import { execFile } from 'node:child_process';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import { FfmpegProbeError, FfmpegThumbnailError } from '../domain/scan/scan.errors';

import type { FfmpegAdapter, ThumbnailRequest, VideoMetadata } from '../domain/scan/ffmpeg-adapter';

/**
 * Manual promise wrapper around execFile.
 * Using `promisify` at module level would capture the original reference before
 * vi.mock() installs the test double. Calling execFile inline here uses the
 * live ES module binding which resolves to the mock during unit tests.
 */
function execFileAsync(
  cmd: string,
  args: string[],
  opts: { timeout: number },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (execError, stdout, stderr) => {
      if (execError) {
        reject(new Error(execError.message, { cause: execError }));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/** Raw shape we care about from ffprobe JSON output. */
interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
}

interface FfprobeOutput {
  format?: { duration?: string };
  streams?: FfprobeStream[];
}

@Injectable()
export class LocalFfmpegAdapter implements FfmpegAdapter {
  constructor(private readonly appConfig: AppConfig) {}

  async probe(absolutePath: string): Promise<VideoMetadata> {
    const ffprobePath = this.appConfig.ffprobePath;
    const args = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      absolutePath,
    ];

    let stdout: string;
    try {
      const result = await execFileAsync(ffprobePath, args, { timeout: 30_000 });
      stdout = result.stdout;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new FfmpegProbeError(absolutePath, msg);
    }

    let parsed: FfprobeOutput;
    try {
      parsed = JSON.parse(stdout) as FfprobeOutput;
    } catch {
      throw new FfmpegProbeError(absolutePath, 'ffprobe output is not valid JSON');
    }

    const videoStream = parsed.streams?.find((s) => s.codec_type === 'video');
    if (!videoStream) {
      throw new FfmpegProbeError(absolutePath, 'no video stream found in ffprobe output');
    }

    // Duration: prefer stream-level, fall back to format-level.
    const rawDuration = videoStream.duration ?? parsed.format?.duration;
    if (rawDuration === undefined) {
      throw new FfmpegProbeError(absolutePath, 'duration not found in ffprobe output');
    }
    const durationSeconds = Number.parseFloat(rawDuration);
    if (!Number.isFinite(durationSeconds)) {
      throw new FfmpegProbeError(
        absolutePath,
        `duration value is not a finite number: "${rawDuration}"`,
      );
    }

    if (videoStream.width === undefined || videoStream.height === undefined) {
      throw new FfmpegProbeError(absolutePath, 'width/height missing from ffprobe video stream');
    }

    if (!videoStream.codec_name) {
      throw new FfmpegProbeError(absolutePath, 'codec_name missing from ffprobe video stream');
    }

    return {
      durationSeconds,
      widthPx: videoStream.width,
      heightPx: videoStream.height,
      codec: videoStream.codec_name,
    };
  }

  async writeThumbnail(req: ThumbnailRequest): Promise<void> {
    const ffmpegPath = this.appConfig.ffmpegPath;
    const { videoAbsolutePath, outAbsolutePath, atSecond, widthPx, heightPx, jpegQuality } = req;

    const args = [
      '-ss',
      String(atSecond),
      '-i',
      videoAbsolutePath,
      '-frames:v',
      '1',
      '-vf',
      ['scale=', String(widthPx), ':', String(heightPx)].join(''),
      '-q:v',
      String(jpegQuality),
      '-y',
      outAbsolutePath,
    ];

    try {
      await execFileAsync(ffmpegPath, args, { timeout: 30_000 });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new FfmpegThumbnailError(videoAbsolutePath, msg);
    }
  }
}
