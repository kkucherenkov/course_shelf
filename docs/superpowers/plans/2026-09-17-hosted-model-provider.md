# Hosted model provider implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** quiz generation can run against a hosted model over HTTP instead of local llama.cpp, chosen by configuration, with the local adapter still working unchanged.

**Architecture:** the existing port (`LlamaAdapter`) already isolates the engine, but it leaks the local implementation through `modelAbsolutePath` and through prompts that live inside the local adapter. This plan makes the port provider-neutral, moves the shared prompts and JSON schemas into the domain so two adapters cannot drift apart, adds `OpenRouterAdapter`, and selects between them in the module factory the same way mock mode is selected today.

**Tech Stack:** NestJS 11, Vitest, native `fetch` (Node 22), OpenRouter chat-completions API.

**Spec:** [docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md](../specs/2026-09-17-lesson-summary-and-export-design.md), decision D9.

## Global Constraints

- Never read `process.env` directly; every value comes from `AppConfig`.
- `any` is not an escape hatch for a type error.
- No HTTP route changes in this plan, so no `openapi.yaml` edit and no codegen.
- The API key is a secret: it appears in `AppConfig` and in `.env.example` as an empty value, never in a committed default, a log line, or an error message.
- Existing behaviour must not change when `LLM_PROVIDER` is unset: the default stays local llama.cpp.
- `docs/adr/0011-local-llm-quiz-generation.md` must not be edited to pretend it always allowed this. It gets a `Superseded by` line; the new reasoning lives in ADR-0012.
- Follow the repo's comment convention: every new file opens with a `WHY this file exists:` block.
- After touching `.ts`, run `pnpm --filter @app/backend lint --fix` then `pnpm format`.

---

## Task 1: ADR-0012 and the provider configuration

**Files:**

- Create: `docs/adr/0012-hosted-model-provider.md`
- Modify: `docs/adr/0011-local-llm-quiz-generation.md` (status line only)
- Modify: `apps/backend/src/common/config/app-config.ts:220-235` (types), `:439-458` (`quizGeneration` getter)
- Create: `apps/backend/src/common/config/app-config.hosted-model.spec.ts`
- Modify: `.env.example`, `README.md`, `README.ru.md`, `docs/deployment.md`

**Interfaces:**

- Produces: `AppConfig.quizGeneration.provider: 'local' | 'openrouter'`, `AppConfig.hostedModel: HostedModelConfig` with fields `{ apiKey: string; baseUrl: string; defaultModel: string; timeoutMs: number; configured: boolean }`.

- [ ] **Step 1: Write the failing config test**

Create `apps/backend/src/common/config/app-config.hosted-model.spec.ts`:

```ts
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config';

function configWith(env: Record<string, string>): AppConfig {
  return new AppConfig(new ConfigService(env));
}

describe('AppConfig.quizGeneration.provider', () => {
  it('defaults to local so an existing deployment keeps llama.cpp', () => {
    expect(configWith({}).quizGeneration.provider).toBe('local');
  });

  it('honours LLM_PROVIDER', () => {
    expect(configWith({ LLM_PROVIDER: 'openrouter' }).quizGeneration.provider).toBe('openrouter');
  });
});

describe('AppConfig.hostedModel', () => {
  it('is not configured without an API key', () => {
    expect(configWith({ LLM_PROVIDER: 'openrouter' }).hostedModel.configured).toBe(false);
  });

  it('is configured once a key is present', () => {
    const cfg = configWith({ LLM_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'sk-test' });
    expect(cfg.hostedModel.configured).toBe(true);
    expect(cfg.hostedModel.apiKey).toBe('sk-test');
  });

  it('defaults the endpoint, model and timeout', () => {
    const cfg = configWith({ OPENROUTER_API_KEY: 'sk-test' });
    expect(cfg.hostedModel.baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(cfg.hostedModel.defaultModel).toBe('mistralai/mistral-nemo');
    expect(cfg.hostedModel.timeoutMs).toBe(120_000);
  });

  it('honours the overrides', () => {
    const cfg = configWith({
      OPENROUTER_API_KEY: 'sk-test',
      OPENROUTER_BASE_URL: 'https://example.test/v1',
      OPENROUTER_MODEL: 'openai/gpt-oss-120b',
      OPENROUTER_TIMEOUT_MS: '45000',
    });
    expect(cfg.hostedModel.baseUrl).toBe('https://example.test/v1');
    expect(cfg.hostedModel.defaultModel).toBe('openai/gpt-oss-120b');
    expect(cfg.hostedModel.timeoutMs).toBe(45_000);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @app/backend test src/common/config/app-config.hosted-model.spec.ts`
