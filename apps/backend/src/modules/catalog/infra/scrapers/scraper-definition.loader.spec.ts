// scraper-definition.loader.spec.ts
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ScraperDefinitionLoader } from './scraper-definition.loader';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'scraper-defs-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(name: string, content: unknown): void {
  writeFileSync(
    path.join(dir, name),
    typeof content === 'string' ? content : JSON.stringify(content),
  );
}

const loader = new ScraperDefinitionLoader();

describe('ScraperDefinitionLoader', () => {
  it('loads every valid definition in the directory', () => {
    write('a.json', {
      id: 'a-site',
      kinds: ['url'],
      match: { urlPattern: String.raw`^https://a\.test/` },
      rules: { title: { selector: 'h1', from: 'text' } },
    });
    write('b.json', {
      id: 'b-site',
      kinds: ['url'],
      match: { urlPattern: String.raw`^https://b\.test/` },
      rules: { title: { selector: 'h1', from: 'text' } },
    });

    const result = loader.load(dir, new Set());
    expect(result.errors).toEqual([]);
    expect(result.definitions.map((d) => d.id).toSorted()).toEqual(['a-site', 'b-site']);
  });

  it('returns an empty result for a missing directory, no error', () => {
    const result = loader.load(path.join(dir, 'does-not-exist'), new Set());
    expect(result).toEqual({ definitions: [], errors: [] });
  });

  it('reports an id colliding with a built-in and skips that file', () => {
    write('udemy2.json', {
      id: 'udemy',
      kinds: ['url'],
      match: { urlPattern: String.raw`^https://udemy2\.test/` },
      rules: {},
    });

    const result = loader.load(dir, new Set(['udemy']));
    expect(result.definitions).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.file).toContain('udemy2.json');
    expect(result.errors[0]?.reason).toMatch(/collides/);
  });

  it('one bad file among good ones leaves the good ones loaded', () => {
    write('good.json', {
      id: 'good-site',
      kinds: ['url'],
      match: { urlPattern: String.raw`^https://good\.test/` },
      rules: {},
    });
    write('bad.json', '{not valid json');

    const result = loader.load(dir, new Set());
    expect(result.definitions.map((d) => d.id)).toEqual(['good-site']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.file).toContain('bad.json');
  });
});
