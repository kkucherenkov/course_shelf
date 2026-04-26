/**
 * WHY this file exists:
 * Port (interface + Symbol token) for ffmpeg/ffprobe shell-out operations.
 * Isolating this I/O behind a port lets unit tests supply a fake FfmpegAdapter
 * without real process spawning, and lets production code swap in an alternative
 * implementation (e.g. a cloud-based transcoder) without touching the handler.
 *
 * Naming convention:
 *   Token:   FFMPEG_ADAPTER
 *   Port:    FfmpegAdapter (interface)
 *   Adapter: LocalFfmpegAdapter (infra/local-ffmpeg.adapter.ts)
 *   Binding: { provide: FFMPEG_ADAPTER, useClass: LocalFfmpegAdapter }
 */

/** Injection token — Symbol ensures global uniqueness across the process. */
export const FFMPEG_ADAPTER = Symbol('FFMPEG_ADAPTER');

/** Video stream metadata extracted by ffprobe. */
export interface VideoMetadata {
  durationSeconds: number;
  widthPx: number;
  heightPx: number;
  codec: string;
}

/** Parameters for writing a single JPEG thumbnail via ffmpeg. */
export interface ThumbnailRequest {
  videoAbsolutePath: string;
  outAbsolutePath: string;
  /** Seek position in seconds (typically durationSeconds / 4, minimum 1). */
  atSecond: number;
  widthPx: 320;
  heightPx: 180;
  /** JPEG quality 0..100 (≈30 in production). */
  jpegQuality: number;
}

export interface FfmpegAdapter {
  /**
   * Run ffprobe on the given video file and return its metadata.
   * Throws FfmpegProbeError on non-zero exit, missing streams, or parse failure.
   */
  probe(absolutePath: string): Promise<VideoMetadata>;

  /**
   * Extract a single JPEG frame from the video and write it to the given path.
   * Throws FfmpegThumbnailError on non-zero exit.
   */
  writeThumbnail(req: ThumbnailRequest): Promise<void>;
}
