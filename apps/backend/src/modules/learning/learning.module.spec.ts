/**
 * WHY this file exists:
 * `textModelAdapterFactory` picks between three adapters (mock, hosted,
 * local) with a precedence rule that matters for CI safety — see the
 * function's own doc comment in learning.module.ts. That precedence is
 * exactly the kind of one-line decision a booted-Nest e2e test would bury
 * under fixture setup, so it gets a plain unit test instead.
 */
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
    expect(textModelAdapterFactory(cfg({ LLM_PROVIDER: 'openrouter' }))).toBeInstanceOf(
      OpenRouterAdapter,
    );
  });

  it('mock mode wins over the provider, so CI never leaves the machine', () => {
    expect(
      textModelAdapterFactory(
        cfg({ LLAMA_MODE: 'mock', LLM_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'sk-x' }),
      ),
    ).toBeInstanceOf(MockLlamaAdapter);
  });
});
