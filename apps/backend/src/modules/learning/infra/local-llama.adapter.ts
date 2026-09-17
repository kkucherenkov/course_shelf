/**
 * WHY this file exists:
 * Concrete TextModelAdapter backed by a child_process.execFile shell-out to
 * llama.cpp's `llama-completion`, mirroring LocalWhisperAdapter (E29-F02-S01
 * clarification #3): a thin execFile wrapper, no resident model, no server —
 * the weight file only lives in RAM for the duration of one invocation.
 * `llama-completion`, not `llama-cli`: verified against a real run on the
 * maintainer's hardware — `llama-cli` was renamed mid-refactor upstream and
 * its replacement (`llama-app`) does not currently link. `llama-completion`
 * takes its prompt from a file (`-f`), not inline (`-p`) — a temp file, same
 * lifecycle as LocalWhisperAdapter's temp `.wav` — and its stdout ECHOES the
 * whole prompt before the actual completion, so parsing has to skip past our
 * own prompt to find the answer.
 *
 * The empty `<think>\n\n</think>\n\n` immediately after the assistant turn is
 * NOT decorative: Qwen3.5 defaults to a reasoning pass before answering, and
 * on a real 15-cue Russian window it burned the entire token budget thinking
 * and never reached an answer. Priming an already-closed think block is the
 * documented way to skip straight to the answer — baked into the prompt
 * unconditionally, not a caller-configurable option, because there is no
 * scenario where burning the budget on invisible reasoning is preferable.
 * The `<|im_start|>` template and this primer are llama.cpp/Qwen specifics,
 * meaningless to a chat-completions API — that is why they stay here rather
 * than in model-prompts.ts, which both adapters share.
 *
 * `--json-schema` (`-j`) still constrains the answer to parseable JSON; both
 * operations share one prompt-building + one parsing path, differing only in
 * system prompt, schema and max tokens.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import { QuizGenerationFailedError, QuizModelNotFoundError } from '../domain/quiz/quiz.errors';
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

/**
 * Primes the model past its default reasoning pass (see file header). Also
 * doubles as the marker `extractCompletion` searches stdout for — it is
 * built from our own template, not lesson content, so it cannot collide with
 * anything a transcript window could contain.
 */
const ASSISTANT_PRIMER = '<|im_start|>assistant\n<think>\n\n</think>\n\n';

function chatPrompt(system: string, user: string): string {
  return `<|im_start|>system\n${system}<|im_end|>\n<|im_start|>user\n${user}<|im_end|>\n${ASSISTANT_PRIMER}`;
}

/**
 * `llama-completion` echoes the whole prompt file back on stdout before the
 * generated continuation. Slicing on our own ASSISTANT_PRIMER (rather than
 * on the first `{`/`[`) is what makes that safe even if the transcript text
 * itself happens to contain a brace.
 */
function extractCompletion(stdout: string): string {
  const markerIndex = stdout.lastIndexOf(ASSISTANT_PRIMER);
  return markerIndex === -1 ? stdout : stdout.slice(markerIndex + ASSISTANT_PRIMER.length);
}

/**
 * Slices out the first balanced top-level JSON value in `text`. Defensive
 * only — grammar-constrained sampling should already make the completion
 * pure JSON, but this costs nothing and does not depend on that holding
 * exactly. Returns undefined when no `{`/`[` is found or it never closes.
 */
function extractJsonSlice(text: string): string | undefined {
  const candidates = [text.indexOf('{'), text.indexOf('[')].filter((i) => i >= 0);
  if (candidates.length === 0) return undefined;
  const start = Math.min(...candidates);
  const closeChar = text[start] === '{' ? '}' : ']';
  const end = text.lastIndexOf(closeChar);
  return end < start ? undefined : text.slice(start, end + 1);
}

