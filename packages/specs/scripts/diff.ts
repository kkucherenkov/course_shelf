import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Breaking-change detection for packages/specs/openapi/openapi.yaml.
 *
 * Compares the current bundled spec against the bundled spec at a base ref
 * (default: origin/main → fallback main) using oasdiff. Non-zero exit ≙
 * breaking change detected.
 *
 * Run locally:  pnpm --filter @app/specs diff
 * Run in CI:    pnpm --filter @app/specs diff -- --base origin/main
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const specsRoot = path.resolve(here, '..');
const repoRoot = path.resolve(specsRoot, '..', '..');

function arg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? (process.argv[idx + 1] ?? fallback) : fallback;
}

function hasRef(ref: string): boolean {
  return spawnSync('git', ['rev-parse', '--verify', ref], { cwd: repoRoot }).status === 0;
}

function resolveBase(): string {
  const explicit = arg('base', '');
  if (explicit) return explicit;
  if (hasRef('origin/main')) return 'origin/main';
  if (hasRef('main')) return 'main';
  console.warn('[spec:diff] no origin/main or main ref — skipping (nothing to diff against).');
  // eslint-disable-next-line unicorn/no-process-exit -- CLI script; exit(0) signals "skip, not failure"
  process.exit(0);
}

const base = resolveBase();
const tmp = mkdtempSync(path.join(tmpdir(), 'oasdiff-'));
const baseSpec = path.join(tmp, 'base.yaml');
const headSpec = path.join(tmp, 'head.yaml');

// Array-args + no shell: `base` comes from a CLI flag, and interpolating it
// into a shell string would let quoting characters escape the git command
// (CodeQL js/indirect-command-line-injection).
function gitShow(ref: string, file: string): Buffer {
  const result = spawnSync('git', ['show', `${ref}:${file}`], { cwd: repoRoot });
  if (result.status !== 0) {
    throw new Error(`git show ${ref}:${file} failed:\n${result.stderr.toString()}`);
  }
  return result.stdout;
}

try {
  const specPath = 'packages/specs/openapi/openapi.yaml';
  writeFileSync(baseSpec, gitShow(base, specPath));
  writeFileSync(headSpec, gitShow('HEAD', specPath));

  console.warn(`[spec:diff] base=${base} head=HEAD`);

  if (!hasOasdiff()) {
    console.error(
      '[spec:diff] oasdiff not installed. Install with:\n' +
        '  go install github.com/tufin/oasdiff@latest\n' +
        '  # or: curl -sSfL https://raw.githubusercontent.com/tufin/oasdiff/main/install.sh | sh',
    );
    // eslint-disable-next-line unicorn/no-process-exit -- CLI script; exit code 2 = tool missing
    process.exit(2);
  }

  const result = spawnSync('oasdiff', ['breaking', baseSpec, headSpec, '--fail-on', 'ERR'], {
    stdio: 'inherit',
  });
  // eslint-disable-next-line unicorn/no-process-exit -- CLI script; forward oasdiff exit code to caller
  process.exit(result.status ?? 1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

function hasOasdiff(): boolean {
  return spawnSync('oasdiff', ['--version'], { stdio: 'ignore' }).status === 0;
}

// Appease TS — file-level `throw`-less path needs no export.
if (!existsSync(specsRoot)) throw new Error('unreachable');
