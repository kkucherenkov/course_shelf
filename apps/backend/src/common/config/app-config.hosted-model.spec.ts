/**
 * WHY this file exists:
 * Unit tests for the ADR-0012 provider switch and hosted-model config:
 *   - `quizGeneration.provider` defaults to 'local' and honours LLM_PROVIDER.
 *   - `hostedModel.configured` is a key-presence check, nothing more.
 *   - `hostedModel`'s endpoint, model and timeout default and can be overridden.
 *   - `hostedModel.baseUrl` strips a trailing slash so the adapter's
 *     `${baseUrl}/chat/completions` join never doubles a slash.
 */
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

  it('strips a trailing slash from the base URL', () => {
    const cfg = configWith({
      OPENROUTER_API_KEY: 'sk-test',
      OPENROUTER_BASE_URL: 'https://example.test/v1/',
    });
    expect(cfg.hostedModel.baseUrl).toBe('https://example.test/v1');
  });
});
