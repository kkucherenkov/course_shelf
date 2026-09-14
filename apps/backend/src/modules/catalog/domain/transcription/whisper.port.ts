/**
 * WHY this file exists:
 * Port for the speech-to-text engine. The application layer never learns that
 * the engine is whisper.cpp, a child process, or local at all — swapping in a
 * hosted transcriber later is one new adapter, not a new call site.
 */

export interface TranscribeRequest {
  readonly audioAbsolutePath: string;
  /** Output path WITHOUT the extension — whisper.cpp appends `.srt` itself. */
  readonly outBaseAbsolutePath: string;
  /**
   * Language tag for this run, or `auto`. Undefined means "use whatever the
   * deployment is configured with" (`WHISPER_LANGUAGE`). Naming it skips the
   * per-file detection pass `auto` costs on every single video.
   */
  readonly language?: string;
}

export interface TranscribeResult {
  readonly srtAbsolutePath: string;
  /**
   * The raw tag whisper.cpp printed for `-l auto` (e.g. `ru`), parsed from its
   * `auto-detected language: <tag>` log line — undefined for an explicit
   * `language`, where nothing needs detecting, or when the line was not
   * found. Unconstrained here; `resolveDetectedLanguage` (domain) decides
   * whether to trust it.
   */
  readonly detectedLanguage?: string;
}

export interface WhisperAdapter {
  /** @throws WhisperFailedError on non-zero exit or timeout. */
  transcribe(req: TranscribeRequest): Promise<TranscribeResult>;
}

export const WHISPER_ADAPTER = Symbol('WHISPER_ADAPTER');
