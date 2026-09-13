import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config';

function configWith(env: Record<string, string>): AppConfig {
  return new AppConfig(new ConfigService(env));
}

// One scratch directory per file, cleaned up by the OS — these tests never
// write more than a few empty files, so there's nothing worth an afterEach rm.
const scratchDir = mkdtempSync(path.join(os.tmpdir(), 'app-config-transcription-'));

function existingFile(name: string): string {
  const p = path.join(scratchDir, name);
  writeFileSync(p, '');
  return p;
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
  it('defaults to whisper-cli, six hours, four threads, auto language, real mode, unconfigured', () => {
    expect(configWith({}).transcription).toEqual({
      whisperPath: 'whisper-cli',
      modelPath: '',
      timeoutMs: 21_600_000,
      threads: 4,
      language: 'auto',
      mode: 'real',
      configured: false,
    });
  });

  it('mock mode is configured with no model path at all', () => {
    const cfg = configWith({ WHISPER_MODE: 'mock' }).transcription;
    expect(cfg.mode).toBe('mock');
    expect(cfg.modelPath).toBe('');
    expect(cfg.configured).toBe(true);
  });

  it('a model path pointing at a file that does not exist is NOT configured', () => {
    const cfg = configWith({ WHISPER_MODEL_PATH: '/does/not/exist/ggml-base.bin' }).transcription;
    expect(cfg.configured).toBe(false);
    expect(cfg.modelPath).toBe('/does/not/exist/ggml-base.bin');
  });

  it('a model path pointing at a file that exists is configured', () => {
    const modelPath = existingFile('ggml-base.bin');
    const cfg = configWith({ WHISPER_MODEL_PATH: modelPath }).transcription;
    expect(cfg.configured).toBe(true);
    expect(cfg.modelPath).toBe(modelPath);
  });

  it('reads every override', () => {
    const modelPath = existingFile('ggml-medium.bin');
    expect(
      configWith({
        WHISPER_PATH: '/opt/whisper/whisper-cli',
        WHISPER_MODEL_PATH: modelPath,
        WHISPER_TIMEOUT_MS: '3600000',
        WHISPER_THREADS: '2',
        WHISPER_LANGUAGE: 'ru',
        WHISPER_MODE: 'real',
      }).transcription,
    ).toEqual({
      whisperPath: '/opt/whisper/whisper-cli',
      modelPath,
      timeoutMs: 3_600_000,
      threads: 2,
      language: 'ru',
      mode: 'real',
      configured: true,
    });
  });
});
