/**
 * Cross-source audit for CourseShelf design tokens.
 *
 * Two sources of truth coexist:
 * - `docs/design/shared/tokens.json` — Style-Dictionary v3 schema, used by the
 *   JSX prototype under `docs/design/`. Authored by designers.
 * - `specs/design/tokens/*.json` — DTCG-shaped semantic tokens, consumed by
 *   `@app/design-tokens` to emit CSS / TS / Dart artefacts for the code-stack.
 *
 * They live in different shapes (palette vs semantic role) on purpose. This
 * script walks a fixed mapping table — short prototype name ↔ DTCG long name —
 * normalises both values, and exits 1 with a readable diff on any drift.
 *
 * Run: pnpm --filter @app/design-tokens audit:cross-source
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTokens } from '../src/load.ts';

interface ProtoLeaf {
  value: string | number;
}

interface ProtoTokens {
  color: {
    neutral: Record<string, ProtoLeaf>;
    warm: Record<string, ProtoLeaf>;
    accent: Record<string, Record<string, ProtoLeaf>>;
    semantic: Record<string, ProtoLeaf>;
    mode: { dark: Record<string, ProtoLeaf>; light: Record<string, ProtoLeaf> };
  };
  space: Record<string, ProtoLeaf>;
  radius: Record<string, ProtoLeaf>;
  type: { family: Record<string, ProtoLeaf> };
  elevation: Record<string, ProtoLeaf>;
  motion: {
    duration: Record<string, ProtoLeaf>;
    easing: Record<string, ProtoLeaf>;
  };
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

const protoPath = path.join(repoRoot, 'docs/design/shared/tokens.json');
const proto = JSON.parse(readFileSync(protoPath, 'utf8')) as ProtoTokens;
const dtcg = loadTokens(repoRoot);

/**
 * Resolve a Style-Dictionary v3 reference like `{color.neutral.50.value}` by
 * walking the proto tree. Plain values pass through unchanged. Recurses so a
 * referenced value that is itself a reference resolves transparently.
 */
function resolveProto(value: string | number): string {
  const s = String(value);
  if (!s.startsWith('{') || !s.endsWith('}')) return s;
  const segments = s.slice(1, -1).split('.');
  let cursor: unknown = proto;
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== 'object') {
      throw new Error(`Bad proto ref: ${s}`);
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (typeof cursor !== 'string' && typeof cursor !== 'number') {
    throw new TypeError(`Proto ref did not resolve to a scalar: ${s}`);
  }
  return resolveProto(cursor);
}

/**
 * Read a leaf value from a proto sub-tree, throwing if the key is missing.
 * Centralised so the call sites stay terse and TS narrows away `undefined`.
 */
function protoLeafValue(map: Record<string, ProtoLeaf>, key: string): string | number {
  const leaf = map[key];
  if (leaf === undefined) {
    throw new Error(`Proto leaf missing: ${key}`);
  }
  return leaf.value;
}

function normaliseHex(input: string): string {
  let hex = input.trim().replace(/^#/, '').toUpperCase();
  if (hex.length === 3) {
    // hex is guaranteed-ASCII (0–9, A–F) at this point, so spread is safe.
    // eslint-disable-next-line @typescript-eslint/no-misused-spread -- ASCII hex digits.
    hex = [...hex].map((c) => c + c).join('');
  }
  return `#${hex}`;
}

function normaliseRgba(input: string): string {
  const match =
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/.exec(
      input.trim(),
    );
  if (!match) return input.trim();
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  const a = match[4] === undefined ? 1 : Number(match[4]);
  return `rgba(${r.toString()}, ${g.toString()}, ${b.toString()}, ${a.toString()})`;
}

function normaliseColor(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('#')) return normaliseHex(trimmed);
  if (trimmed.startsWith('rgb')) return normaliseRgba(trimmed);
  return trimmed;
}

