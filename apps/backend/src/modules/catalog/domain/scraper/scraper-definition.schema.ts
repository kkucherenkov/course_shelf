/**
 * WHY this file exists:
 * The declarative scraper definition format (design §3) as TypeScript types
 * plus a hand-rolled parser/validator — same layer, same style, same
 * dependency-free choice as `domain/scan/course-json.schema.ts` (D1 in the
 * design doc). No runtime schema library (zod, ajv) here.
 *
 * A definition is JSON: an id, the invocation kinds it supports, an optional
 * URL-match pattern, and a map of rules keyed by ScrapedCourseFragment field
 * name. `parseScraperDefinition` returns a typed ScraperDefinition on success
 * or throws ScraperDefinitionInvalidError on any shape mismatch — the caller
 * (ScraperDefinitionLoader) catches that per file and records it rather than
 * failing startup.
 *
 * FIELD_KINDS is the single source of truth for which target fields a rule may
 * write and how a raw extracted value coerces onto them (design §3, "No type
 * declarations"). Both this validator (rejecting an unsupported key) and
 * RuleExtractor (coercing the extracted value) read it, so the two never
 * disagree about the vocabulary.
 */
import { ScraperDefinitionInvalidError } from './scraper-definition.errors';

import type { ScraperKind } from './scraper.types';

// ---------------------------------------------------------------------------
// Rule vocabulary
// ---------------------------------------------------------------------------

/** cheerio select; `from: "text"` or `"attr:<name>"`; `many` collects every match. */
export interface ScraperDefinitionCssRule {
  readonly selector: string;
  readonly from: string;
  readonly many?: boolean;
}

/** Parse `jsonFrom`'s script tag as JSON and walk a dotted path (`a.b.c`, `a.0.b`). */
export interface ScraperDefinitionJsonRule {
  readonly json: string;
  readonly jsonFrom?: string;
}

export type ScraperDefinitionRule = ScraperDefinitionCssRule | ScraperDefinitionJsonRule;

export function isJsonRule(rule: ScraperDefinitionRule): rule is ScraperDefinitionJsonRule {
  return 'json' in rule;
}

/** The only keys a `rules` map may use — ScrapedCourseFragment field names. */
export type ScraperRuleField =
  | 'title'
  | 'description'
  | 'instructorNames'
  | 'studioName'
  | 'tags'
  | 'level'
  | 'language'
  | 'releaseDate'
  | 'posterUrl'
  | 'externalIds'
  | 'ratingAverage'
  | 'ratingCount';

export type ScraperRuleFieldKind = 'string' | 'number' | 'list';

/** How RuleExtractor coerces a raw extracted value for each target field. */
export const FIELD_KINDS: Readonly<Record<ScraperRuleField, ScraperRuleFieldKind>> = {
  title: 'string',
  description: 'string',
  studioName: 'string',
  level: 'string',
  language: 'string',
  releaseDate: 'string',
  posterUrl: 'string',
  ratingAverage: 'number',
  ratingCount: 'number',
  instructorNames: 'list',
  tags: 'list',
  externalIds: 'list',
};

/** Valid values for the `level` field — mirrors course-json.schema.ts's VALID_LEVELS. */
export const VALID_SCRAPED_LEVELS: readonly string[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'all_levels',
];

export type ScraperDefinitionRules = Partial<Record<ScraperRuleField, ScraperDefinitionRule>>;

export interface ScraperDefinition {
  readonly id: string;
  readonly kinds: readonly ScraperKind[];
  /** Compiled once at load (D6). Present whenever `kinds` includes `'url'`. */
  readonly urlPattern?: RegExp;
  readonly rules: ScraperDefinitionRules;
}

// ---------------------------------------------------------------------------
// Hand-rolled validators — keep this domain-only and dep-free.
// ---------------------------------------------------------------------------

const VALID_KINDS: readonly ScraperKind[] = ['url', 'name', 'fragment'];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function fail(filePath: string, reason: string): never {
  throw new ScraperDefinitionInvalidError(filePath, reason);
}

function parseKinds(raw: unknown, filePath: string): ScraperKind[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    fail(filePath, 'kinds must be a non-empty array');
  }
  for (const k of raw as unknown[]) {
    if (typeof k !== 'string' || !VALID_KINDS.includes(k as ScraperKind)) {
      fail(filePath, `kinds must contain only ${VALID_KINDS.join(', ')}; got "${String(k)}"`);
    }
  }
  return raw as ScraperKind[];
}