Expected: FAIL, `provider` and `hostedModel` do not exist.

- [ ] **Step 3: Add the types**

In `apps/backend/src/common/config/app-config.ts`, beside `ProviderMode`:

```ts
/** Which engine answers a text-generation call. Default 'local' keeps llama.cpp. */
export type LlmProvider = 'local' | 'openrouter';

export interface HostedModelConfig {
  /** Secret. Empty means the hosted provider cannot be used. */
  readonly apiKey: string;
  /** API root, without a trailing slash. */
  readonly baseUrl: string;
  /** Model id used when a request names none, e.g. 'mistralai/mistral-nemo'. */
  readonly defaultModel: string;
  /** Wall-clock timeout for one chat-completions call, in milliseconds. */
  readonly timeoutMs: number;
  /** True once an API key is present — the hosted equivalent of whisper's model-file check. */
  readonly configured: boolean;
}
```

Add `readonly provider: LlmProvider;` to `QuizGenerationConfig`.

- [ ] **Step 4: Add the getters**

In the `quizGeneration` getter's returned object:

```ts
      provider: this.stringOrDefault('LLM_PROVIDER', 'local') as LlmProvider,
```

And a new getter next to it:

```ts
  /**
   * Hosted text-generation settings (ADR-0012). `configured` is a key check
   * and nothing more: unlike a local weight file, whether the model id is
   * real is only knowable from the provider's answer, so a bad id surfaces
   * as a failed generation rather than a boot-time refusal.
   * Env: OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL,
   *      OPENROUTER_TIMEOUT_MS.
   */
  get hostedModel(): HostedModelConfig {
    const apiKey = this.stringOrDefault('OPENROUTER_API_KEY', '');
    return {
      apiKey,
      baseUrl: this.stringOrDefault('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
      defaultModel: this.stringOrDefault('OPENROUTER_MODEL', 'mistralai/mistral-nemo'),
      timeoutMs: this.numberOrDefault('OPENROUTER_TIMEOUT_MS', 120_000),
      configured: apiKey.length > 0,
    };
  }
```

- [ ] **Step 5: Run the test again**

Run: `pnpm --filter @app/backend test src/common/config/app-config.hosted-model.spec.ts`
Expected: PASS.

- [ ] **Step 6: Write ADR-0012**

Create `docs/adr/0012-hosted-model-provider.md` following the shape of `docs/adr/0011-local-llm-quiz-generation.md`: status accepted, date 2026-09-17, deciders @kkucherenkov, tags backend, ml. It must say, in its own words:

