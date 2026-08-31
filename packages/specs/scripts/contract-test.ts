import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const openapi = path.resolve(root, 'openapi/openapi.yaml');

const baseUrl = process.env['CONTRACT_TEST_BASE_URL'] ?? 'http://host.docker.internal:3000';

/**
 * Better Auth bearer token for an account on the target stack.
 *
 * Without it schemathesis is answered 401/403 before any handler runs on 62 of
 * the 75 operations, so request bodies, response schemas and happy-path status
 * codes are never compared against the spec at all — the gate reads green
 * while checking only the unauthenticated surface (#321). `e2e.yml` mints one
 * against the freshly-booted stack; run it locally with
 *
 *   CONTRACT_TEST_BEARER_TOKEN=$(…) pnpm spec:contract-test
 *
 * Unset is a valid (weaker) run for someone poking at a stack they have no
 * credentials for — but not in CI, where it silently reverts the gate to the
 * blind spot #321 closed. `CONTRACT_TEST_REQUIRE_AUTH=1` turns the warning
 * into a failure; e2e.yml sets it, having just minted the token.
 *
 * This is not theoretical: the first CI run passed the token through
 * `$GITHUB_ENV` and the script still saw nothing, because Turbo 2 filters the
 * task environment (fixed by `passThroughEnv` in turbo.json). A warning was
 * the only signal, and warnings do not fail builds.
 */
const bearerToken = process.env['CONTRACT_TEST_BEARER_TOKEN'] ?? '';
const requireAuth = process.env['CONTRACT_TEST_REQUIRE_AUTH'] === '1';

// `--output-sanitize` is left at its default (on) so the token never reaches
// the CI log through a reported request.
const authArgs = bearerToken ? ['--header', `Authorization: Bearer ${bearerToken}`] : [];

if (!bearerToken) {
  const message =
    'CONTRACT_TEST_BEARER_TOKEN is unset — only the unauthenticated surface would be exercised.';
  if (requireAuth) {
    console.error(`\n✗ ${message} CONTRACT_TEST_REQUIRE_AUTH=1, so this is a failure.`);
    // eslint-disable-next-line unicorn/no-process-exit -- CLI script; nothing above main to throw to
    process.exit(1);
  }
  console.warn(`\n⚠ ${message}`);
}

// Array-args + no shell: the env-provided base URL is passed as a single
// argv entry, so it can never be interpreted as shell syntax
// (CodeQL js/shell-command-injection-from-environment).
const args = [
  'run',
  '--rm',
  '-v',
  `${openapi}:/spec.yaml:ro`,
  '--add-host=host.docker.internal:host-gateway',
  // Pinned, not `:stable`. That tag moved under us once already: the script
  // was written against schemathesis 3.x and, because nothing ran it, nobody
  // noticed until it was wired into CI and died on `--base-url`, a flag 4.x had
  // renamed. A gate whose tool version floats is not reproducible — the same
  // commit can pass today and fail tomorrow for reasons no one changed.
  'schemathesis/schemathesis:4.25.2',
  'run',
  // Schemathesis 4.x flags. The script was written against 3.x and had never
  // run — nothing invoked it until e2e.yml did, and the first execution died
  // with `Error: No such option '--base-url'. Did you mean '--url'?`.
  //   --base-url                  -> --url
  //   --hypothesis-max-examples=N -> --max-examples N
  //   --checks all                -> dropped; every check runs by default in
  //                                  4.x, and the flag now takes an explicit
  //                                  comma list (there is --exclude-checks to
  //                                  narrow). Dropping it keeps the intent:
  //                                  run everything.
  '--url',
  baseUrl,
  '--max-examples',
  '25',
  ...authArgs,
  '/spec.yaml',
];

// Echo the command, never the credential.
const printable = args.map((arg) =>
  bearerToken && arg.includes(bearerToken) ? 'Authorization: Bearer ***' : arg,
);
console.warn(`\n$ docker ${printable.join(' ')}`);
const result = spawnSync('docker', args, { stdio: 'inherit', cwd: root });
if (result.status !== 0) {
  // eslint-disable-next-line unicorn/no-process-exit -- CLI script; forward docker exit code to caller
  process.exit(result.status ?? 1);
}

console.warn('\n✓ Schemathesis contract tests passed.');
