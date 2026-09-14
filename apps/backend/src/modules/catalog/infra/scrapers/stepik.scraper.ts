/**
 * WHY this file exists:
 * Stepik answers a keyless, public JSON API — `/api/courses/{id}`,
 * `/api/users?ids[]=` and `/api/course-review-summaries/{id}` all return 200
 * with no credentials (measured 2026-09-14 against course 181875, see
 * docs/roadmap/tasks/E30-F02-S02.md). There is no HTML worth selecting
 * against, so this is a bespoke adapter rather than a declarative definition,
 * modelled on `coursera.scraper.ts`: one required course call, then lookups
 * that degrade to a thinner fragment instead of failing the scrape.
 *
 * Without it a Stepik URL falls through to the generic json-ld path and
 * recovers a single field, because the page types itself as schema.org
 * `Product`, which `JsonLdScraper` rejects.
 *
 * Deliberately NOT imported: the course's section list. A course outline is a
 * fact about what is on disk, built by the scan from folders and files. Taking
 * it from the site would create a second source of truth about the user's own
 * library, and the two diverge on the first partially downloaded course.
 */
import * as cheerio from 'cheerio';

import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';

import type { HttpFetcher } from './http-fetcher';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

const API = 'https://stepik.org/api';

/**
 * `CourseDto.description` is capped at 8000 on the wire. The composed
 * description below concatenates five separate API fields, so it can outgrow
 * a single field's worth of prose — bound it here rather than letting the
 * operator's later PATCH answer 400. Course 181875 measured 4203 characters
 * across the same five fields.
 */
const DESCRIPTION_MAX_CHARS = 8000;

/**
 * Stepik splits what reads as one course description across five fields. The
 * headings below are the only text this adapter invents, and they are stored
 * rather than rendered, so they follow the *course's* language, not the
 * viewer's — an `en` course must not grow Russian headings because the
 * maintainer's UI happens to be Russian. Anything outside these two falls back
 * to English, matching the two locales the project ships.
 */
const SECTION_HEADINGS = {
  en: {
    skills: "What you'll learn",
    audience: 'Who this course is for',
    requirements: 'Requirements',
    workload: 'Workload',
  },
  ru: {
    skills: 'Чему вы научитесь',
    audience: 'Кому подойдёт этот курс',
    requirements: 'Требования',
    workload: 'Нагрузка',
  },
} as const;

interface StepikCourse {
  id?: number;
  title?: string;
  summary?: string;
  description?: string;
  cover?: string;
  language?: string;
  instructors?: number[];
  review_summary?: number;
  create_date?: string;
  acquired_skills?: string[];
  target_audience?: string;
  requirements?: string;
  workload?: string;
}

interface StepikCoursesResponse {
  courses?: StepikCourse[];
}

interface StepikUser {
  full_name?: string;
}

interface StepikUsersResponse {
  users?: StepikUser[];
}

interface StepikReviewSummary {
  average?: number;
  count?: number;
}

interface StepikReviewSummariesResponse {
  'course-review-summaries'?: StepikReviewSummary[];
}

/**
 * HTML → text for the two fields Stepik stores as markup (`description`,
 * `requirements`).
 *
 * Parsed with cheerio — already a dependency of this directory, see
 * `html-metadata.extractor.ts` — rather than by stripping tags with a regular
 * expression. A regex tag-stripper is the shape CodeQL flags as
 * `js/incomplete-multi-character-sanitization`, and it is right to: such a
 * filter is always one crafted input away from leaving markup behind, and the
 * guarantee "this output is never rendered as HTML" has to hold for every
 * future caller, not just today's. A parser cannot be incomplete, and `.text()`
 * decodes entities correctly instead of against a hand-written table.
 *
 * Block boundaries become newlines because the web renders this with
 * `white-space: pre-line`; `script`/`style` go first so their source never
 * lands in a course description.
 */
