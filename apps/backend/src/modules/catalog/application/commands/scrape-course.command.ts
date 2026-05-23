/**
 * WHY this file exists:
 * Command carrying inputs for a preview scrape. courseId scopes the preview to
 * a course (the handler verifies it exists). source is optional — when absent
 * the handler auto-detects by URL (url-kind) or defaults to json-ld (fragment).
 */
import type { ScrapeRequest } from '../../domain/scraper/scraper.types';

export class ScrapeCourseCommand {
  constructor(
    public readonly courseId: string,
    public readonly source: string | undefined,
    public readonly request: ScrapeRequest,
  ) {}
}
