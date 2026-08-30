import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const openapi = path.resolve(root, 'openapi/openapi.yaml');
const asyncapi = path.resolve(root, 'asyncapi/centrifugo.yaml');

function run(cmd: string): void {
  console.warn(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

run(`pnpm exec redocly lint "${openapi}"`);
run(`pnpm exec asyncapi validate "${asyncapi}"`);

/**
 * Redocly will not catch this one, and it costs a production 400.
 *
 * `multipleOf: 0.01` reads as "two decimal places", but ajv — which is what
 * `express-openapi-validator` runs against every request — enforces it as
 * `value / 0.01` landing on an integer. In IEEE-754 that is a coin toss:
 * 4.68 / 0.01 is 467.99999999999994 and 0.07 / 0.01 is 7.000000000000001, so
 * both are rejected, while 2.31, 3.29 and 4.99 divide cleanly and pass. ajv
 * has a `multipleOfPrecision` remedy, but `express-openapi-validator` exposes
 * no way to reach it: `validateRequests` takes `ValidateRequestOpts`, which
 * does not extend ajv's options.
 *
 * So a fractional `multipleOf` is a constraint this stack cannot honour, and
 * the failure is silent until a user happens to send the wrong number. Say so
 * here rather than rediscovering it from a contract-test run.
 */
function assertNoFractionalMultipleOf(file: string): void {
  const offenders = readFileSync(file, 'utf8')
    .split('\n')
    .map((line, i) => ({ line, lineNumber: i + 1 }))
    .filter(({ line }) => {
      const match = /^\s*multipleOf:\s*(\S+)/.exec(line);
      return match !== null && !Number.isInteger(Number(match[1]));
    });

  if (offenders.length > 0) {
    const where = offenders
      .map(({ line, lineNumber }) => `  ${path.basename(file)}:${String(lineNumber)} —${line}`)
      .join('\n');
    throw new Error(
      `Fractional \`multipleOf\` is unenforceable through ajv and rejects valid input:\n${where}\n` +
        'Drop it and state the precision in `description`; the column type does the rounding.',
    );
  }
}

assertNoFractionalMultipleOf(openapi);

console.warn('\n✓ OpenAPI and AsyncAPI documents are valid.');
