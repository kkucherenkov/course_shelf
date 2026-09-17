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
 * text", so a discarded cleanup attempt is never a lost transcript.
 */
import { Injectable } from '@nestjs/common';

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
  constructor(private readonly appConfig: AppConfig) {}

  /**
   * Whether `model` is a real OpenRouter id is only knowable from the
   * provider's answer (ADR-0012) — checking it here would make every
   * request pay for a round trip that proves nothing. All this refuses
   * up front is the one thing knowable without calling out: no API key.
   */
  ensureModelUsable(_model: string): Promise<void> {
    if (!this.appConfig.hostedModel.configured) {
      return Promise.reject(new QuizGenerationNotConfiguredError());
    }
    return Promise.resolve();
  }

  async cleanCues(req: CleanCuesRequest): Promise<readonly string[]> {
    const parsed = await this.complete({
      model: req.model,
      system: CLEANUP_SYSTEM_PROMPT,
      user: JSON.stringify(req.cueTexts),
      schemaName: 'cleaned_cues',
      schema: cleanupJsonSchema(req.cueTexts.length),
      maxTokens: CLEANUP_MAX_TOKENS,
    });
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  }

  async generateQuestions(
    req: GenerateQuestionsRequest,
  ): Promise<readonly GeneratedQuizQuestion[]> {
    const parsed = await this.complete({
      model: req.model,
      system: GENERATE_SYSTEM_PROMPT,
      user: req.windowText,
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
          response_format: {
            type: 'json_schema',
            json_schema: { name: req.schemaName, strict: true, schema: req.schema },
          },
        }),
      });
    } catch (error) {
      // AbortSignal.timeout and DNS/connection failures both land here. The
      // key is in the request, never in what we re-throw.
      throw new QuizGenerationFailedError(`request failed: ${errorSummary(error)}`);
    }

    if (!response.ok) {
      throw new QuizGenerationFailedError(`provider answered ${String(response.status)}`);
    }

    const content = extractContent(await response.json());
    try {
      return JSON.parse(content);
    } catch {
      throw new QuizGenerationFailedError('reply was not JSON');
    }
  }
}
