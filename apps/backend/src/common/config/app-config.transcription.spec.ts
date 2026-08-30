import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config';

function configWith(env: Record<string, string>): AppConfig {
  return new AppConfig(new ConfigService(env));
}

describe('AppConfig.derivedPath', () => {
  it('defaults to /data/derived', () => {
    expect(configWith({}).derivedPath).toBe('/data/derived');
  });

  it('honours DERIVED_PATH', () => {
    expect(configWith({ DERIVED_PATH: '/mnt/derived' }).derivedPath).toBe('/mnt/derived');
  });
});

describe('AppConfig.transcription', () => {
  it('defaults to whisper-cli, six hours, four threads, auto language, unconfigured', () => {
    expect(configWith({}).transcription).toEqual({
      whisperPath: 'whisper-cli',
      modelPath: '',
      timeoutMs: 21_600_000,
      threads: 4,
      language: 'auto',
      configured: false,
    });
  });

  it('is configured once a model path is present', () => {
    const cfg = configWith({ WHISPER_MODEL_PATH: '/models/ggml-base.bin' }).transcription;
    expect(cfg.configured).toBe(true);
    expect(cfg.modelPath).toBe('/models/ggml-base.bin');
  });

  it('reads every override', () => {
    expect(
      configWith({
        WHISPER_PATH: '/opt/whisper/whisper-cli',
        WHISPER_MODEL_PATH: '/models/ggml-medium.bin',
        WHISPER_TIMEOUT_MS: '3600000',
        WHISPER_THREADS: '2',
        WHISPER_LANGUAGE: 'ru',
      }).transcription,
    ).toEqual({
      whisperPath: '/opt/whisper/whisper-cli',
      modelPath: '/models/ggml-medium.bin',
      timeoutMs: 3_600_000,
      threads: 2,
      language: 'ru',
      configured: true,
    });
  });
});
