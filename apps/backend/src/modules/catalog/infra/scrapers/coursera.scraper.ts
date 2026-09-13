/**
 * WHY this file exists:
 * Coursera answers a keyless, public JSON API — courses.v1 / instructors.v1 /
 * partners.v1 all return 200 with no credentials (measured 2026-09-13, see
 * docs/roadmap/tasks/E30-F02-S01.md). There is no HTML to select against, so
 * this is a bespoke adapter rather than a declarative definition. The two
 * lookup calls (instructor names, studio name) are batched via `ids=a,b,c` —
 * never one request per instructor — and skipped when the course carries no
 * ids. A lookup that fails or times out degrades to a fragment without those
 * names; only the course call failing is a real error.
 */
import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import type { HttpFetcher } from './http-fetcher';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

const API = 'https://api.coursera.org/api';
const COURSE_FIELDS =
  'name,description,photoUrl,primaryLanguages,startDate,workload,instructorIds,partnerIds';

interface CourseraListResponse<T> {
  elements?: T[];
}
interface CourseraCourseElement {
  id?: string;
  name?: string;
  description?: string;
  photoUrl?: string;
  primaryLanguages?: string[];
  startDate?: number;
  instructorIds?: string[];
  partnerIds?: string[];
}
interface CourseraInstructorElement {
  fullName?: string;
}
interface CourseraPartnerElement {
  name?: string;
}

// Plain class — constructed manually by the SCRAPER_REGISTRY factory (and tests)
// with positional args, like the other scrapers.
export class CourseraScraper implements Scraper {
  readonly id = 'coursera';
  readonly supportedKinds: readonly ScraperKind[] = ['url'];

  constructor(private readonly fetcher: HttpFetcher) {}

  canHandle(url: string): boolean {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      return host === 'coursera.org' && u.pathname.includes('/learn/');
    } catch {
      return false;
    }
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind !== 'url') return [];
    const slug = this.slug(request.url);
    if (!slug) return [];

    const course = await this.fetchCourse(slug);
    if (!course) return [];

    const [instructorNames, studioName] = await Promise.all([
      this.lookupInstructorNames(course.instructorIds),
      this.lookupStudioName(course.partnerIds),
    ]);

    const fragment: Record<string, unknown> = {};
    if (course.name) fragment['title'] = course.name;
    if (course.description) fragment['description'] = course.description;
    if (course.photoUrl) fragment['posterUrl'] = course.photoUrl;
    if (course.primaryLanguages?.[0]) fragment['language'] = course.primaryLanguages[0];
    const releaseDate = this.toIsoDate(course.startDate);
    if (releaseDate) fragment['releaseDate'] = releaseDate;
    if (instructorNames.length > 0) fragment['instructorNames'] = instructorNames;
    if (studioName) fragment['studioName'] = studioName;
    if (course.id) {
      fragment['externalIds'] = [{ source: 'coursera', externalId: course.id, url: request.url }];
    }

    if (Object.keys(fragment).length === 0) return [];
    return [{ fragment: fragment, source: this.id, sourceUrl: request.url }];
  }

  private slug(url: string): string | undefined {
    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean);
      const idx = segments.indexOf('learn');
      return idx === -1 ? undefined : segments[idx + 1];
    } catch {
      return undefined;
    }
  }

  /** The course call is a real error: throws ScrapeFetchError on failure. */
  private async fetchCourse(slug: string): Promise<CourseraCourseElement | undefined> {
    const url = `${API}/courses.v1?q=slug&slug=${encodeURIComponent(slug)}&fields=${COURSE_FIELDS}`;
    let result;
    try {
      result = await this.fetcher.fetchText(url);
    } catch (error) {
      throw new ScrapeFetchError(url, error);
    }
    if (result.status < 200 || result.status >= 300) {
      throw new ScrapeFetchError(
        url,
        new Error(`Coursera API returned HTTP ${String(result.status)}`),
      );
    }
    let parsed: CourseraListResponse<CourseraCourseElement>;
    try {
      parsed = JSON.parse(result.body) as CourseraListResponse<CourseraCourseElement>;
    } catch (error) {
      throw new ScrapeFetchError(url, error);
    }
    return parsed.elements?.[0];
  }

  private async lookupInstructorNames(ids?: string[]): Promise<string[]> {
    if (!ids || ids.length === 0) return [];
    const elements = await this.lookup<CourseraInstructorElement>(
      'instructors.v1',
      'fullName',
      ids,
    );
    return elements.flatMap((e) => (e.fullName ? [e.fullName] : []));
  }

  private async lookupStudioName(ids?: string[]): Promise<string | undefined> {
    if (!ids || ids.length === 0) return undefined;
    const elements = await this.lookup<CourseraPartnerElement>('partners.v1', 'name', ids);
    return elements[0]?.name;
  }

  /** Degrades to [] on any failure or non-2xx — never throws. */
  private async lookup<T>(resource: string, fields: string, ids: string[]): Promise<T[]> {
    const url = `${API}/${resource}?ids=${ids.map((id) => encodeURIComponent(id)).join(',')}&fields=${fields}`;
    try {
      const result = await this.fetcher.fetchText(url);
      if (result.status < 200 || result.status >= 300) return [];
      const parsed = JSON.parse(result.body) as CourseraListResponse<T>;
      return parsed.elements ?? [];
    } catch {
      return [];
    }
  }

  private toIsoDate(epochMs?: number): string | undefined {
    if (epochMs === undefined) return undefined;
    const d = new Date(epochMs);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  }
}