/**
 * Manual promise wrapper around execFile — same reason as LocalWhisperAdapter:
 * `promisify` at module level would capture the original reference before
 * vi.mock() installs the test double.
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
export class LocalLlamaAdapter implements TextModelAdapter {
  constructor(private readonly appConfig: AppConfig) {}

  /**
   * Discards the resolved path — resolveModelPath's throw is the whole
   * point. Runs inside `.then()`, not the method body directly, so that
   * throw is turned into a rejected promise rather than a synchronous
   * exception from the call itself: the handler awaits this before starting
   * the fire-and-forget walk, and needs a promise to await either way.
   */
  ensureModelUsable(model: string): Promise<void> {
    return Promise.resolve().then(() => {
      this.resolveModelPath(model);
    });
  }

  async cleanCues(req: CleanCuesRequest): Promise<readonly string[]> {
    const absolutePath = this.resolveModelPath(req.model);
    const prompt = chatPrompt(CLEANUP_SYSTEM_PROMPT, JSON.stringify(req.cueTexts));
    const stdout = await this.run(
      absolutePath,
      prompt,
      JSON.stringify(cleanupJsonSchema(req.cueTexts.length)),
      CLEANUP_MAX_TOKENS,
    );
    const parsed = this.tryParseArray(extractCompletion(stdout));
    // Malformed/mismatched output is not fatal here — quiz-cleanup.ts's
    // applyCleanup falls back to the original cues when it sees anything
    // other than exactly `cueTexts.length` strings, so an empty array is a
    // safe, honest "cleanup produced nothing usable".
    return parsed ?? [];
  }

  async generateQuestions(
    req: GenerateQuestionsRequest,
  ): Promise<readonly GeneratedQuizQuestion[]> {
    const absolutePath = this.resolveModelPath(req.model);
    const prompt = chatPrompt(
      GENERATE_SYSTEM_PROMPT,
      `${req.windowText}\n\nGenerate ${String(req.questionCount)} question(s).`,
    );
    const stdout = await this.run(
      absolutePath,
      prompt,
      JSON.stringify(generateJsonSchema()),
      GENERATE_MAX_TOKENS,
    );
    const slice = extractJsonSlice(extractCompletion(stdout));
    if (!slice) {
      throw new QuizGenerationFailedError('llama-completion produced no parseable JSON output.');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(slice);
    } catch (error) {
      throw new QuizGenerationFailedError(
        `llama-completion output was not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return this.toQuestions(parsed);
  }

  /**
   * A filename, never a path: the weights directory is this adapter's
   * business, not its caller's. Mirrors what GenerateQuizHandler used to do
   * before a second adapter existed.
   */
  private resolveModelPath(model: string): string {
    const absolutePath = path.join(this.appConfig.modelWeightsDir, model);
    if (!model.endsWith('.gguf') || !existsSync(absolutePath)) {
      throw new QuizModelNotFoundError(model);
    }
    return absolutePath;
  }

  private async run(
    absolutePath: string,
    prompt: string,
    jsonSchema: string,
    maxTokens: number,
  ): Promise<string> {
    const cfg = this.appConfig.quizGeneration;
    // mkdtemp, not a computed name under os.tmpdir(): a predictable path
    // written directly by fs.writeFile is a symlink-race target in a
    // world-writable directory (flagged by CodeQL). mkdtemp creates the
    // directory atomically and exclusively, so nothing could have pre-placed
    // a symlink inside it before this process owns it.
    const dir = await mkdtemp(path.join(os.tmpdir(), 'cs-llama-'));
    const promptFile = path.join(dir, 'prompt.txt');
    await writeFile(promptFile, prompt, 'utf8');

    const args = [
      '-m',
      absolutePath,
      '-f',
      promptFile,
      '-t',
      String(cfg.threads),
      '-c',
      String(cfg.contextSize),
      '-n',
      String(maxTokens),
      '--temp',
      '0',
      '--seed',
      String(SEED),
      '--no-warmup',
      '-j',
      jsonSchema,
    ];

    try {
      const { stdout } = await execFileAsync(cfg.llamaPath, args, { timeout: cfg.timeoutMs });
      return stdout;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new QuizGenerationFailedError(
        `llama-completion on "${absolutePath}" failed: ${detail}`,
      );
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => {
        // Best-effort — the file lives in the container's temp directory, not
        // a mounted volume, but a long walk leaking one directory per call
        // would still fill it.
      });
    }
  }

  private tryParseArray(stdout: string): readonly string[] | undefined {
    const slice = extractJsonSlice(stdout);
    if (!slice) return undefined;
    try {
      const parsed: unknown = JSON.parse(slice);
      if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
        return undefined;
      }
      return parsed;
    } catch {
      return undefined;
    }
  }

  private toQuestions(parsed: unknown): readonly GeneratedQuizQuestion[] {
    if (typeof parsed !== 'object' || parsed === null || !('questions' in parsed)) {
      throw new QuizGenerationFailedError(
        'llama-completion output was missing a "questions" array.',
      );
    }
    const { questions } = parsed;
    if (!Array.isArray(questions)) {
      throw new QuizGenerationFailedError(
        'llama-completion output\'s "questions" was not an array.',
      );
    }
    return questions.map((q, i) => {
      if (
        typeof q !== 'object' ||
        q === null ||
        typeof (q as { prompt?: unknown }).prompt !== 'string' ||
        !Array.isArray((q as { options?: unknown }).options) ||
        (q as { options: unknown[] }).options.length !== 4 ||
        typeof (q as { correctOptionIndex?: unknown }).correctOptionIndex !== 'number'
      ) {
        throw new QuizGenerationFailedError(
          `llama-completion output's question #${String(i)} was malformed (expected exactly 4 options).`,
        );
      }
      const question = q as {
        prompt: string;
        options: [unknown, unknown, unknown, unknown];
        correctOptionIndex: number;
      };
      const [a, b, c, d] = question.options;
      return {
        prompt: question.prompt,
        options: [String(a), String(b), String(c), String(d)],
        correctOptionIndex: question.correctOptionIndex,
      };
    });
  }
}
