import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config';

function configWith(env: Record<string, string>): AppConfig {
  return new AppConfig(new ConfigService(env));
}

describe('AppConfig.scrapers', () => {
  it('defaults to real mode with sane http limits and no youtube key', () => {
    const cfg = configWith({}).scrapers;
    expect(cfg.mode).toBe('real');
    expect(cfg.httpTimeoutMs).toBe(10_000);
    expect(cfg.maxResponseBytes).toBe(2_000_000);
    expect(cfg.userAgent).toContain('courseShelf');
    expect(cfg.youtube.configured).toBe(false);
    expect(cfg.udemy.enabled).toBe(true);
  });

  it('marks youtube configured when an API key is present', () => {
    const cfg = configWith({ YOUTUBE_API_KEY: 'AIzaSyExample' }).scrapers;
    expect(cfg.youtube.configured).toBe(true);
    expect(cfg.youtube.apiKey).toBe('AIzaSyExample');
  });

  it('honors mock mode and disabled udemy', () => {
    const cfg = configWith({ SCRAPERS_MODE: 'mock', SCRAPERS_UDEMY_ENABLED: 'false' }).scrapers;
    expect(cfg.mode).toBe('mock');
    expect(cfg.udemy.enabled).toBe(false);
  });
});
