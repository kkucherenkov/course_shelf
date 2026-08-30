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
}

export interface TranscribeResult {
  readonly srtAbsolutePath: string;
}

export interface WhisperAdapter {
  /** @throws WhisperFailedError on non-zero exit or timeout. */
  transcribe(req: TranscribeRequest): Promise<TranscribeResult>;
}

export const WHISPER_ADAPTER = Symbol('WHISPER_ADAPTER');