function parseUrlPattern(
  match: unknown,
  kinds: readonly ScraperKind[],
  filePath: string,
): RegExp | undefined {
  if (!isObject(match)) {
    if (kinds.includes('url'))
      fail(filePath, 'match.urlPattern is required when kinds includes "url"');
    return undefined;
  }
  const pattern = match['urlPattern'];
  if (pattern === undefined) {
    if (kinds.includes('url'))
      fail(filePath, 'match.urlPattern is required when kinds includes "url"');
    return undefined;
  }
  if (typeof pattern !== 'string' || pattern.length === 0) {
    fail(filePath, 'match.urlPattern must be a non-empty string');
  }
  try {
    return new RegExp(pattern);
  } catch {
    fail(filePath, `match.urlPattern "${pattern}" is not a valid regular expression`);
  }
}

function parseRule(raw: unknown, field: string, filePath: string): ScraperDefinitionRule {
  if (!isObject(raw)) {
    fail(filePath, `rules.${field} must be an object`);
  }
  const hasJson = raw['json'] !== undefined;
  const hasCss = raw['selector'] !== undefined || raw['from'] !== undefined;

  if (hasJson && hasCss) {
    fail(
      filePath,
      `rules.${field} must be either a CSS rule (selector+from) or a JSON rule (json), not both`,
    );
  }

  if (hasJson) {
    if (typeof raw['json'] !== 'string' || raw['json'].length === 0) {
      fail(filePath, `rules.${field}.json must be a non-empty string`);
    }
    if (raw['jsonFrom'] !== undefined && typeof raw['jsonFrom'] !== 'string') {
      fail(filePath, `rules.${field}.jsonFrom must be a string when present`);
    }
    return {
      json: raw['json'],
      ...(typeof raw['jsonFrom'] === 'string' ? { jsonFrom: raw['jsonFrom'] } : {}),
    };
  }

  if (typeof raw['selector'] !== 'string' || raw['selector'].length === 0) {
    fail(filePath, `rules.${field}.selector must be a non-empty string`);
  }
  if (
    typeof raw['from'] !== 'string' ||
    !(raw['from'] === 'text' || /^attr:.+/.test(raw['from']))
  ) {
    fail(filePath, `rules.${field}.from must be "text" or "attr:<name>"`);
  }
  if (raw['many'] !== undefined && typeof raw['many'] !== 'boolean') {
    fail(filePath, `rules.${field}.many must be a boolean when present`);
  }
  return {
    selector: raw['selector'],
    from: raw['from'],
    ...(typeof raw['many'] === 'boolean' ? { many: raw['many'] } : {}),
  };
}

function parseRules(raw: unknown, filePath: string): ScraperDefinitionRules {
  if (!isObject(raw)) {
    fail(filePath, 'rules must be an object');
  }
  const rules: ScraperDefinitionRules = {};
  for (const [field, value] of Object.entries(raw)) {
    if (!(field in FIELD_KINDS)) {
      fail(filePath, `rules.${field} is not a supported field`);
    }
    rules[field as ScraperRuleField] = parseRule(value, field, filePath);
  }
  return rules;
}

/**
 * Parse and validate a raw JSON string as a ScraperDefinition.
 * Throws ScraperDefinitionInvalidError on any shape mismatch, bad regex, or an
 * id colliding with `reservedIds` (built-ins plus definitions already loaded
 * in this pass — D5).
 */
export function parseScraperDefinition(
  raw: string,
  filePath: string,
  reservedIds: ReadonlySet<string>,
): ScraperDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    fail(filePath, 'file is not valid JSON');
  }

  if (!isObject(parsed)) {
    fail(filePath, 'root must be a JSON object');
  }

  if (typeof parsed['id'] !== 'string' || parsed['id'].length === 0) {
    fail(filePath, 'id must be a non-empty string');
  }
  const id = parsed['id'];
  if (reservedIds.has(id)) {
    fail(filePath, `id "${id}" collides with an already-registered scraper`);
  }

  const kinds = parseKinds(parsed['kinds'], filePath);
  const urlPattern = parseUrlPattern(parsed['match'], kinds, filePath);
  const rules = parseRules(parsed['rules'], filePath);

  return { id, kinds, ...(urlPattern ? { urlPattern } : {}), rules };
}
