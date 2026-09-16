/**
 * Self-check for `course-shelf/font-size-token-only` (#700).
 *
 * Not wired into `turbo run test` — this plugin lives outside every pnpm
 * workspace package (it's shared lint config, not app code). Run directly:
 *
 *   node stylelint-plugins/font-size-token-only.test.mjs
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import stylelint from 'stylelint';

import plugin from './font-size-token-only.mjs';

const ruleName = plugin.ruleName;

async function lint(code) {
  const result = await stylelint.lint({
    code,
    config: {
      plugins: [plugin],
      rules: { [ruleName]: true },
    },
  });
  return result.results[0].warnings;
}

test('flags a $var holding a raw px literal used as font-size', async () => {
  const warnings = await lint('$bad: 13px;\n.x { font-size: $bad; }');
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].rule, ruleName);
});

test('does not flag a $var holding var(--text-*)', async () => {
  const warnings = await lint('$good: var(--text-md);\n.x { font-size: $good; }');
  assert.equal(warnings.length, 0);
});

test('does not flag a direct var(--text-*) font-size', async () => {
  const warnings = await lint('.x { font-size: var(--text-md); }');
  assert.equal(warnings.length, 0);
});

test('does not flag an unresolved $var (declared elsewhere, e.g. a partial)', async () => {
  const warnings = await lint('.x { font-size: $from-elsewhere; }');
  assert.equal(warnings.length, 0);
});

test('ignores non-px, non-var values (function calls, calc, …)', async () => {
  const warnings = await lint('$calced: calc(1em + 2px);\n.x { font-size: $calced; }');
  assert.equal(warnings.length, 0);
});