function htmlToText(html: string): string {
  const $ = cheerio.load(html, null, false);

  $('script, style').remove();
  $('br').replaceWith('\n');
  $('li').each((_, element) => {
    $(element).prepend('\n— ');
  });
  $('p, div, h1, h2, h3, h4, h5, h6, tr').each((_, element) => {
    $(element).append('\n\n');
  });

  return $.root()
    .text()
    .replaceAll(/[ \t]+\n/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}

/** Plain-text `Heading\n<body>` block, or nothing when the body is empty. */
function section(heading: string, body: string | undefined): string | undefined {
  const text = body === undefined ? '' : htmlToText(body);
  return text === '' ? undefined : `${heading}\n${text}`;
}

/**
 * Cut at a line boundary when one is close to the limit, so a truncated
 * description ends on a whole bullet rather than mid-word.
 */
function capped(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const head = text.slice(0, limit - 1);
  const lastBreak = head.lastIndexOf('\n');
  const cut = lastBreak > limit / 2 ? head.slice(0, lastBreak) : head.trimEnd();
  return `${cut}…`;
}

// Plain class — constructed manually by the SCRAPER_REGISTRY factory (and tests)
// with positional args, like the other scrapers.
export class StepikScraper implements Scraper {
  readonly id = 'stepik';
  readonly supportedKinds: readonly ScraperKind[] = ['url'];

  constructor(private readonly fetcher: HttpFetcher) {}

  canHandle(url: string): boolean {
    return this.courseId(url) !== undefined;
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind !== 'url') return [];
    const courseId = this.courseId(request.url);
    if (courseId === undefined) return [];

    const course = await this.fetchCourse(courseId);
    if (!course) return [];

    const [instructorNames, rating] = await Promise.all([
      this.lookupInstructorNames(course.instructors),
      this.lookupRating(course.review_summary),
    ]);

    const fragment: Record<string, unknown> = {};
    if (course.title) fragment['title'] = course.title;

    const description = this.composeDescription(course);
    if (description) fragment['description'] = description;

    if (course.cover) fragment['posterUrl'] = course.cover;
    if (course.language) fragment['language'] = course.language;

    const releaseDate = this.toIsoDate(course.create_date);
    if (releaseDate) fragment['releaseDate'] = releaseDate;

    if (instructorNames.length > 0) fragment['instructorNames'] = instructorNames;
    if (rating?.average !== undefined) fragment['ratingAverage'] = rating.average;
    if (rating?.count !== undefined) fragment['ratingCount'] = rating.count;

    fragment['externalIds'] = [{ source: 'stepik', externalId: courseId, url: request.url }];

    // externalIds alone is not metadata worth offering the operator.
    if (Object.keys(fragment).length <= 1) return [];
    return [{ fragment: fragment, source: this.id, sourceUrl: request.url }];
  }

  /** `stepik.org/course/181875/...` → `"181875"`; anything else → undefined. */
  private courseId(url: string): string | undefined {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return undefined;
    }
    if (parsed.hostname.replace(/^www\./, '') !== 'stepik.org') return undefined;

    const segments = parsed.pathname.split('/').filter(Boolean);
    const index = segments.indexOf('course');
    if (index === -1) return undefined;

    const candidate = segments[index + 1];
    return candidate !== undefined && /^\d+$/.test(candidate) ? candidate : undefined;
  }

  /**
   * Fold the five description-shaped fields into the one `description` the
   * model has a place for. Stepik's own page shows them as separate blocks;
   * `summary` is the short plain-text lead and `description` the full HTML
   * body, so both are kept — the summary is dropped when the body already
   * opens with it.
   */
  private composeDescription(course: StepikCourse): string | undefined {
    const headings = course.language === 'ru' ? SECTION_HEADINGS.ru : SECTION_HEADINGS.en;

    const body = course.description === undefined ? '' : htmlToText(course.description);
    const summary = course.summary?.trim() ?? '';
    const lead = summary !== '' && !body.startsWith(summary) ? summary : undefined;

    const skills = course.acquired_skills?.filter((s) => s.trim() !== '') ?? [];

    const blocks = [
      lead,
      body === '' ? undefined : body,
      skills.length > 0
        ? `${headings.skills}\n${skills.map((s) => `— ${s.trim()}`).join('\n')}`
        : undefined,
      section(headings.audience, course.target_audience),
      section(headings.requirements, course.requirements),
      section(headings.workload, course.workload),
    ].filter((block): block is string => block !== undefined);

    if (blocks.length === 0) return undefined;
    return capped(blocks.join('\n\n'), DESCRIPTION_MAX_CHARS);
  }

  /** The course call is a real error: throws ScrapeFetchError on failure. */
  private async fetchCourse(courseId: string): Promise<StepikCourse | undefined> {
    const url = `${API}/courses/${encodeURIComponent(courseId)}`;
    let result;
    try {
      result = await this.fetcher.fetchText(url);
    } catch (error) {
      throw new ScrapeFetchError(url, error);
    }
    if (result.status < 200 || result.status >= 300) {
      throw new ScrapeFetchError(
        url,
        new Error(`Stepik API returned HTTP ${String(result.status)}`),
      );
    }
    let parsed: StepikCoursesResponse;
    try {
      parsed = JSON.parse(result.body) as StepikCoursesResponse;
    } catch (error) {
      throw new ScrapeFetchError(url, error);
    }
    return parsed.courses?.[0];
  }

  /**
   * Batched in one `ids[]=` call — never one request per instructor. Degrades
   * to [] on any failure.
   */
  private async lookupInstructorNames(ids?: number[]): Promise<string[]> {
    if (!ids || ids.length === 0) return [];
    const query = ids.map((id) => `ids%5B%5D=${encodeURIComponent(String(id))}`).join('&');
    const parsed = await this.getJson<StepikUsersResponse>(`${API}/users?${query}`);
    return parsed?.users?.flatMap((u) => (u.full_name ? [u.full_name] : [])) ?? [];
  }

  /** Degrades to undefined on any failure — a missing rating is not an error. */
  private async lookupRating(
    reviewSummaryId?: number,
  ): Promise<{ average?: number; count?: number } | undefined> {
    if (reviewSummaryId === undefined) return undefined;
    const parsed = await this.getJson<StepikReviewSummariesResponse>(
      `${API}/course-review-summaries/${encodeURIComponent(String(reviewSummaryId))}`,
    );
    const summary = parsed?.['course-review-summaries']?.[0];
    if (!summary) return undefined;
    return {
      ...(typeof summary.average === 'number' ? { average: summary.average } : {}),
      ...(typeof summary.count === 'number' ? { count: summary.count } : {}),
    };
  }

  /** Never throws — a lookup that fails costs its own fields, not the scrape. */
  private async getJson<T>(url: string): Promise<T | undefined> {
    try {
      const result = await this.fetcher.fetchText(url);
      if (result.status < 200 || result.status >= 300) return undefined;
      return JSON.parse(result.body) as T;
    } catch {
      return undefined;
    }
  }

  private toIsoDate(value?: string): string | undefined {
    if (value === undefined) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
  }
}
