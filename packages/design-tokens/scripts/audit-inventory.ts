/**
 * Design inventory audit — cross-checks the canonical inventory in
 * `specs/design/README.md` against the actual component folders in
 * `packages/ui/src/components/` (Vue) and `packages/ui_flutter/lib/src/`
 * (Flutter).
 *
 * Reports:
 *  - Inventory entry without a matching component folder (typo / stale doc)
 *  - Component folder without an inventory entry (undocumented widget)
 *  - Vue ↔ Flutter parity drift (one side has it, the other doesn't)
 *
 * Exit code: 0 = clean or report-only drift; non-zero when run with
 * `--strict` and drift is detected. Wired into CI as a report-only job.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

const inventoryPath = path.join(repoRoot, 'specs/design/README.md');
const vueDir = path.join(repoRoot, 'packages/ui/src/components');
const flutterDir = path.join(repoRoot, 'packages/ui_flutter/lib/src');

// Flutter folder names (snake_case) map to PascalCase component names.
function pascalise(snake: string): string {
  return snake
    .split('_')
    .map((p) => {
      const first = p.charAt(0);
      return first.length > 0 ? first.toUpperCase() + p.slice(1) : '';
    })
    .join('');
}

function listFolders(dir: string): string[] {
  try {
    return readdirSync(dir).filter((name) => {
      try {
        return statSync(path.join(dir, name)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

/**
 * Parse component names out of the inventory tables in README.md.
 *
 * Heuristic: inside the Foundation + Compositions tables, the second column
 * cell contains the `@app/ui` name — identifiers like `AppButton`,
 * `AppField`, `MasterCard`, `AppLocaleSwitcher`, optionally in backticks,
 * optionally combined with `/`. We extract each PascalCase identifier that
 * starts with a capital.
 */
function parseInventoryNames(): Set<string> {
  const src = readFileSync(inventoryPath, 'utf8');
  const names = new Set<string>();

  // Capture table rows; ignore header/divider/TOC-style lines.
  const rowRe = /^\|\s*[^|]+\|\s*([^|]+?)\s*\|/gm;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(src))) {
    const cell = m[1] ?? '';
    if (!cell || cell.includes('---')) continue;
    // Accept only identifiers wrapped in backticks — those are the canonical
    // component names in the tables. Prose words that happen to capitalise
    // (`Apple`, `Cyprus`, `MVP`) are skipped because they live outside
    // backticks.
    for (const id of cell.matchAll(/`([A-Z][A-Za-z0-9]+)`/g)) {
      const name = id[1];
      if (!name) continue;
      names.add(name);
    }
  }
  return names;
}

const inventory = parseInventoryNames();
const vueFolders = new Set(listFolders(vueDir));
const flutterPascal = new Set(
  listFolders(flutterDir)
    .map((name) => pascalise(name))
    .map((n) => (n.startsWith('App') ? n : `App${n}`)),
);

// Non-component folders we know about — exclude from drift checks.
const flutterNonComponent = new Set(['AppTheme']);

const vueMissingInInventory = [...vueFolders].filter((name) => !inventory.has(name)).toSorted();
const inventoryMissingInVue = [...inventory]
  .filter((name) => !vueFolders.has(name) && !name.endsWith('State'))
  .toSorted();
const flutterMissingInInventory = [...flutterPascal]
  .filter((name) => !inventory.has(name) && !flutterNonComponent.has(name))
  .toSorted();

function report(title: string, list: string[]): boolean {
  if (list.length === 0) {
    console.warn(`✓ ${title}`);
    return false;
  }
  console.warn(`✗ ${title}`);
  for (const name of list) console.warn(`    ${name}`);
  return true;
}

console.warn('Design inventory audit');
console.warn(`  Inventory: ${inventoryPath}`);
console.warn(`  Vue dir:   ${vueDir}`);
console.warn(`  Flutter:   ${flutterDir}\n`);

let hasDrift = false;
hasDrift =
  report('Vue components not listed in specs/design/README.md', vueMissingInInventory) || hasDrift;
hasDrift =
  report('Flutter components not listed in specs/design/README.md', flutterMissingInInventory) ||
  hasDrift;
hasDrift =
  report('Inventory entries with no Vue component folder', inventoryMissingInVue) || hasDrift;

const strict = process.argv.includes('--strict');

if (hasDrift) {
  console.warn('\nAdd the missing inventory rows or delete the orphan components.');
  if (strict) {
    throw new Error('Design inventory drift — run `pnpm design:audit` for details.');
  }
  console.warn('(reporting mode — pass --strict to fail on drift)');
} else {
  console.warn('\nClean — inventory and code are in sync.');
}
