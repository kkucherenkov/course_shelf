#!/usr/bin/env node
// Realtime namespace parity — asserts every Centrifugo namespace the AsyncAPI
// contract uses is declared in every Centrifugo configuration.
//
// WHY this exists: `scans:user:{userId}` was declared as a channel in
// packages/specs/asyncapi/centrifugo.yaml from the start, but no Centrifugo
// config ever declared the `scans` namespace. Centrifugo answers a publish or
// a subscribe on an undeclared namespace with error 102 "unknown channel", the
// backend publishes fire-and-forget, and the SPA shows a scan stuck at 0%.
// It failed that way in dev, prod and release alike for months, with nothing
// red anywhere — the unit tests mock Centrifugo, so they never saw it.
//
// Exit 0 on parity, 1 on drift (drift printed to stderr).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

interface Source {
  /** Path shown in the failure message. */
  readonly file: string;
  /** Namespace names the file declares. */
  readonly declared: ReadonlySet<string>;
}

/** Namespace = the part of a channel address before the first colon. */
function namespaceOf(address: string): string | undefined {
  const i = address.indexOf(':');
  return i > 0 ? address.slice(0, i) : undefined;
}

function read(file: string): string {
  return readFileSync(path.join(repo, file), 'utf8');
}

// ── Required: what the contract actually uses ───────────────────────────────
// Read the `address:` lines directly rather than pulling in a YAML parser the
// repository does not otherwise depend on. `address` is a channel-only key in
// AsyncAPI 3, and the guard below fails loudly if this stops matching.
const contractFile = 'packages/specs/asyncapi/centrifugo.yaml';
const required = new Map<string, string>(); // namespace → the address that needs it
for (const line of read(contractFile).split('\n')) {
  const m = /^\s+address:\s*"?([^"\s]+)"?\s*$/.exec(line);
  if (!m?.[1]) continue;
  const ns = namespaceOf(m[1]);
  if (ns !== undefined && !required.has(ns)) required.set(ns, m[1]);
}

if (required.size === 0) {
  process.stderr.write(
    `[realtime] no namespaced channels found in ${contractFile} — the parser no longer ` +
      `matches the contract it reads.\n`,
  );
  process.exit(1);
}

// ── Declared: what each deployment configures ───────────────────────────────
const namesOf = (json: string): Set<string> =>
  new Set((JSON.parse(json) as { name: string }[]).map((n) => n.name));

const devFile = 'docker/centrifugo/config.json';
const devConfig = JSON.parse(read(devFile)) as {
  channel?: { namespaces?: { name: string }[] };
};
const sources: Source[] = [
  {
    file: devFile,
    declared: new Set((devConfig.channel?.namespaces ?? []).map((n) => n.name)),
  },
];

for (const file of ['docker/compose.prod.yml', 'docker/compose.release.yml']) {
  const m = /CENTRIFUGO_CHANNEL_NAMESPACES: '(\[.*?\])'/.exec(read(file));
  if (!m?.[1]) {
    process.stderr.write(
      `[realtime] ${file}: no CENTRIFUGO_CHANNEL_NAMESPACES literal found — this check ` +
        `reads it with a regex, so a reformat here silently disarms it.\n`,
    );
    process.exit(1);
  }
  sources.push({ file, declared: namesOf(m[1]) });
}

// ── Compare ─────────────────────────────────────────────────────────────────
let drifted = false;
for (const source of sources) {
  const missing = [...required.keys()].filter((ns) => !source.declared.has(ns)).sort();
  if (missing.length > 0) {
    drifted = true;
    process.stderr.write(`[realtime] ${source.file} is missing ${missing.length} namespace(s):\n`);
    for (const ns of missing) process.stderr.write(`  • ${ns} — used by ${required.get(ns)}\n`);
  }
}

process.stdout.write(
  `[realtime] ${required.size} namespace(s) required by ${contractFile}: ` +
    `${[...required.keys()].sort().join(', ')}\n`,
);
process.stdout.write(`[realtime] checked ${sources.length} configuration(s)\n`);

process.exit(drifted ? 1 : 0);
