/**
 * WHY this file exists:
 * Port for the text-generation engine behind quiz generation — provider-
 * neutral so a hosted chat-completions adapter (ADR-0012) can implement it
 * alongside LocalLlamaAdapter's llama.cpp shell-out: no resident model, no
 * server, the weight file only lives in RAM for the duration of one
 * `llama-completion` invocation for the local case (E29-F02-S01
 * clarification #3), a plain HTTP call for the hosted one. Two operations
 * share one port because they share one prompt-building + parsing shape,
 * not because they are the same kind of call — see LocalLlamaAdapter for how
 * each is prompted.
 */
export interface CleanCuesRequest {
  /**
   * Opaque to the caller: a `.gguf` filename for LocalLlamaAdapter, a
   * provider model id for OpenRouterAdapter. Each adapter resolves it in
   * the terms of its own environment — which is why the handler no longer
   * builds a filesystem path.
   */
  readonly model: string;
  /** Cue texts, in order — the only thing the cleanup prompt ever sees. */
  readonly cueTexts: readonly string[];
}

export interface GenerateQuestionsRequest {
  /**
   * Opaque to the caller: a `.gguf` filename for LocalLlamaAdapter, a
   * provider model id for OpenRouterAdapter. Each adapter resolves it in
   * the terms of its own environment — which is why the handler no longer
   * builds a filesystem path.
   */
  readonly model: string;
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

export interface TextModelAdapter {
  /**
   * Throws before any generation starts when `model` cannot be used by this
   * engine — a missing `.gguf` file locally, an unconfigured API key for a
   * hosted provider. Exists so the handler can refuse a bad model name in
   * its answer to the request, instead of discovering it per window inside
   * fire-and-forget work, without learning where either engine keeps its
   * models.
   */
  ensureModelUsable(model: string): Promise<void>;

  /**
   * Returns as many corrected strings as the model produced — NOT guaranteed
   * to match `cueTexts.length`. Callers (`quiz-cleanup.ts`'s `applyCleanup`)
   * decide what an unexpected length means; this port only ever reports what
   * came back.
   * @throws QuizGenerationFailedError on a non-zero exit or timeout.
   */
  cleanCues(req: CleanCuesRequest): Promise<readonly string[]>;

  /** @throws QuizGenerationFailedError on a non-zero exit, timeout, or unparsable output. */
  generateQuestions(req: GenerateQuestionsRequest): Promise<readonly GeneratedQuizQuestion[]>;
}

export const TEXT_MODEL_ADAPTER = Symbol('TEXT_MODEL_ADAPTER');
