/**
 * Integration test for LocalFfmpegAdapter.
 *
 * Requires ffmpeg/ffprobe to be installed. The test skips automatically when
 * `which ffmpeg` returns non-zero so CI without ffmpeg stays green.
 *
 * Fixture: a 2-second 320×180 blue MP4 generated via ffmpeg lavfi in beforeAll.
 * The file lands in os.tmpdir() and is cleaned up in afterAll.
 */
import { spawnSync } from 'node:child_process';
import { rm, mkdtemp, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LocalFfmpegAdapter } from './local-ffmpeg.adapter';

import type { AppConfig } from '../../../common/config/app-config';

// ---------------------------------------------------------------------------
// Skip guard — skip entire suite if ffmpeg is not installed.
// ---------------------------------------------------------------------------

const ffmpegCheck = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' });
const ffmpegAbsent = ffmpegCheck.status !== 0;

const ffprobeCheck = spawnSync('which', ['ffprobe'], { encoding: 'utf8' });
const ffprobeAbsent = ffprobeCheck.status !== 0;

const skip = ffmpegAbsent || ffprobeAbsent;

function makeAppConfig(): AppConfig {
  return {
    ffprobePath: 'ffprobe',
    ffmpegPath: 'ffmpeg',
    thumbnailJpegQuality: 30,
  } as unknown as AppConfig;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe.skipIf(skip)('LocalFfmpegAdapter (integration — requires ffmpeg in PATH)', () => {
  let tmpDir: string;
  let fixtureMp4: string;
  let thumbPath: string;
  let adapter: LocalFfmpegAdapter;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'courseshelf-test-'));
    fixtureMp4 = path.join(tmpDir, 'fixture.mp4');
    thumbPath = path.join(tmpDir, 'fixture.thumb.jpg');

    // Generate a 2-second 320×180 blue H.264 MP4 with no audio.
    const gen = spawnSync(
      'ffmpeg',
      [
        '-f',
        'lavfi',
        '-i',
        'color=c=blue:s=320x180:d=2',
        '-c:v',
        'libx264',
        '-t',
        '2',
        '-y',
        fixtureMp4,
      ],
      { encoding: 'utf8' },
    );
    if (gen.status !== 0) {
      throw new Error(`Fixture generation failed: ${gen.stderr}`);
    }

    adapter = new LocalFfmpegAdapter(makeAppConfig());
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('probe() returns correct metadata for the fixture video', async () => {
    const meta = await adapter.probe(fixtureMp4);

    expect(meta.durationSeconds).toBeGreaterThanOrEqual(1.9);
    expect(meta.durationSeconds).toBeLessThanOrEqual(3);
    expect(meta.widthPx).toBe(320);
    expect(meta.heightPx).toBe(180);
    expect(meta.codec).toBe('h264');
  });

  it('writeThumbnail() writes a JPEG file to the output path', async () => {
    const meta = await adapter.probe(fixtureMp4);
    const atSecond = Math.max(meta.durationSeconds / 4, 1);

    await adapter.writeThumbnail({
      videoAbsolutePath: fixtureMp4,
      outAbsolutePath: thumbPath,
      atSecond,
      widthPx: 320,
      heightPx: 180,
      jpegQuality: 30,
    });

    const info = await stat(thumbPath);
    expect(info.size).toBeGreaterThan(0);
  });
});
