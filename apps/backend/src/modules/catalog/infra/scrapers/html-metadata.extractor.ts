/**
 * WHY this file exists:
 * Parses an HTML document and extracts a ScrapedCourseFragment from schema.org
 * JSON-LD (Course / VideoObject / Person / Organization / aggregateRating) and,
 * as a fallback, OpenGraph meta tags. Pure: a string in, a fragment out — no
 * network, no DI. JSON-LD wins over OpenGraph on conflict.
 */
import * as cheerio from 'cheerio';

import type { ScrapedCourseFragment } from '../../domain/scraper/scraper.types';

type JsonLdNode = Record<string, unknown>;

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

export class HtmlMetadataExtractor {
  extract(html: string): ScrapedCourseFragment {
    const $ = cheerio.load(html);
    const fromJsonLd = this.fromJsonLd($);
    const fromOg = this.fromOpenGraph($);
    // JSON-LD wins; OG fills gaps.
    return { ...fromOg, ...fromJsonLd };
  }

  private collectJsonLdNodes($: cheerio.CheerioAPI): JsonLdNode[] {
    const nodes: JsonLdNode[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      try {
        const parsed: unknown = JSON.parse(raw);
        for (const entry of asArray(parsed as JsonLdNode | JsonLdNode[])) {
          if (typeof entry === 'object') {
            const graph = entry['@graph'];
            if (Array.isArray(graph)) nodes.push(...(graph as JsonLdNode[]));
            else nodes.push(entry);
          }
        }
      } catch {
        // ignore a single malformed block; other blocks may still parse
      }
    });
    return nodes;
  }

  private fromJsonLd($: cheerio.CheerioAPI): ScrapedCourseFragment {
    const nodes = this.collectJsonLdNodes($);
    const course = nodes.find((n) => {
      const t = n['@type'];
      return t === 'Course' || t === 'VideoObject' || (Array.isArray(t) && t.includes('Course'));
    });
    if (!course) return {};

    const fragment: Record<string, unknown> = {};
    const title = str(course['name']);
    if (title) fragment['title'] = title;
    const description = str(course['description']);
    if (description) fragment['description'] = description;
    const image = course['image'];
    const posterUrl = str(typeof image === 'object' ? (image as JsonLdNode)['url'] : image);
    if (posterUrl) fragment['posterUrl'] = posterUrl;
    const language = str(course['inLanguage']);
    if (language) fragment['language'] = language;

    const provider = course['provider'] ?? course['publisher'];
    const studioName = str(provider && (provider as JsonLdNode)['name']);
    if (studioName) fragment['studioName'] = studioName;

    const instructors = asArray(course['instructor'] as JsonLdNode | JsonLdNode[])
      .map((p) => str(p['name']))
      .filter((n): n is string => n !== undefined);
    if (instructors.length > 0) fragment['instructorNames'] = instructors;

    const rating = course['aggregateRating'] as JsonLdNode | undefined;
    if (rating) {
      const avg = num(rating['ratingValue']);
      const count = num(rating['ratingCount'] ?? rating['reviewCount']);
      if (avg !== undefined) fragment['ratingAverage'] = avg;
      if (count !== undefined) fragment['ratingCount'] = count;
    }
    return fragment;
  }

  private fromOpenGraph($: cheerio.CheerioAPI): ScrapedCourseFragment {
    const og = (prop: string): string | undefined =>
      str($(`meta[property="og:${prop}"]`).attr('content'));
    const fragment: Record<string, unknown> = {};
    const title = og('title');
    if (title) fragment['title'] = title;
    const description = og('description');
    if (description) fragment['description'] = description;
    const image = og('image');
    if (image) fragment['posterUrl'] = image;
    return fragment;
  }
}
