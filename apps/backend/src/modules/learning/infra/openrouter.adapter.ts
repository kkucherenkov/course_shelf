/**
 * WHY this file exists:
 * Hosted half of ADR-0012's TextModelAdapter split — an OpenAI-compatible
 * chat-completions call to OpenRouter, alongside LocalLlamaAdapter's
 * llama.cpp shell-out. Deliberately simpler than LocalLlamaAdapter: asking
 * for `response_format: json_schema` gets clean JSON back in the message
 * content, where `llama-completion` echoes the whole prompt to stdout and
 * has to be sliced apart first. `cleanCues` degrades to `[]` on a malformed
 * reply for the same reason LocalLlamaAdapter does — `applyCleanup` in
 * `quiz-cleanup.ts` already treats a length mismatch as "keep the original
 * text", so a discarded cleanup attempt is never a lost transcript. Its
 * request wraps the shared array schema in `{ cues: [...] }` before sending
 * it — an object root, unlike `cleanupJsonSchema`'s own array root, which
 * several OpenAI-compatible providers reject at the top level; see the
 * comment at the call site.
 *
 * A non-2xx answer's body is read, truncated and logged alongside the
 * status before the error is thrown, so a bad key, an exhausted balance and
 * a bad model id stop being indistinguishable in an empty log — and so the
 * body is actually consumed, releasing the socket back to undici's pool
 * instead of leaving it open until GC. A 200's `usage` block is logged too,
 * for the same reason a whisper/llama run logs what it cost.
 */
import { Injectable, Logger } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import {
  QuizGenerationFailedError,
  QuizGenerationNotConfiguredError,
} from '../domain/quiz/quiz.errors';
import {
  CLEANUP_MAX_TOKENS,
  CLEANUP_SYSTEM_PROMPT,
  GENERATE_MAX_TOKENS,
  GENERATE_SYSTEM_PROMPT,
  SEED,
  cleanupJsonSchema,
  generateJsonSchema,
} from '../domain/quiz/model-prompts';

import type {
  CleanCuesRequest,
  GeneratedQuizQuestion,
  GenerateQuestionsRequest,
  TextModelAdapter,
} from '../domain/quiz/text-model.port';

interface CompletionRequest {
  readonly model: string;
  readonly system: string;
  readonly user: string;
  readonly schemaName: string;
  readonly schema: object;
  readonly maxTokens: number;
}

/**
 * The provider's envelope is not the model's answer: a 200 can still carry a
 * refusal or an empty choices array, so this never assumes either exists.
 */
function extractContent(payload: unknown): string {
  const choice = (payload as { choices?: { message?: { content?: unknown } }[] }).choices?.[0];
  const content = choice?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    throw new QuizGenerationFailedError('reply carried no message content');
  }
  return content;
}

