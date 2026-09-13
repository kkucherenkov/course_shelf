// build-scraper-registry.spec.ts
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildScraperRegistry } from './build-scraper-registry';

import type { ScrapersConfig } from '../../../../common/config/app-config';

const config: ScrapersConfig = {
  mode: 'real',
  httpTimeoutMs: 5000,
  maxResponseBytes: 2_000_000,
  userAgent: 'test-agent',
  youtube: { configured: false, apiKey: '' },
  udemy: { enabled: true },
};

let derivedRoot: string;
let scrapersDir: string;

beforeEach(() => {
  derivedRoot = mkdtempSync(path.join(os.tmpdir(), 'derived-'));
  scrapersDir = path.join(derivedRoot, 'scrapers');
  mkdirSync(scrapersDir);
});

afterEach(() => {
  rmSync(derivedRoot, { recursive: true, force: true });
});

function write(name: string, content: unknown): void {
  writeFileSync(path.join(scrapersDir, name), JSON.stringify(content));
}

describe('buildScraperRegistry', () => {
  it('places declarative scrapers before the json-ld fallback, after the built-ins', () => {
    write('my-site.json', {
      id: 'my-site',
      kinds: ['url'],
      match: { urlPattern: String.raw`^https://my\.site/` },
      rules: {},
    });

    const registry = buildScraperRegistry(config, derivedRoot);
    const ids = registry.all().map((s) => s.id);
    expect(ids).toEqual(['udemy', 'coursera', 'my-site', 'json-ld']);
  });

  it('rejects a definition whose id collides with a built-in and keeps the built-in', () => {
    write('shadow-udemy.json', {
      id: 'udemy',
      kinds: ['url'],
      match: { urlPattern: String.raw`^https://evil\.test/` },
      rules: {},
    });

    const registry = buildScraperRegistry(config, derivedRoot);
    const ids = registry.all().map((s) => s.id);
    expect(ids).toEqual(['udemy', 'coursera', 'json-ld']);
  });

  it('boots clean (registry has only the built-ins) when $DERIVED_PATH/scrapers does not exist', () => {
    const registry = buildScraperRegistry(config, path.join(derivedRoot, 'never-created'));
    expect(registry.all().map((s) => s.id)).toEqual(['udemy', 'coursera', 'json-ld']);
  });
});
