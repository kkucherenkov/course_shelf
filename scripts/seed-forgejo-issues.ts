#!/usr/bin/env node
/**
 * Seed every roadmap card in `docs/roadmap/tasks/E*.md` as a Forgejo issue.
 *
 * - Idempotent: re-running matches existing issues by `[card-id] ` prefix in
 *   the title and updates body / state instead of creating a duplicate.
 * - Two passes: create all issues first, then rewrite dependency links to
 *   in-repo `#NN` references and apply open / closed state.
 * - Labels per epic (`epic:E04`), per feature (`feature:E04-F02`), and per
 *   stage (`stage:A` | `stage:B`) are created up front and attached to each
 *   issue.
 *
 * Token discovery (in priority order):
 *   1. `FORGEJO_TOKEN` env var
 *   2. `tea` CLI config at `~/Library/Application Support/tea/config.yml`
 *      (macOS) — entry whose URL matches `FORGEJO_URL`
 *
 * CLI flags:
 *   --dry-run         print would-be requests without calling the API
 *   --print-map       print the card-id → issue-number map and exit
 *                     (uses existing issues, doesn't create or reconcile)
 *   --lookup=<id>     print only the issue number for one card (e.g. E13-F02-S07)
 *   --owner=<owner>   default kkucherenkov
 *   --repo=<repo>     default course_shelf
 *   --url=<url>       default http://code.homelab.local
 *   --tea-login=<n>   tea config entry name (default: first matching the URL)
 */

import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// CLI args
const argv = new Map<string, string>();
for (const raw of process.argv.slice(2)) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(raw);
  if (m) argv.set(m[1]!, m[2] ?? 'true');
}

const dryRun = argv.has('dry-run');
const owner = argv.get('owner') ?? 'kkucherenkov';
const repo = argv.get('repo') ?? 'course_shelf';
const baseUrl = (argv.get('url') ?? 'http://code.homelab.local').replace(/\/+$/, '');

