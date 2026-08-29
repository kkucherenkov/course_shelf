/**
 * Design inventory audit — cross-checks the canonical inventory table in
 * `specs/design/README.md` against the components that actually exist.
 *
 * Reports:
 *  - Component with no inventory row (undocumented widget)
 *  - Inventory row matching neither a Vue nor a Flutter component (stale doc)
 *  - Parity drift: a row's `Vue` / `Flutter` mark disagreeing with the code
 *
 * **Where the two sets come from, and why they differ.** `packages/ui` is one
 * folder per component, so its folder names *are* the component names. The
 * Flutter package is not: `lib/src/` holds groupings (`buttons/`, `fields/`,
 * `progress/`), each with several widgets. Reading directory names there would
 * yield `AppButtons`, `AppFields`, `AppProgress` — names no widget has — so
 * the Flutter set is derived from the package barrel `lib/app_ui.dart`: every
 * exported file, every non-private widget class inside it. That uses the
 * package's own declaration of its public API, so an unexported widget is not
 * claimed as a component and a new export needs no list maintained here.
 *
 * Exit code: 0 = clean, or drift in reporting mode; non-zero when run with
 * `--strict` and drift is detected. CI runs it strict.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

const inventoryPath = path.join(repoRoot, 'specs/design/README.md');
const vueDir = path.join(repoRoot, 'packages/ui/src/components');
const flutterRoot = path.join(repoRoot, 'packages/ui_flutter/lib');
const flutterBarrel = path.join(flutterRoot, 'app_ui.dart');

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
/**
 * Public Flutter widget classes, read through the package barrel.
 *
 * A class counts when it is exported from `app_ui.dart` and is not
 * Dart-private (`_`-prefixed). Sub-parts that are genuinely exported —
 * `AppFieldFrame`, `AppPlayerScrubber` — count too: they are public API, and
 * pretending otherwise would need a hand-kept exception list that rots.
 */
function flutterComponents(): Set<string> {
  const names = new Set<string>();
  let barrel: string;
  try {
    barrel = readFileSync(flutterBarrel, 'utf8');
  } catch {
    return names;
  }
  for (const m of barrel.matchAll(/^export '(src\/[^']+)';/gm)) {
    const rel = m[1];
    if (rel === undefined) continue;
    let source: string;
    try {
      source = readFileSync(path.join(flutterRoot, rel), 'utf8');
    } catch {
      continue;
    }
    for (const c of source.matchAll(
      /^class ([A-Za-z][A-Za-z0-9_]*)[^{]*?extends (?:StatelessWidget|StatefulWidget)/gm,
    )) {
      const name = c[1];
      if (name !== undefined) names.add(name);
    }
  }
  return names;
}

/**
 * Rows of the inventory table: component name plus its two parity marks.
 *
 * `| Category | \`AppButton\` | ✓ | — |`
 */
interface InventoryRow {
  readonly name: string;
  readonly vue: boolean;
  readonly flutter: boolean;
}

function parseInventoryRows(): InventoryRow[] {
  const src = readFileSync(inventoryPath, 'utf8');
  const rows: InventoryRow[] = [];
  // Category | Component | Vue | Flutter — only rows whose component cell
  // carries a backticked identifier are inventory rows; prose tables elsewhere
  // in the file do not match.
  const rowRe = /^\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|/gm;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(src))) {
    const nameCell = m[2] ?? '';
    const id = /`([A-Z][A-Za-z0-9]+)`/.exec(nameCell);
    if (!id?.[1]) continue;
    rows.push({
      name: id[1],
      vue: (m[3] ?? '').includes('✓'),
      flutter: (m[4] ?? '').includes('✓'),
    });
  }
  return rows;
}

// Components the demo/theme layer exposes that are not part of the catalog.
const flutterNonComponent = new Set(['TokenDemoScreen']);

const rows = parseInventoryRows();
const inventory = new Map(rows.map((r) => [r.name, r]));

const vueComponents = new Set(listFolders(vueDir));
const flutterAll = flutterComponents();
const flutterCatalog = new Set([...flutterAll].filter((name) => !flutterNonComponent.has(name)));

const vueMissing = [...vueComponents].filter((n) => !inventory.has(n)).toSorted();
const flutterMissing = [...flutterCatalog].filter((n) => !inventory.has(n)).toSorted();
const stale = rows
  .map((r) => r.name)
  .filter((n) => !vueComponents.has(n) && !flutterCatalog.has(n))
  .toSorted();

// The parity marks are the reason the table is worth reading — a `—` that
// should be a `✓` is what "one platform is behind" looks like on paper. Check
// them rather than trust them.
const parityDrift = rows
  .filter((r) => vueComponents.has(r.name) || flutterCatalog.has(r.name))
  .flatMap((r) => {
    const notes: string[] = [];
    const hasVue = vueComponents.has(r.name);
    const hasFlutter = flutterCatalog.has(r.name);
    if (r.vue !== hasVue) {
      notes.push(
        `${r.name}: Vue marked ${r.vue ? '✓' : '—'} but is ${hasVue ? 'present' : 'absent'}`,
      );
    }
    if (r.flutter !== hasFlutter) {
      notes.push(
        `${r.name}: Flutter marked ${r.flutter ? '✓' : '—'} but is ${hasFlutter ? 'present' : 'absent'}`,
      );
    }
    return notes;
  })
  .toSorted();

function report(title: string, list: string[]): boolean {
  if (list.length === 0) {
    console.warn(`\u2713 ${title}`);
    return false;
  }
  console.warn(`\u2717 ${title}`);
  for (const name of list) console.warn(`    ${name}`);
  return true;
}

console.warn('Design inventory audit');
console.warn(`  Inventory: ${inventoryPath}`);
console.warn(`  Vue:        components in ${vueDir}`);
console.warn(`  Flutter:    components via ${flutterBarrel}\n`);

let hasDrift = false;
hasDrift = report('Vue components missing an inventory row', vueMissing) || hasDrift;
hasDrift = report('Flutter components missing an inventory row', flutterMissing) || hasDrift;
hasDrift = report('Inventory rows matching no component on either platform', stale) || hasDrift;
hasDrift = report('Parity marks disagreeing with the code', parityDrift) || hasDrift;

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