- **Context:** ADR-0011 rejected hosted APIs because a self-hosted instance sending course content off-host is the owner's call. The owner has now made that call. The library holds published third-party courses, not personal data, and local inference measures 0.91 tok/s on the target NAS, which is roughly ten minutes per lesson on a machine that also serves video.
- **Decision:** a provider switch (`LLM_PROVIDER`), default `local`. One extra adapter behind the existing port. Prompts and JSON schemas move into the domain so the two adapters cannot drift. The API key lives in `AppConfig`.
- **Consequences:** transcripts leave the machine when the hosted provider is on, and that is now a documented, configurable choice rather than an accident. Free-tier models are a development mode: 20 rpm and 50 requests a day without credits, against roughly 6200 requests to cover the current library, where a paid model costs about $0.32 for the same work.
- **Alternatives:** keep local only (rejected: ten minutes a lesson); resident model server (still rejected, for ADR-0011's reasons); free tier as the production mode (rejected: a week of throttled runs to save thirty cents).

Then add to `docs/adr/0011-local-llm-quiz-generation.md`, directly under its `**Status:** accepted` line:

```md
- **Superseded by:** [ADR-0012](0012-hosted-model-provider.md) — the hosted-API rejection in "Alternatives considered / Option A" no longer holds.
```

- [ ] **Step 7: Document the environment variables**

Add to `.env.example` (empty key, never a real one):

```sh
# Text generation: 'local' (llama.cpp) or 'openrouter' (ADR-0012)
LLM_PROVIDER=local
OPENROUTER_API_KEY=
OPENROUTER_MODEL=mistralai/mistral-nemo
```

Add the same four variables to the environment tables in `README.md` and `README.ru.md` (they are kept in sync), and a paragraph in `docs/deployment.md` next to the existing llama.cpp benchmarking advice saying the hosted provider removes the benchmark step and adds an egress of transcript text.

- [ ] **Step 8: Format, lint, commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add docs/adr apps/backend/src/common/config .env.example README.md README.ru.md docs/deployment.md
git commit -m "feat(backend): configure a hosted text-generation provider"
```

---

## Task 2: make the port provider-neutral

**Files:**

- Rename: `apps/backend/src/modules/learning/domain/quiz/llama.port.ts` → `text-model.port.ts`
- Create: `apps/backend/src/modules/learning/domain/quiz/model-prompts.ts`
- Create: `apps/backend/src/modules/learning/domain/quiz/model-prompts.spec.ts`
- Modify: `apps/backend/src/modules/learning/infra/local-llama.adapter.ts`, `mock-llama.adapter.ts`
- Modify: `apps/backend/src/modules/learning/application/commands/generate-quiz.handler.ts:95,105,123-133,168-240`
- Modify: `apps/backend/src/modules/learning/learning.module.ts`
- Modify the specs alongside each: `local-llama.adapter.spec.ts`, `mock-llama.adapter.spec.ts`, `generate-quiz.handler.spec.ts`

**Interfaces:**

- Consumes: `AppConfig.quizGeneration` from Task 1.
- Produces:
  - `TextModelAdapter` with the same two methods, where both request types carry `readonly model: string` in place of `modelAbsolutePath`. `model` is opaque to callers: a `.gguf` filename for the local adapter, a model id for the hosted one.
  - `TEXT_MODEL_ADAPTER` symbol replacing `LLAMA_ADAPTER`.
  - `CLEANUP_SYSTEM_PROMPT`, `GENERATE_SYSTEM_PROMPT`, `cleanupJsonSchema(count: number): object`, `generateJsonSchema(): object`, `CLEANUP_MAX_TOKENS = 800`, `GENERATE_MAX_TOKENS = 600` and `SEED = 1` exported from `model-prompts.ts`. Both schema functions return objects, not strings; the local adapter stringifies for `--json-schema`, the hosted one nests the object under `response_format`. The three constants move here too, so a change to either adapter's token budget changes both.

- [ ] **Step 1: Extract the prompts and schemas with a test that pins them**

Create `model-prompts.ts` holding the two system prompts, the two schema builders, and `CLEANUP_MAX_TOKENS`, `GENERATE_MAX_TOKENS`, `SEED`, all moved verbatim out of `local-llama.adapter.ts` except that the schema builders now `return` the object instead of `JSON.stringify(...)`. Give the file a `WHY this file exists:` header saying both adapters read from here so their output contracts cannot drift.

`ASSISTANT_PRIMER` and `chatPrompt` stay in `local-llama.adapter.ts`: the `<|im_start|>` template and the primed-empty-`<think>` trick are llama.cpp and Qwen specifics, meaningless to a chat-completions API that takes a `messages` array.

Create `model-prompts.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { cleanupJsonSchema, generateJsonSchema } from './model-prompts';

describe('cleanupJsonSchema', () => {
  it('pins the array length to the cue count in both directions', () => {
    expect(cleanupJsonSchema(3)).toMatchObject({ minItems: 3, maxItems: 3 });
  });
});

describe('generateJsonSchema', () => {
  it('requires exactly four options and an index inside them', () => {
    const schema = generateJsonSchema() as Record<string, any>;
    const question = schema.properties.questions.items;
    expect(question.properties.options).toMatchObject({ minItems: 4, maxItems: 4 });
    expect(question.properties.correctOptionIndex).toMatchObject({ minimum: 0, maximum: 3 });
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @app/backend test src/modules/learning/domain/quiz/model-prompts.spec.ts`
Expected: FAIL until `model-prompts.ts` exists, then PASS.

- [ ] **Step 3: Rename the port and its field**

`git mv` the port file to `text-model.port.ts`. Inside it: `LlamaAdapter` → `TextModelAdapter`, `LLAMA_ADAPTER` → `TEXT_MODEL_ADAPTER`, `LlamaCleanCuesRequest` → `CleanCuesRequest`, `LlamaGenerateQuestionsRequest` → `GenerateQuestionsRequest`, and in both request types replace `modelAbsolutePath` with:

```ts
  /**
   * Opaque to the caller: a `.gguf` filename for LocalLlamaAdapter, a
   * provider model id for OpenRouterAdapter. Each adapter resolves it in
   * the terms of its own environment — which is why the handler no longer
   * builds a filesystem path.
   */
  readonly model: string;
```

Update every importer. `ugrep -rl 'LLAMA_ADAPTER|LlamaAdapter|modelAbsolutePath' apps/backend/src` must come back empty when the step is done.

- [ ] **Step 4: Move path resolution into the local adapter**

Delete `resolveModel` from `generate-quiz.handler.ts` (lines 123-133) along with its `node:fs`/`node:path` imports if nothing else uses them, and pass `command.modelFilename ?? cfg.defaultModelFilename` straight through as `model`. The handler keeps writing that same string to `quiz.modelFilename`.

In `LocalLlamaAdapter`, add the private method the handler lost:

```ts
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
```

Call it at the top of both public methods. `MockLlamaAdapter` ignores `model` exactly as it ignores everything else today.

- [ ] **Step 5: Update the three affected specs**

In `local-llama.adapter.spec.ts`: mock `node:fs`'s `existsSync` to return `true`, pass `model: 'Qwen3.5-4B-Q4_K_M.gguf'`, and assert the argv still carries the joined absolute path. Add one case asserting `QuizModelNotFoundError` when `existsSync` returns false.

In `generate-quiz.handler.spec.ts`: drop the assertions about a resolved absolute path and assert the adapter received `model: 'Qwen3.5-4B-Q4_K_M.gguf'` instead. The fake adapter in that file implements `TextModelAdapter`.

- [ ] **Step 6: Run the learning module's tests**

Run: `pnpm --filter @app/backend test src/modules/learning`
Expected: PASS, no skipped cases.

- [ ] **Step 7: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/learning
git commit -m "refactor(backend): make the text-model port provider-neutral"
```

---

## Task 3: the OpenRouter adapter

**Files:**

- Create: `apps/backend/src/modules/learning/infra/openrouter.adapter.ts`
- Create: `apps/backend/src/modules/learning/infra/openrouter.adapter.spec.ts`

**Interfaces:**

- Consumes: `TextModelAdapter`, `CleanCuesRequest`, `GenerateQuestionsRequest`, `GeneratedQuizQuestion` from Task 2's `text-model.port.ts`; the prompts and schemas from `model-prompts.ts`; `AppConfig.hostedModel` from Task 1.
- Produces: `OpenRouterAdapter`, an `@Injectable()` class taking `AppConfig` in its constructor.

- [ ] **Step 1: Write the failing adapter test**

Create `openrouter.adapter.spec.ts`. `fetch` is stubbed on `globalThis`, so no network and no MSW:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { QuizGenerationFailedError } from '../domain/quiz/quiz.errors';
import { OpenRouterAdapter } from './openrouter.adapter';

import type { AppConfig, HostedModelConfig } from '../../../common/config/app-config';

const hostedModel: HostedModelConfig = {
  apiKey: 'sk-test',
  baseUrl: 'https://openrouter.test/api/v1',
  defaultModel: 'mistralai/mistral-nemo',
  timeoutMs: 1000,
  configured: true,
};

function adapter(): OpenRouterAdapter {
  return new OpenRouterAdapter({ hostedModel } as unknown as AppConfig);
}

/** Shapes one chat-completions answer whose message content is `content`. */
function answered(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenRouterAdapter.generateQuestions', () => {
  it('posts to chat/completions with the bearer key and a json_schema response format', async () => {
    fetchMock.mockResolvedValue(
      answered(JSON.stringify({ questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctOptionIndex: 2 }] })),
    );

    await adapter().generateQuestions({ model: 'openai/gpt-oss-120b', windowText: 'text', questionCount: 1 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.test/api/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect(body.response_format.type).toBe('json_schema');
    expect(body.messages[1].content).toContain('text');
  });

  it('parses the questions out of the message content', async () => {
    fetchMock.mockResolvedValue(
      answered(JSON.stringify({ questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctOptionIndex: 2 }] })),
    );

    const questions = await adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 });

    expect(questions).toEqual([{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctOptionIndex: 2 }]);
  });

  it('throws QuizGenerationFailedError on a non-2xx answer', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', { status: 429 }));

    await expect(adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 })).rejects.toBeInstanceOf(
      QuizGenerationFailedError,
    );
  });

  it('never puts the API key in the error message', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401 }));

    const error = await adapter()
      .generateQuestions({ model: 'm', windowText: 't', questionCount: 1 })
      .catch((e: unknown) => e as Error);

    expect(error).toBeInstanceOf(QuizGenerationFailedError);
    expect(error.message).not.toContain('sk-test');
  });

  it('throws when the content is not the expected JSON', async () => {
    fetchMock.mockResolvedValue(answered('not json at all'));

    await expect(adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 })).rejects.toBeInstanceOf(
      QuizGenerationFailedError,
    );
  });
});