// Token discovery — env var wins, fall back to tea config on disk.
function readTeaToken(loginName?: string): string | null {
  const candidates = [
    process.env['XDG_CONFIG_HOME']
      ? path.join(process.env['XDG_CONFIG_HOME'], 'tea', 'config.yml')
      : null,
    path.join(homedir(), '.config', 'tea', 'config.yml'),
    path.join(homedir(), 'Library', 'Application Support', 'tea', 'config.yml'),
  ].filter(Boolean) as string[];
  for (const file of candidates) {
    try {
      const text = readFileSync(file, 'utf8');
      const blocks = text.split(/\n(?=\s*-\s*name:)/);
      for (const block of blocks) {
        const name = /name:\s*(\S+)/.exec(block)?.[1];
        const url = /url:\s*(\S+)/.exec(block)?.[1];
        const token = /token:\s*(\S+)/.exec(block)?.[1];
        if (!token) continue;
        if (loginName && name === loginName) return token;
        if (!loginName && url && url.replace(/\/+$/, '') === baseUrl) return token;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

const token = process.env['FORGEJO_TOKEN'] ?? readTeaToken(argv.get('tea-login'));
if (!token) {
  console.error(
    '[seed] no Forgejo token. Set FORGEJO_TOKEN or run `tea login add` for the matching URL.',
  );
  process.exit(1);
}

// API client
const apiBase = `${baseUrl}/api/v1`;
const headers = {
  Authorization: `token ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

interface Issue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
}

interface Label {
  id: number;
  name: string;
  color: string;
}

async function call<T>(method: string, p: string, body?: unknown): Promise<T> {
  if (dryRun && method !== 'GET') {
    console.warn(`[dry-run] ${method} ${p} ${body ? JSON.stringify(body).slice(0, 100) : ''}`);
    return undefined as unknown as T;
  }
  const res = await fetch(`${apiBase}${p}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${p} → ${String(res.status)} ${res.statusText}\n${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function listAll<T>(p: string): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  while (true) {
    const sep = p.includes('?') ? '&' : '?';
    const batch = await call<T[]>('GET', `${p}${sep}page=${String(page)}&limit=50`);
    if (!batch || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 50) break;
    page++;
  }
  return out;
}

// Card parsing
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const tasksDir = path.join(repoRoot, 'docs', 'roadmap', 'tasks');

interface Card {
  id: string;
  title: string;
  body: string;
  done: boolean;
  epic: string;
  feature: string;
  stage: 'A' | 'B' | null;
  deps: string[];
}

const CARD_ID_RE = /\b(E\d{2}-F\d{2}-S\d{2})\b/g;
const FILE_LINK_RE = /\[(E\d{2}-F\d{2}-S\d{2})\]\(\.\/E\d{2}-F\d{2}-S\d{2}\.md\)/g;

function parseCard(file: string): Card {
  const id = path.basename(file, '.md');
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const h1 = lines.find((l) => l.startsWith('# ')) ?? `# ${id}`;
  const title = h1.replace(/^#\s*/, '');
  const done = /\*\*Status:\*\*\s+✅\s+Done/i.test(text);
  const stageMatch = /\*\*Stage:\*\*\s+([AB])/i.exec(text);
  const stage = (stageMatch?.[1] as 'A' | 'B' | undefined) ?? null;
  const [epic, feature] = id.split('-') as [string, string, string];
  const depsBlock = /## Dependencies\s*\n([\s\S]*?)(?=\n## |\n---|$)/.exec(text)?.[1] ?? '';
  const deps = [...new Set([...depsBlock.matchAll(CARD_ID_RE)].map((m) => m[1]!))].filter(
    (d) => d !== id,
  );
  return { id, title, body: text, done, epic, feature: `${epic}-${feature}`, stage, deps };
}

const cardFiles = readdirSync(tasksDir)
  .filter((f) => /^E\d{2}-F\d{2}-S\d{2}\.md$/.test(f))
  .map((f) => path.join(tasksDir, f))
  .sort();
const cards: Card[] = cardFiles.map(parseCard);
console.warn(`[seed] parsed ${String(cards.length)} cards`);

// Labels
const EPIC_COLOR = '#1f6feb';
const FEATURE_COLOR = '#8957e5';
const STAGE_COLOR = '#3fb950';

const requiredLabels = new Map<string, string>();
for (const card of cards) {
  requiredLabels.set(`epic:${card.epic}`, EPIC_COLOR);
  requiredLabels.set(`feature:${card.feature}`, FEATURE_COLOR);
  if (card.stage) requiredLabels.set(`stage:${card.stage}`, STAGE_COLOR);
}

async function ensureLabels(): Promise<Map<string, number>> {
  console.warn(`[seed] ensuring ${String(requiredLabels.size)} labels`);
  const existing = await listAll<Label>(`/repos/${owner}/${repo}/labels`);
  const byName = new Map(existing.map((l) => [l.name, l.id]));
  for (const [name, color] of requiredLabels) {
    if (byName.has(name)) continue;
    const created = await call<Label>('POST', `/repos/${owner}/${repo}/labels`, {
      name,
      color,
      description: '',
    });
    if (created) byName.set(name, created.id);
  }
  return byName;
}

// Body builder — rewrites card-id references to `#NN` Forgejo cross-refs.
function buildBody(card: Card, idToIssue: Map<string, number>): string {
  let body = card.body.replace(FILE_LINK_RE, (whole, ref: string) => {
    const num = idToIssue.get(ref);
    return num ? `#${String(num)} \`${ref}\`` : whole;
  });
  body = body.replace(CARD_ID_RE, (id) => {
    if (id === card.id) return id;
    const num = idToIssue.get(id);
    return num ? `#${String(num)} \`${id}\`` : id;
  });
  const footer = [
    '',
    '---',
    `_Source: \`docs/roadmap/tasks/${card.id}.md\`. This issue is mirrored from the in-repo card; the card stays the source of truth._`,
  ].join('\n');
  return body + footer;
}

// Pass 1: create / match issues by title prefix.
interface CreateIssueRequest {
  title: string;
  body: string;
  labels?: number[];
  closed?: boolean;
}

async function ensureIssues(labelIds: Map<string, number>): Promise<Map<string, number>> {
  console.warn(`[seed] listing existing issues`);
  const existing = await listAll<Issue>(`/repos/${owner}/${repo}/issues?state=all&type=issues`);
  const byTitlePrefix = new Map<string, Issue>();
  const titlePrefixRe = /^\[(E\d{2}-F\d{2}-S\d{2})\]/;
  for (const issue of existing) {
    const m = titlePrefixRe.exec(issue.title);
    if (m) byTitlePrefix.set(m[1]!, issue);
  }

  const idToIssue = new Map<string, number>();
  let created = 0;
  let matched = 0;
  for (const card of cards) {
    const found = byTitlePrefix.get(card.id);
    if (found) {
      idToIssue.set(card.id, found.number);
      matched++;
      continue;
    }
    const labels = [
      labelIds.get(`epic:${card.epic}`),
      labelIds.get(`feature:${card.feature}`),
      card.stage ? labelIds.get(`stage:${card.stage}`) : undefined,
    ].filter((x): x is number => typeof x === 'number');
    const req: CreateIssueRequest = {
      title: `[${card.id}] ${card.title.replace(/^E\d{2}-F\d{2}-S\d{2}\s*[—-]\s*/, '')}`,
      body: card.body,
      labels,
    };
    const issue = await call<Issue>('POST', `/repos/${owner}/${repo}/issues`, req);
    if (issue) idToIssue.set(card.id, issue.number);
    created++;
    if (created % 10 === 0) console.warn(`[seed] created ${String(created)} so far`);
  }
  console.warn(`[seed] pass 1 done: ${String(matched)} matched, ${String(created)} created`);
  return idToIssue;
}

// Pass 2: rewrite bodies + apply state.
async function reconcileIssues(idToIssue: Map<string, number>): Promise<void> {
  console.warn(`[seed] pass 2: rewrite bodies + apply open/closed state`);
  const existing = await listAll<Issue>(`/repos/${owner}/${repo}/issues?state=all&type=issues`);
  const byNumber = new Map(existing.map((i) => [i.number, i]));

  let updated = 0;
  for (const card of cards) {
    const num = idToIssue.get(card.id);
    if (!num) continue;
    const desired = buildBody(card, idToIssue);
    const desiredState: 'open' | 'closed' = card.done ? 'closed' : 'open';
    const live = byNumber.get(num);
    if (live && live.body === desired && live.state === desiredState) continue;
    await call('PATCH', `/repos/${owner}/${repo}/issues/${String(num)}`, {
      body: desired,
      state: desiredState,
    });
    updated++;
  }
  console.warn(`[seed] pass 2 done: ${String(updated)} updated`);
}

async function loadIssueMap(): Promise<Map<string, number>> {
  const existing = await listAll<Issue>(`/repos/${owner}/${repo}/issues?state=all&type=issues`);
  const titlePrefixRe = /^\[(E\d{2}-F\d{2}-S\d{2})\]/;
  const map = new Map<string, number>();
  for (const issue of existing) {
    const m = titlePrefixRe.exec(issue.title);
    if (m) map.set(m[1]!, issue.number);
  }
  return map;
}

// Main
(async (): Promise<void> => {
  // --lookup=<id>: print just the issue number for one card.
  const lookup = argv.get('lookup');
  if (lookup) {
    const map = await loadIssueMap();
    const num = map.get(lookup);
    if (num === undefined) {
      console.error(`[seed] no issue found for ${lookup}`);
      process.exit(1);
    }
    console.log(String(num));
    return;
  }

  // --print-map: dump all card-id → issue-number pairs and exit.
  if (argv.has('print-map')) {
    const map = await loadIssueMap();
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [id, num] of sorted) {
      console.log(`${id}\t#${String(num)}`);
    }
    return;
  }

  const labelIds = await ensureLabels();
  const idToIssue = await ensureIssues(labelIds);
  await reconcileIssues(idToIssue);
  console.warn(`[seed] all done. ${String(idToIssue.size)} issues mapped.`);
})().catch((err: unknown) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