/** Message only. The request body holds the API key, so it never reaches an error. */
function errorSummary(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Truncates a provider-supplied string for a log line or error detail. */
function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function toQuestion(raw: unknown): GeneratedQuizQuestion {
  const q = raw as { prompt?: unknown; options?: unknown; correctOptionIndex?: unknown };
  const options = q.options;
  if (
    typeof q.prompt !== 'string' ||
    !Array.isArray(options) ||
    options.length !== 4 ||
    !options.every((o): o is string => typeof o === 'string') ||
    typeof q.correctOptionIndex !== 'number' ||
    q.correctOptionIndex < 0 ||
    q.correctOptionIndex > 3
  ) {
    throw new QuizGenerationFailedError('reply held a malformed question');
  }
  return {
    prompt: q.prompt,
    options: options as [string, string, string, string],
    correctOptionIndex: q.correctOptionIndex,
  };
}

@Injectable()
export class OpenRouterAdapter implements TextModelAdapter {
  private readonly logger = new Logger(OpenRouterAdapter.name);

  constructor(private readonly appConfig: AppConfig) {}

  /**
   * Whether `model` is a real OpenRouter id is only knowable from the
   * provider's answer (ADR-0012) — checking it here would make every
   * request pay for a round trip that proves nothing. All this refuses
   * up front is the one thing knowable without calling out: no API key.
   */
  ensureModelUsable(_model: string): Promise<void> {
    if (!this.appConfig.hostedModel.configured) {
      return Promise.reject(new QuizGenerationNotConfiguredError('OPENROUTER_API_KEY'));
    }
    return Promise.resolve();
  }

  async cleanCues(req: CleanCuesRequest): Promise<readonly string[]> {
    const parsed = await this.complete({
      model: req.model,
      system: CLEANUP_SYSTEM_PROMPT,
      user: JSON.stringify(req.cueTexts),
      schemaName: 'cleaned_cues',
      // cleanupJsonSchema's own root is an array — fine for LocalLlamaAdapter's
      // llama.cpp grammar path, but OpenAI-compatible structured-output modes
      // generally require an object at the root, so only THIS transport wraps
      // it. Not a change to cleanupJsonSchema itself: that schema, and the
      // local adapter's grammar path built from it, stay exactly as they are.
      schema: {
        type: 'object',
        properties: { cues: cleanupJsonSchema(req.cueTexts.length) },
        required: ['cues'],
      },
      maxTokens: CLEANUP_MAX_TOKENS,
    });
    const cues = (parsed as { cues?: unknown }).cues;
    return Array.isArray(cues) ? cues.filter((t): t is string => typeof t === 'string') : [];
  }

  async generateQuestions(
    req: GenerateQuestionsRequest,
  ): Promise<readonly GeneratedQuizQuestion[]> {
    const parsed = await this.complete({
      model: req.model,
      system: GENERATE_SYSTEM_PROMPT,
      user: `${req.windowText}\n\nGenerate ${String(req.questionCount)} question(s).`,
      schemaName: 'quiz_questions',
      schema: generateJsonSchema(),
      maxTokens: GENERATE_MAX_TOKENS,
    });
    const questions = (parsed as { questions?: unknown }).questions;
    if (!Array.isArray(questions))
      throw new QuizGenerationFailedError('reply carried no questions array');
    return questions.map((q) => toQuestion(q));
  }

  private async complete(req: CompletionRequest): Promise<unknown> {
    const cfg = this.appConfig.hostedModel;
    let response: Response;
    try {
      response = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(cfg.timeoutMs),
        body: JSON.stringify({
          model: req.model,
          max_tokens: req.maxTokens,
          temperature: 0,
          seed: SEED,
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.user },
          ],
          // No `strict: true` here: OpenAI-compatible strict JSON-schema mode
          // requires `additionalProperties: false` on every object and every
          // required property, and the shared schemas in model-prompts.ts
          // declare neither — a provider that enforces strict mode would
          // reject every request. Non-strict `json_schema` still shapes the
          // reply; `toQuestion` below and cleanCues' array check are the
          // actual safety net regardless of what the provider enforces. If
          // model-prompts.ts ever adds those declarations, strict can return.
          response_format: {
            type: 'json_schema',
            json_schema: { name: req.schemaName, schema: req.schema },
          },
        }),
      });
    } catch (error) {
      // AbortSignal.timeout and DNS/connection failures both land here. The
      // key is in the request, never in what we re-throw.
      throw new QuizGenerationFailedError(`request failed: ${errorSummary(error)}`);
    }

    if (!response.ok) {
      // Read and truncate the body so a 401 (bad key), 402 (no credits), 429
      // (rate limit) and 400 (bad model id) stop looking identical in a log —
      // and so the socket is released back to undici's pool instead of
      // sitting open until GC, which matters on a course-scoped walk that can
      // fire dozens of these. This is the provider's own error text, never
      // anything we built the request from.
      const bodyText = truncate(await response.text(), 200);
      const detail = `provider answered ${String(response.status)}: ${bodyText}`;
      this.logger.warn(`OpenRouter request failed: ${detail}`);
      throw new QuizGenerationFailedError(detail);
    }

    const payload: unknown = await response.json();
    this.logUsage(payload);
    const content = extractContent(payload);
    try {
      return JSON.parse(content);
    } catch {
      throw new QuizGenerationFailedError('reply was not JSON');
    }
  }

  /** The plan's verification step asks the maintainer to read what a run cost. */
  private logUsage(payload: unknown): void {
    const usage = (payload as { usage?: unknown }).usage;
    if (usage !== undefined) {
      this.logger.log(`OpenRouter usage: ${JSON.stringify(usage)}`);
    }
  }
}