describe('OpenRouterAdapter.cleanCues', () => {
  it('returns the corrected strings', async () => {
    fetchMock.mockResolvedValue(answered(JSON.stringify(['one', 'two'])));

    const cues = await adapter().cleanCues({ model: 'm', cueTexts: ['oen', 'tow'] });

    expect(cues).toEqual(['one', 'two']);
  });

  it('degrades to an empty array when the reply is not an array', async () => {
    fetchMock.mockResolvedValue(answered(JSON.stringify({ nope: true })));

    expect(await adapter().cleanCues({ model: 'm', cueTexts: ['a'] })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @app/backend test src/modules/learning/infra/openrouter.adapter.spec.ts`
Expected: FAIL, the module does not exist.

- [ ] **Step 3: Write the adapter**

Create `openrouter.adapter.ts`. Open it with a `WHY this file exists:` block covering three things: it is the hosted half of ADR-0012; it is deliberately simpler than `LocalLlamaAdapter` because `response_format: json_schema` returns clean JSON where `llama-completion` echoes its own prompt back; and `cleanCues` degrades to `[]` on a malformed reply because `applyCleanup` in `quiz-cleanup.ts` already treats a length mismatch as "keep the original text".

```ts
@Injectable()
export class OpenRouterAdapter implements TextModelAdapter {
  constructor(private readonly appConfig: AppConfig) {}

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

  async generateQuestions(req: GenerateQuestionsRequest): Promise<readonly GeneratedQuizQuestion[]> {
    const parsed = await this.complete({
      model: req.model,
      system: GENERATE_SYSTEM_PROMPT,
      user: req.windowText,
      schemaName: 'quiz_questions',
      schema: generateJsonSchema(),
      maxTokens: GENERATE_MAX_TOKENS,
    });
    const questions = (parsed as { questions?: unknown }).questions;
    if (!Array.isArray(questions)) throw new QuizGenerationFailedError('reply carried no questions array');
    return questions.map(toQuestion);
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
      throw new QuizGenerationFailedError(`provider answered ${response.status}`);
    }

    const content = extractContent(await response.json());
    try {
      return JSON.parse(content);
    } catch {
      throw new QuizGenerationFailedError('reply was not JSON');
    }
  }
}
```

The module-level helpers the class above depends on, in the same file:

```ts
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
```

`strict: true` in `response_format` makes a malformed question unlikely, not impossible: not every provider enforces the schema, and the free models listed in ADR-0012 mostly do not support structured outputs at all. `toQuestion` is what keeps an unenforced schema from reaching the database.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @app/backend test src/modules/learning/infra/openrouter.adapter.spec.ts`
Expected: PASS, all seven cases.

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/learning/infra
git commit -m "feat(backend): add an OpenRouter text-model adapter"
```

---

## Task 4: wire the provider switch

**Files:**

- Modify: `apps/backend/src/modules/learning/learning.module.ts` (the `TEXT_MODEL_ADAPTER` factory and its header comment)
- Create: `apps/backend/src/modules/learning/learning.module.spec.ts`

**Interfaces:**

- Consumes: everything from Tasks 1 to 3.
- Produces: a factory returning `MockLlamaAdapter` when `mode === 'mock'`, `OpenRouterAdapter` when `provider === 'openrouter'`, and `LocalLlamaAdapter` otherwise.

- [ ] **Step 1: Write the failing factory test**

Create `learning.module.spec.ts`:

```ts
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { AppConfig } from '../../common/config/app-config';
import { LocalLlamaAdapter } from './infra/local-llama.adapter';
import { MockLlamaAdapter } from './infra/mock-llama.adapter';
import { OpenRouterAdapter } from './infra/openrouter.adapter';
import { textModelAdapterFactory } from './learning.module';

function cfg(env: Record<string, string>): AppConfig {
  return new AppConfig(new ConfigService(env));
}

describe('textModelAdapterFactory', () => {
  it('returns the local adapter by default', () => {
    expect(textModelAdapterFactory(cfg({}))).toBeInstanceOf(LocalLlamaAdapter);
  });

  it('returns the OpenRouter adapter when the provider says so', () => {
    expect(textModelAdapterFactory(cfg({ LLM_PROVIDER: 'openrouter' }))).toBeInstanceOf(OpenRouterAdapter);
  });

  it('mock mode wins over the provider, so CI never leaves the machine', () => {
    expect(
      textModelAdapterFactory(cfg({ LLAMA_MODE: 'mock', LLM_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'sk-x' })),
    ).toBeInstanceOf(MockLlamaAdapter);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @app/backend test src/modules/learning/learning.module.spec.ts`
Expected: FAIL, `textModelAdapterFactory` is not exported.

- [ ] **Step 3: Extract and extend the factory**

In `learning.module.ts`, lift the inline `useFactory` into an exported named function so it is testable without booting Nest:

```ts
/**
 * Mock mode is checked first on purpose: LLAMA_MODE=mock is CI's guarantee
 * that no test reaches a network or a multi-gigabyte weight file, and a
 * stray OPENROUTER_API_KEY in an environment must not quietly undo it.
 */
export function textModelAdapterFactory(config: AppConfig): TextModelAdapter {
  if (config.quizGeneration.mode === 'mock') return new MockLlamaAdapter();
  if (config.quizGeneration.provider === 'openrouter') return new OpenRouterAdapter(config);
  return new LocalLlamaAdapter(config);
}
```

Point the provider entry at it (`useFactory: textModelAdapterFactory, inject: [AppConfig]`) and update the module's header comment, which currently describes the factory as "MockLlamaAdapter or LocalLlamaAdapter depending on AppConfig.quizGeneration.mode".

- [ ] **Step 4: Run the backend suite**

Run: `pnpm --filter @app/backend test`
Expected: PASS. Then `pnpm --filter @app/backend typecheck`.

- [ ] **Step 5: Verify against the running stack**

The Docker stack is normally already up, so check before starting anything: `docker ps --format '{{.Names}} {{.Status}}'`.

With a real key in the backend container's environment and `LLM_PROVIDER=openrouter`, generate one quiz from a lesson that has a transcript and confirm the proposal appears with questions in the transcript's language:

```sh
docker compose -f docker/compose.yml restart backend
# then POST /api/v1/lessons/{id}/quizzes as an admin and read the proposal back
```

Record what the run cost by reading the `usage` block the provider returns, and note it in the task entry. A lesson whose transcript is roughly 5600 characters should be well under a cent.

- [ ] **Step 6: Close the task**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/learning
git commit -m "feat(backend): select the text-model adapter by provider"
```

Move the `T-2026-09-17-lesson-summary-export` sub-steps that this plan covered from unchecked to checked in `specs/tasks/active.md`.

---

## What this plan does not cover

Two follow-on plans, each writing working software of its own:

1. **Lesson summaries** — ffmpeg scene extraction, the vision filter, the `LessonSummary` aggregate and its routes. Depends on this plan.
2. **Markdown export** — the renderer, the ZIP, the web entry point. Independent of both, and can run as a parallel lane.

One piece of debt this plan deliberately leaves: `quiz.modelFilename` in Prisma and in `QuizDto` now holds a provider model id when the hosted adapter runs, so the column name lies. Renaming it is a migration plus a spec change plus codegen, which does not belong in the middle of a provider switch. File it as a task rather than fixing it here.
