/**
 * WHY this file exists:
 * Wire-independent domain types for the scraping subsystem (Stage 2). A
 * ScrapedCourseFragment mirrors the upsert/course.json v2 payload shape (raw
 * names, not resolved entities) plus optional rating fields. Entity resolution
 * and persistence are deliberately out of scope — they belong to Stage 4.
 */
import type { CourseJsonLevel } from '../scan/course-json.schema';

export type ScraperKind = 'url' | 'name' | 'fragment';

export type ScrapeRequest =
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'name'; readonly query: string }
  // sourceUrl is optional: a pasted fragment has no URL of its own, but when the
  // operator supplies the page it was copied from, a scraper that knows how to
  // mint an external id from a URL (e.g. UdemyScraper) can still do so.
  | { readonly kind: 'fragment'; readonly raw: string; readonly sourceUrl?: string };

export interface ScrapedExternalId {
  readonly source: string;
  readonly externalId: string;
  readonly url?: string;
}

/** Raw scraped metadata — same shape as NormalisedCourseJsonV2 minus sections, plus rating. */
export interface ScrapedCourseFragment {
  readonly title?: string;
  readonly description?: string;
  readonly instructorNames?: string[];
  readonly studioName?: string;
  readonly tags?: string[];
  readonly level?: CourseJsonLevel;
  readonly language?: string;
  readonly releaseDate?: string;
  readonly posterUrl?: string;
  readonly externalIds?: ScrapedExternalId[];
  readonly ratingAverage?: number;
  readonly ratingCount?: number;
}

export interface ScrapeCandidate {
  readonly fragment: ScrapedCourseFragment;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly confidence?: number;
}