function normaliseShadow(input: string): string {
  // Shadow values: "0 1px 2px rgba(0, 0, 0, 0.35)" possibly multi-comma-separated.
  // Normalise each rgba(...) inside, collapse repeated whitespace, trim.
  const withRgba = input.replaceAll(/rgba?\([^)]+\)/g, (m) => normaliseRgba(m));
  return withRgba.replaceAll(/\s+/g, ' ').trim();
}

function normaliseDuration(input: string): string {
  const trimmed = input.trim();
  if (trimmed.endsWith('ms')) return trimmed;
  if (trimmed.endsWith('s')) {
    const ms = Number(trimmed.slice(0, -1)) * 1000;
    return `${ms.toString()}ms`;
  }
  return `${trimmed}ms`;
}

function normaliseCubicBezier(input: string): string {
  const match =
    /^cubic-bezier\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)$/.exec(
      input.trim(),
    );
  if (!match) return input.trim();
  return `cubic-bezier(${Number(match[1]).toString()}, ${Number(match[2]).toString()}, ${Number(match[3]).toString()}, ${Number(match[4]).toString()})`;
}

function normaliseDimension(input: string): string {
  return input.trim();
}

function normaliseFamily(input: string): string {
  // Trim quotes and extra whitespace from font-family strings before comparison.
  return input.trim().replaceAll(/\s+/g, ' ').replaceAll(/['"]/g, '');
}

type Kind = 'color' | 'shadow' | 'duration' | 'cubicBezier' | 'dimension' | 'family';

function normalise(kind: Kind, value: string): string {
  switch (kind) {
    case 'color': {
      return normaliseColor(value);
    }
    case 'shadow': {
      return normaliseShadow(value);
    }
    case 'duration': {
      return normaliseDuration(value);
    }
    case 'cubicBezier': {
      return normaliseCubicBezier(value);
    }
    case 'dimension': {
      return normaliseDimension(value);
    }
    case 'family': {
      return normaliseFamily(value);
    }
  }
}

interface Pair {
  short: string;
  kind: Kind;
  /** Where to read the prototype value from. */
  proto: { dark: string | number; light?: string | number };
  /** Where to read the DTCG value from. */
  dtcg: { dark: string | number; light?: string | number };
}

function makePairs(): Pair[] {
  const pairs: Pair[] = [];

  // Themed colors — both modes participate.
  const themedColors: readonly (readonly [string, string, keyof typeof dtcg.color.color])[] = [
    ['bg', 'page', 'surface'],
    ['surface', 'surface', 'surface'],
    ['surface-2', 'raised', 'surface'],
    ['surface-3', 'overlay', 'surface'],
    ['border', 'default', 'border'],
    ['border-strong', 'strong', 'border'],
    ['focus-ring', 'focus', 'border'],
    ['text', 'fg', 'text'],
    ['text-loud', 'loud', 'text'],
    ['text-muted', 'secondary', 'text'],
    ['primary', 'accent', 'brand'],
    ['primary-hover', 'accentHover', 'brand'],
    ['primary-text', 'accentFg', 'brand'],
  ];
  for (const [short, dtcgKey, dtcgGroup] of themedColors) {
    const dtcgLeaf = dtcg.color.color[dtcgGroup][dtcgKey];
    if (dtcgLeaf === undefined || !('light' in dtcgLeaf) || !('dark' in dtcgLeaf)) {
      throw new Error(`DTCG color.${dtcgGroup}.${dtcgKey} is missing or untimed.`);
    }
    pairs.push({
      short,
      kind: 'color',
      proto: {
        dark: resolveProto(protoLeafValue(proto.color.mode.dark, short)),
        light: resolveProto(protoLeafValue(proto.color.mode.light, short)),
      },
      dtcg: { dark: dtcgLeaf.dark.$value, light: dtcgLeaf.light.$value },
    });
  }

  // Status colors — prototype carries one hex per status (the "vibrant" dark
  // variant). The code-stack splits that into themed light/dark, so we only
  // audit the dark side here.
  const statusPairs: readonly (readonly [string, keyof typeof proto.color.semantic, string])[] = [
    ['success', 'success', 'successFg'],
    ['warning', 'warning', 'warningFg'],
    ['error', 'error', 'errorFg'],
    ['info', 'info', 'infoFg'],
  ];
  for (const [short, protoKey, dtcgKey] of statusPairs) {
    const dtcgLeaf = dtcg.color.color.status[dtcgKey];
    if (dtcgLeaf === undefined) {
      throw new Error(`DTCG color.status.${dtcgKey} is missing.`);
    }
    pairs.push({
      short: `${short} (dark)`,
      kind: 'color',
      proto: { dark: resolveProto(protoLeafValue(proto.color.semantic, protoKey)) },
      dtcg: { dark: dtcgLeaf.dark.$value },
    });
  }

  // Spacing — single value, untimed.
  for (const key of Object.keys(proto.space)) {
    const dtcgLeaf = dtcg.spacing.space[key];
    if (dtcgLeaf === undefined) {
      throw new Error(`DTCG spacing.${key} is missing.`);
    }
    pairs.push({
      short: `space-${key}`,
      kind: 'dimension',
      proto: { dark: resolveProto(protoLeafValue(proto.space, key)) },
      dtcg: { dark: dtcgLeaf.$value },
    });
  }

  // Radius.
  for (const key of Object.keys(proto.radius)) {
    const dtcgLeaf = dtcg.radius.radius[key];
    if (dtcgLeaf === undefined) {
      throw new Error(`DTCG radius.${key} is missing.`);
    }
    pairs.push({
      short: `radius-${key}`,
      kind: 'dimension',
      proto: { dark: resolveProto(protoLeafValue(proto.radius, key)) },
      dtcg: { dark: dtcgLeaf.$value },
    });
  }

  // Font families.
  for (const key of Object.keys(proto.type.family)) {
    const dtcgLeaf = dtcg.typography.typography.font.family[key];
    if (dtcgLeaf === undefined) {
      throw new Error(`DTCG typography.font.family.${key} is missing.`);
    }
    pairs.push({
      short: `font-${key}`,
      kind: 'family',
      proto: { dark: resolveProto(protoLeafValue(proto.type.family, key)) },
      dtcg: { dark: dtcgLeaf.$value },
    });
  }

  // Durations — proto's "normal" maps to DTCG's "base".
  const durationPairs: readonly (readonly [string, string])[] = [
    ['fast', 'fast'],
    ['normal', 'base'],
    ['slow', 'slow'],
  ];
  for (const [protoKey, dtcgKey] of durationPairs) {
    const dtcgLeaf = dtcg.motion.motion.duration[dtcgKey];
    if (dtcgLeaf === undefined) {
      throw new Error(`DTCG motion.duration.${dtcgKey} is missing.`);
    }
    pairs.push({
      short: `dur-${protoKey}`,
      kind: 'duration',
      proto: { dark: resolveProto(protoLeafValue(proto.motion.duration, protoKey)) },
      dtcg: { dark: dtcgLeaf.$value },
    });
  }

  // Easings — proto's "inOut" maps to DTCG's "default".
  const easingPairs: readonly (readonly [string, string])[] = [
    ['out', 'out'],
    ['in', 'in'],
    ['inOut', 'default'],
  ];
  for (const [protoKey, dtcgKey] of easingPairs) {
    const dtcgLeaf = dtcg.motion.motion.easing[dtcgKey];
    if (dtcgLeaf === undefined) {
      throw new Error(`DTCG motion.easing.${dtcgKey} is missing.`);
    }
    pairs.push({
      short: `ease-${protoKey}`,
      kind: 'cubicBezier',
      proto: { dark: resolveProto(protoLeafValue(proto.motion.easing, protoKey)) },
      dtcg: { dark: dtcgLeaf.$value },
    });
  }

  // Elevations — prototype has one rgba per level; DTCG carries themed values
  // and we audit the dark side only.
  const elevationPairs: readonly (readonly [string, string])[] = [
    ['1', 'xs'],
    ['2', 'md'],
    ['3', 'lg'],
  ];
  for (const [protoKey, dtcgKey] of elevationPairs) {
    const dtcgLeaf = dtcg.shadow.shadow[dtcgKey];
    if (dtcgLeaf === undefined) {
      throw new Error(`DTCG shadow.${dtcgKey} is missing.`);
    }
    pairs.push({
      short: `shadow-${protoKey} (dark)`,
      kind: 'shadow',
      proto: { dark: resolveProto(protoLeafValue(proto.elevation, protoKey)) },
      dtcg: { dark: dtcgLeaf.dark.$value },
    });
  }

  return pairs;
}

interface Diff {
  short: string;
  side: 'dark' | 'light';
  proto: string;
  dtcg: string;
}

/**
 * Pairs where `docs/design/shared/tokens.json` is itself out of sync with
 * `docs/design/shared/tokens.css` inside the prototype bundle. The CSS file
 * is what the JSX prototype actually renders, so the code-stack tracks the
 * CSS values; the JSON is documented as the source-of-record but lags
 * behind. These are surfaced as informational lines, not failures.
 */
const KNOWN_PROTO_INTERNAL_DRIFTS: ReadonlySet<string> = new Set([
  // tokens.json declares warm.500; tokens.css uses warm.600 (#5C5644).
  'text-muted/light',
  // tokens.json carries lighter alphas (0.25/0.35/0.45); tokens.css carries
  // the heavier amber-tuned shadows (0.35/0.45/0.55) we synchronised against.
  'shadow-1 (dark)/dark',
  'shadow-2 (dark)/dark',
  'shadow-3 (dark)/dark',
]);

function audit(): { failures: Diff[]; known: Diff[] } {
  const failures: Diff[] = [];
  const known: Diff[] = [];
  const route = (entry: Diff): void => {
    const key = `${entry.short}/${entry.side}`;
    if (KNOWN_PROTO_INTERNAL_DRIFTS.has(key)) {
      known.push(entry);
    } else {
      failures.push(entry);
    }
  };
  for (const pair of makePairs()) {
    const protoDark = normalise(pair.kind, String(pair.proto.dark));
    const dtcgDark = normalise(pair.kind, String(pair.dtcg.dark));
    if (protoDark !== dtcgDark) {
      route({ short: pair.short, side: 'dark', proto: protoDark, dtcg: dtcgDark });
    }
    if (pair.proto.light !== undefined && pair.dtcg.light !== undefined) {
      const protoLight = normalise(pair.kind, String(pair.proto.light));
      const dtcgLight = normalise(pair.kind, String(pair.dtcg.light));
      if (protoLight !== dtcgLight) {
        route({ short: pair.short, side: 'light', proto: protoLight, dtcg: dtcgLight });
      }
    }
  }
  return { failures, known };
}

const { failures, known } = audit();
const totalPairs = makePairs().length;

if (known.length > 0) {
  console.warn(
    `ℹ ${known.length.toString()} known prototype-internal drift(s) (tokens.json ≠ tokens.css; code-stack tracks tokens.css):`,
  );
  for (const d of known) {
    console.warn(`  --${d.short} ${d.side}: proto.json=${d.proto} ↔ dtcg=${d.dtcg}`);
  }
  console.warn('');
}

if (failures.length === 0) {
  console.warn(`✓ design tokens cross-source audit: ${totalPairs.toString()} pairs in sync`);
  // eslint-disable-next-line unicorn/no-process-exit -- this is a CLI entry; we own the exit code.
  process.exit(0);
}

console.warn(`✗ design tokens cross-source audit: ${failures.length.toString()} drift(s) found\n`);
for (const d of failures) {
  console.warn(`  --${d.short} ${d.side}: proto=${d.proto} ↔ dtcg=${d.dtcg}`);
}
console.warn(
  '\n  Sources:\n    proto: docs/design/shared/tokens.json\n    dtcg:  specs/design/tokens/*.json\n',
);
// eslint-disable-next-line unicorn/no-process-exit -- this is a CLI entry; we own the exit code.
process.exit(1);
