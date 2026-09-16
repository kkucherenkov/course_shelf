/**
 * WHY this file exists:
 * Port for the local text-generation engine behind quiz generation —
 * llama.cpp, spawned per call exactly like WhisperAdapter (E29-F02-S01
 * clarification #3): no resident model, no server, the weight file only
 * lives in RAM for the duration of one `llama-completion` invocation. Two
 * operations share one port because they share one binary and one model
 * file, not because they are the same kind of call — see LocalLlamaAdapter
 * for how each is prompted.
 */
export interface LlamaCleanCuesRequest {
  readonly modelAbsolutePath: string;
  /** Cue texts, in order — the only thing the cleanup prompt ever sees. */
  readonly cueTexts: readonly string[];
}

export interface LlamaGenerateQuestionsRequest {
  readonly modelAbsolutePath: string;
  /** The (possibly cleaned-up) window text the questions are generated from. */
  readonly windowText: string;
  readonly questionCount: number;
}

export interface GeneratedQuizQuestion {
  readonly prompt: string;
  /** Exactly 4 — matches the JSON schema `generateJsonSchema` gives the model. */
  readonly options: readonly [string, string, string, string];
  readonly correctOptionIndex: number;
}

export interface LlamaAdapter {
  /**
   * Returns as many corrected strings as the model produced — NOT guaranteed
   * to match `cueTexts.length`. Callers (`quiz-cleanup.ts`'s `applyCleanup`)
   * decide what an unexpected length means; this port only ever reports what
   * came back.
   * @throws QuizGenerationFailedError on a non-zero exit or timeout.
   */
  cleanCues(req: LlamaCleanCuesRequest): Promise<readonly string[]>;

  /** @throws QuizGenerationFailedError on a non-zero exit, timeout, or unparsable output. */
  generateQuestions(req: LlamaGenerateQuestionsRequest): Promise<readonly GeneratedQuizQuestion[]>;
}

export const LLAMA_ADAPTER = Symbol('LLAMA_ADAPTER');
