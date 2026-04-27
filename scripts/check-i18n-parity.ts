#!/usr/bin/env node
// i18n parity check — asserts that every locale exposes the same key set.
// Exit 0 on parity, 1 on drift (drift printed to stderr).

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

interface Bucket {
  source: string;
  byLocale: Map<string, Set<string>>;
}

const buckets: Bucket[] = [];

function collectKeys(value: unknown, prefix: string, out: Set<string>): void {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    out.add(prefix);
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    collectKeys(child, prefix ? `${prefix}.${key}` : key, out);
  }
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8')) as unknown;
}

// ── backend (nestjs-i18n): apps/backend/src/i18n/<locale>/*.json
const backendRoot = path.join(repo, 'apps/backend/src/i18n');
try {
  const locales = readdirSync(backendRoot).filter((entry) =>
    statSync(path.join(backendRoot, entry)).isDirectory(),
  );
  const bucket: Bucket = { source: 'backend', byLocale: new Map() };
  for (const locale of locales) {
    const dir = path.join(backendRoot, locale);
    const keys = new Set<string>();
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const ns = path.basename(file, '.json');
      collectKeys(readJson(path.join(dir, file)), ns, keys);
    }
    bucket.byLocale.set(locale, keys);
  }
  if (bucket.byLocale.size > 1) buckets.push(bucket);
} catch {
  // no backend i18n yet — skip
}

// ── mobile (slang): apps/mobile/lib/i18n/<namespace>_<locale>.i18n.json
const mobileRoot = path.join(repo, 'apps/mobile/lib/i18n');
try {
  const bucket: Bucket = { source: 'mobile', byLocale: new Map() };
  for (const file of readdirSync(mobileRoot).filter((f) => f.endsWith('.i18n.json'))) {
    const match = /^(.+)_([a-z]{2})\.i18n\.json$/.exec(file);
    if (!match) continue;
    const ns = match[1];
    const locale = match[2];
    const keys = bucket.byLocale.get(locale) ?? new Set<string>();
    collectKeys(readJson(path.join(mobileRoot, file)), ns, keys);
    bucket.byLocale.set(locale, keys);
  }
  if (bucket.byLocale.size > 1) buckets.push(bucket);
} catch {
  // skip
}

// ── web: TS locale modules at apps/web/i18n/locales/<locale>.ts
//
// The old SFC `<i18n lang="json">` block pattern is forbidden — see
// `.claude/docs/i18n.md`. Each locale is now a `.ts` module with a single
// `export default { ... }`. We parse the messages tree by dynamic import.
{
  const localesDir = path.join(repo, 'apps/web/i18n/locales');
  try {
    const entries = readdirSync(localesDir).filter((f) => f.endsWith('.ts'));
    const bucket: Bucket = { source: 'web', byLocale: new Map() };
    for (const entry of entries) {
      const locale = entry.replace(/\.ts$/, '');
      const mod = (await import(path.join(localesDir, entry))) as { default: unknown };
      const keys = new Set<string>();
      collectKeys(mod.default, '', keys);
      bucket.byLocale.set(locale, keys);
    }
    if (bucket.byLocale.size > 1) buckets.push(bucket);
  } catch {
    // skip
  }
}

// ── report
let drifted = false;
for (const bucket of buckets) {
  const locales = [...bucket.byLocale.keys()].sort();
  const union = new Set<string>();
  for (const set of bucket.byLocale.values()) for (const k of set) union.add(k);
  for (const locale of locales) {
    const got = bucket.byLocale.get(locale)!;
    const missing = [...union].filter((k) => !got.has(k)).sort();
    if (missing.length > 0) {
      drifted = true;
      process.stderr.write(`[i18n] ${bucket.source}/${locale} missing ${missing.length} key(s):\n`);
      for (const k of missing.slice(0, 10)) process.stderr.write(`  • ${k}\n`);
      if (missing.length > 10) process.stderr.write(`  … and ${missing.length - 10} more\n`);
    }
  }
  process.stdout.write(
    `[i18n] ${bucket.source}: ${locales.length} locale(s) × ${union.size} key(s)\n`,
  );
}

if (buckets.length === 0) {
  process.stdout.write('[i18n] no multi-locale sources found — nothing to check.\n');
}

process.exit(drifted ? 1 : 0);
