/**
 * WHY this file exists:
 * Concrete WhisperAdapter backed by a child_process.execFile shell-out to
 * whisper.cpp, mirroring LocalFfmpegAdapter — same reasoning: a thin execFile
 * wrapper beats a native binding dependency and keeps the port surface minimal.
 *
 * The timeout is transcription-sized (six hours by default) rather than the
 * 30 seconds that is right for ffprobe: on NAS-grade CPU a long lecture is
 * measured in hours, and killing it at 30s would mean never finishing anything.
 *
 * The binary writes `<outBase>.srt` itself; we return that path rather than
 * parsing stdout, which whisper.cpp uses for progress chatter.
 */
import { execFile } from 'node:child_process';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import { WhisperFailedError } from '../domain/transcription/transcription.errors';

import type {
  TranscribeRequest,
  TranscribeResult,
  WhisperAdapter,
} from '../domain/transcription/whisper.port';

/**
 * Manual promise wrapper around execFile — same reason as LocalFfmpegAdapter:
 * `promisify` at module level would capture the original reference before
 * vi.mock() installs the test double. Calling execFile inline uses the live ES
 * module binding, which resolves to the mock during unit tests.
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

@Injectable()
export class LocalWhisperAdapter implements WhisperAdapter {
  constructor(private readonly appConfig: AppConfig) {}

  async transcribe(req: TranscribeRequest): Promise<TranscribeResult> {
    const cfg = this.appConfig.transcription;
    const { audioAbsolutePath, outBaseAbsolutePath } = req;

    const args = [
      '-m',
      cfg.modelPath,
      '-f',
      audioAbsolutePath,
      '-t',
      String(cfg.threads),
      '-l',
      cfg.language,
      '-osrt',
      '-of',
      outBaseAbsolutePath,
    ];

    try {
      await execFileAsync(cfg.whisperPath, args, { timeout: cfg.timeoutMs });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new WhisperFailedError(audioAbsolutePath, detail);
    }

    return { srtAbsolutePath: `${outBaseAbsolutePath}.srt` };
  }
}
