/**
 * WHY this file exists:
 * Executes a scraper definition's rules (design §3) against an HTML document.
 * Pure the way HtmlMetadataExtractor is: html + rules in,
 * Partial<ScrapedCourseFragment> out, no network and no DI (D4).
 *
 * Deviation from the design's two-argument sketch (`extract(html, rules)`):
 * `externalIds` coerces to `ScrapedExternalId[]` — objects with a `source`,
 * not bare strings — and the only sensible `source` for a rule-extracted id is
 * the definition's own id (the same choice UdemyScraper makes for its
 * URL-derived id). That value isn't reachable from html+rules alone, so this
 * takes a third `sourceId` argument. Still a pure function — no network, no DI,
 * deterministic on its inputs — just one more of them.
 *
 * No type declarations in a rule (design §3): FIELD_KINDS decides the
 * coercion for the target field, and a value that will not coerce is dropped
 * rather than set to something wrong.
 */
import * as cheerio from 'cheerio';

import {
  FIELD_KINDS,
  isJsonRule,
  VALID_SCRAPED_LEVELS,
} from '../../domain/scraper/scraper-definition.schema';

import type {
  ScraperDefinitionRule,
  ScraperDefinitionRules,
  ScraperRuleField,
} from '../../domain/scraper/scraper-definition.schema';
import type { ScrapedCourseFragment } from '../../domain/scraper/scraper.types';

const DEFAULT_JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

/** Walk a dotted path (`a.b.c`, `a.0.b`) — array indices work as string keys in JS. */
function walkPath(root: unknown, dottedPath: string): unknown {
  let acc: unknown = root;
  for (const segment of dottedPath.split('.')) {
    if (acc === null || typeof acc !== 'object') return undefined;
    acc = (acc as Record<string, unknown>)[segment];
  }
  return acc;
}

export class RuleExtractor {
  extract(
    html: string,
    rules: ScraperDefinitionRules,
    sourceId: string,
  ): Partial<ScrapedCourseFragment> {
    const $ = cheerio.load(html);
    const fragment: Record<string, unknown> = {};

    for (const [field, rule] of Object.entries(rules) as [
      ScraperRuleField,
      ScraperDefinitionRule,
    ][]) {
      const rawValues = isJsonRule(rule) ? this.extractJson($, rule) : this.extractCss($, rule);
      const value = this.coerce(field, rawValues, sourceId);
      if (value !== undefined) fragment[field] = value;
    }

    return fragment;
  }

  private extractCss(
    $: cheerio.CheerioAPI,
    rule: { selector: string; from: string; many?: boolean },
  ): unknown[] {
    const nodes = $(rule.selector);
    const wanted = rule.many ? nodes.toArray() : nodes.toArray().slice(0, 1);
    return wanted
      .map((el) => {
        const $el = $(el);
        if (rule.from === 'text') return $el.text().trim();
        const attrName = rule.from.slice('attr:'.length);
        return $el.attr(attrName);
      })
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
  }

  private extractJson($: cheerio.CheerioAPI, rule: { json: string; jsonFrom?: string }): unknown[] {
    const selector = rule.jsonFrom ?? DEFAULT_JSON_LD_SELECTOR;
    const scripts = $(selector).toArray();
    for (const el of scripts) {
      let parsed: unknown;
      try {
        parsed = JSON.parse($(el).contents().text()) as unknown;
      } catch {
        continue;
      }
      const value = walkPath(parsed, rule.json);
      if (value !== undefined) return Array.isArray(value) ? value : [value];
    }
    return [];
  }

  private coerce(field: ScraperRuleField, rawValues: unknown[], sourceId: string): unknown {
    const kind = FIELD_KINDS[field];
    const strings = rawValues
      .map((v) =>
        typeof v === 'string'
          ? v
          : typeof v === 'number' || typeof v === 'boolean'
            ? String(v)
            : undefined,
      )
      .filter((v): v is string => v !== undefined && v.length > 0);

    if (kind === 'number') {
      const n = strings.length > 0 ? Number(strings[0]) : Number.NaN;
      return Number.isFinite(n) ? n : undefined;
    }

    if (kind === 'list') {
      if (strings.length === 0) return undefined;
      if (field === 'externalIds') {
        return strings.map((externalId) => ({ source: sourceId, externalId }));
      }
      return strings;
    }

    // string
    const first = strings[0];
    if (first === undefined) return undefined;
    if (field === 'level') {
      return VALID_SCRAPED_LEVELS.includes(first) ? first : undefined;
    }
    return first;
  }
}
