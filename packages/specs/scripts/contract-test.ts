import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const openapi = path.resolve(root, 'openapi/openapi.yaml');

const baseUrl = process.env['CONTRACT_TEST_BASE_URL'] ?? 'http://host.docker.internal:3000';

// Array-args + no shell: the env-provided base URL is passed as a single
// argv entry, so it can never be interpreted as shell syntax
// (CodeQL js/shell-command-injection-from-environment).
const args = [
  'run',
  '--rm',
  '-v',
  `${openapi}:/spec.yaml:ro`,
  '--add-host=host.docker.internal:host-gateway',
  'schemathesis/schemathesis:stable',
  'run',
  '--base-url',
  baseUrl,
  '--checks',
  'all',
  '--hypothesis-max-examples=25',
  '/spec.yaml',
];

console.warn(`\n$ docker ${args.join(' ')}`);
const result = spawnSync('docker', args, { stdio: 'inherit', cwd: root });
if (result.status !== 0) {
  // eslint-disable-next-line unicorn/no-process-exit -- CLI script; forward docker exit code to caller
  process.exit(result.status ?? 1);
}

console.warn('\n✓ Schemathesis contract tests passed.');
