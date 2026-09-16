/**
 * Unit tests for LocalLlamaAdapter.
 *
 * llama-completion is never executed — child_process.execFile is mocked,
 * exactly as in local-whisper.adapter.spec.ts; node:fs/promises is mocked too
 * so the prompt file's actual content is inspectable without touching disk.
 * There is deliberately no integration counterpart: a real run needs a
 * multi-gigabyte gguf model (E29-F02-S01 clarification #5 — no test calls a
 * live model).
 *
 * Scenarios covered:
 *   1. Exact argv: model, prompt FILE (not inline -p), threads, context,
 *      temp/seed, json-schema, --no-warmup.
 *   2. The written prompt file primes an already-closed <think> block — the
 *      fix for Qwen3.5 burning its whole token budget on reasoning.
 *   3. Parsing skips past the echoed prompt (llama-completion's stdout
 *      contains the whole prompt file before the actual completion).
 *   4. cleanCues: malformed/non-array reply degrades to an empty array.
 *   5. generateQuestions: parses a well-formed { questions: [...] } reply.
 *   6. generateQuestions: throws QuizGenerationFailedError on unparsable output.
 *   7. Non-zero exit / timeout → QuizGenerationFailedError.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Hoisted by Vitest above every import, so the mocks are installed before the
// adapter module binds node:child_process / node:fs/promises.
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

// Imported AFTER the mock declarations so the bindings resolve to the mocks.
import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

import { QuizGenerationFailedError } from '../domain/quiz/quiz.errors';
import { LocalLlamaAdapter } from './local-llama.adapter';

import type { AppConfig, QuizGenerationConfig } from '../../../common/config/app-config';

type ExecFileCb = (error: Error | null, stdout: string, stderr: string) => void;

/** llama-completion echoes the whole prompt file before the actual completion. */
function mockResolveWithCompletion(completion: string, stderr = ''): void {
  vi.mocked(execFile).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper mock
    (...args: any[]) => {
      const promptFileContent = vi.mocked(writeFile).mock.calls.at(-1)?.[1] as string;
      const stdout = `${promptFileContent}${completion}`;
      (args.at(-1) as ExecFileCb)(null, stdout, stderr);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    },
  );
}

function mockReject(message: string): void {
  vi.mocked(execFile).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper mock
    (...args: any[]) => {
      (args.at(-1) as ExecFileCb)(new Error(message), '', '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any;
    },
  );
}

function makeAppConfig(overrides: Partial<QuizGenerationConfig> = {}): AppConfig {
  const quizGeneration: QuizGenerationConfig = {
    llamaPath: 'llama-completion',
    defaultModelFilename: 'Qwen3.5-4B-Q4_K_M.gguf',
    timeoutMs: 600_000,
    threads: 4,
    contextSize: 4096,
    mode: 'real',
    ...overrides,
  };
  return { quizGeneration } as unknown as AppConfig;
}

describe('LocalLlamaAdapter', () => {
  beforeEach(() => {
    vi.mocked(execFile).mockReset();
    vi.mocked(writeFile).mockReset().mockResolvedValue(undefined);
  });

  it('invokes llama-completion with model, PROMPT FILE, threads, context, temp/seed, no-warmup and a json-schema', async () => {
    mockResolveWithCompletion('["hello world", "this is a test"]');
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    await adapter.cleanCues({
      modelAbsolutePath: '/models/Qwen3.5-4B-Q4_K_M.gguf',
      cueTexts: ['helo wrold', 'this si a tset'],
    });

    const call = vi.mocked(execFile).mock.calls[0];
    expect(call?.[0]).toBe('llama-completion');
    const args = call?.[1] as string[];
    expect(args.slice(0, 4)).toEqual([
      '-m',
      '/models/Qwen3.5-4B-Q4_K_M.gguf',
      '-f',
      expect.any(String),
    ]);
    expect(args).not.toContain('-p');
    expect(args.slice(args.indexOf('-t'), args.indexOf('-t') + 2)).toEqual(['-t', '4']);
    expect(args.slice(args.indexOf('-c'), args.indexOf('-c') + 2)).toEqual(['-c', '4096']);
    expect(args).toEqual(expect.arrayContaining(['--temp', '0', '--seed', '1', '--no-warmup']));
    expect(args).toContain('-j');
    expect(call?.[2]).toEqual({ timeout: 600_000 });
  });

  it('primes an already-closed <think> block so the model skips its reasoning pass', async () => {
    mockResolveWithCompletion('["ok"]');
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    await adapter.cleanCues({ modelAbsolutePath: '/models/x.gguf', cueTexts: ['a'] });

    const written = vi.mocked(writeFile).mock.calls[0]?.[1] as string;
    expect(written).toContain('<|im_start|>assistant\n<think>\n\n</think>\n\n');
  });

  it('cleanCues parses a JSON array reply, skipping past the echoed prompt', async () => {
    mockResolveWithCompletion('["hello world", "this is a test"]');
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    const result = await adapter.cleanCues({
      modelAbsolutePath: '/models/x.gguf',
      cueTexts: ['a', 'b'],
    });

    expect(result).toEqual(['hello world', 'this is a test']);
  });

  it('cleanCues degrades to an empty array on unparsable output', async () => {
    mockResolveWithCompletion('not json at all');
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    const result = await adapter.cleanCues({
      modelAbsolutePath: '/models/x.gguf',
      cueTexts: ['a'],
    });

    expect(result).toEqual([]);
  });

  it('generateQuestions parses a well-formed questions reply', async () => {
    mockResolveWithCompletion(
      JSON.stringify({
        questions: [{ prompt: 'What?', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 2 }],
      }),
    );
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    const result = await adapter.generateQuestions({
      modelAbsolutePath: '/models/x.gguf',
      windowText: 'some transcript window',
      questionCount: 1,
    });

    expect(result).toEqual([
      { prompt: 'What?', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 2 },
    ]);
  });

  it('generateQuestions throws QuizGenerationFailedError on unparsable output', async () => {
    mockResolveWithCompletion('garbage, no json here');
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    await expect(
      adapter.generateQuestions({
        modelAbsolutePath: '/models/x.gguf',
        windowText: 'w',
        questionCount: 1,
      }),
    ).rejects.toBeInstanceOf(QuizGenerationFailedError);
  });

  it('raises QuizGenerationFailedError when the process exits non-zero', async () => {
    mockReject('Command failed: llama-completion');
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    await expect(
      adapter.generateQuestions({
        modelAbsolutePath: '/models/x.gguf',
        windowText: 'w',
        questionCount: 1,
      }),
    ).rejects.toBeInstanceOf(QuizGenerationFailedError);
  });

  it('raises QuizGenerationFailedError when the timeout elapses', async () => {
    mockReject('spawn ETIMEDOUT');
    const adapter = new LocalLlamaAdapter(makeAppConfig());

    await expect(
      adapter.generateQuestions({
        modelAbsolutePath: '/models/x.gguf',
        windowText: 'w',
        questionCount: 1,
      }),
    ).rejects.toMatchObject({ code: 'quiz-generation-failed' });
  });
});
