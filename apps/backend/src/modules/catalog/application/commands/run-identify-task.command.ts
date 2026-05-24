/**
 * WHY this file exists:
 * Inputs for creating an identify proposal. The fragment is already chosen by
 * the admin (preview-then-commit) — the handler does not invoke any scraper.
 */
import type { ScrapedCourseFragment } from '../../domain/scraper/scraper.types';
import type { MergePolicy } from '../../domain/identify/merge-policy';

export class RunIdentifyTaskCommand {
  constructor(
    public readonly courseId: string,
    public readonly source: string,
    public readonly sourceUrl: string | undefined,
    public readonly fragment: ScrapedCourseFragment,
    public readonly mergePolicy: MergePolicy,
  ) {}
}
