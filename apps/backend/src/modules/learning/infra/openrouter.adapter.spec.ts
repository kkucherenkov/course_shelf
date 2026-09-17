/**
 * WHY this file exists:
 * Unit coverage for OpenRouterAdapter's HTTP shape and its error mapping —
 * every non-2xx, timeout, malformed-content and malformed-question path has
 * to land on QuizGenerationFailedError, never a raw throw, and the API key
 * must never appear in any of them. `fetch` is stubbed on `globalThis`, so
 * none of this performs real network I/O.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  QuizGenerationFailedError,
  QuizGenerationNotConfiguredError,
} from '../domain/quiz/quiz.errors';
import { OpenRouterAdapter } from './openrouter.adapter';

import type { AppConfig, HostedModelConfig } from '../../../common/config/app-config';

const hostedModel: HostedModelConfig = {
  apiKey: 'sk-test',
  baseUrl: 'https://openrouter.test/api/v1',
  defaultModel: 'mistralai/mistral-nemo',
  timeoutMs: 1000,
  configured: true,
};

function adapter(config: Partial<HostedModelConfig> = {}): OpenRouterAdapter {
  return new OpenRouterAdapter({
    hostedModel: { ...hostedModel, ...config },
  } as unknown as AppConfig);
}

/** Shapes one chat-completions answer whose message content is `content`. */
function answered(content: string): Response {
  return Response.json(
    { choices: [{ message: { content } }] },
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  );
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenRouterAdapter.ensureModelUsable', () => {
  it('throws QuizGenerationNotConfiguredError when no API key is configured', async () => {
    await expect(
      adapter({ apiKey: '', configured: false }).ensureModelUsable('openai/gpt-oss-120b'),
    ).rejects.toBeInstanceOf(QuizGenerationNotConfiguredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves without calling the provider when an API key is configured', async () => {
    await expect(adapter().ensureModelUsable('openai/gpt-oss-120b')).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('OpenRouterAdapter.generateQuestions', () => {
  it('posts to chat/completions with the bearer key and a json_schema response format', async () => {
    fetchMock.mockResolvedValue(
      answered(
        JSON.stringify({
          questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctOptionIndex: 2 }],
        }),
      ),
    );

    await adapter().generateQuestions({
      model: 'openai/gpt-oss-120b',
      windowText: 'text',
      questionCount: 1,
    });

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(url).toBe('https://openrouter.test/api/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body as string) as {
      model: string;
      response_format: { type: string };
      messages: { content: string }[];
    };
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect(body.response_format.type).toBe('json_schema');
    expect(body.messages[1]?.content).toContain('text');
  });

  it('parses the questions out of the message content', async () => {
    fetchMock.mockResolvedValue(
      answered(
        JSON.stringify({
          questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctOptionIndex: 2 }],
        }),
      ),
    );

    const questions = await adapter().generateQuestions({
      model: 'm',
      windowText: 't',
      questionCount: 1,
    });

    expect(questions).toEqual([
      { prompt: 'q', options: ['a', 'b', 'c', 'd'], correctOptionIndex: 2 },
    ]);
  });

  it('throws QuizGenerationFailedError on a non-2xx answer', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', { status: 429 }));

    await expect(
      adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 }),
    ).rejects.toBeInstanceOf(QuizGenerationFailedError);
  });

  it('throws QuizGenerationFailedError, without the key, when fetch itself rejects', async () => {
    fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND openrouter.test'));

    let error: unknown;
    try {
      await adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 });
    } catch (error_) {
      error = error_;
    }

    expect(error).toBeInstanceOf(QuizGenerationFailedError);
    expect((error as Error).message).not.toContain('sk-test');
  });

  it('never puts the API key in the error message', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401 }));

    let error: unknown;
    try {
      await adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 });
    } catch (error_) {
      error = error_;
    }

    expect(error).toBeInstanceOf(QuizGenerationFailedError);
    expect((error as Error).message).not.toContain('sk-test');
  });

  it('throws when the content is not the expected JSON', async () => {
    fetchMock.mockResolvedValue(answered('not json at all'));

    await expect(
      adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 }),
    ).rejects.toBeInstanceOf(QuizGenerationFailedError);
  });

  it('throws when a 200 answer carries no choices', async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { choices: [] },
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await expect(
      adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 }),
    ).rejects.toBeInstanceOf(QuizGenerationFailedError);
  });

  it('throws when a question in the reply is malformed', async () => {
    fetchMock.mockResolvedValue(
      answered(
        JSON.stringify({
          questions: [{ prompt: 'q', options: ['a', 'b'], correctOptionIndex: 0 }],
        }),
      ),
    );

    await expect(
      adapter().generateQuestions({ model: 'm', windowText: 't', questionCount: 1 }),
    ).rejects.toBeInstanceOf(QuizGenerationFailedError);
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
