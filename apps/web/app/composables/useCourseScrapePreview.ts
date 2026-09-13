/**
 * "Fill from source" panel composable (E30-F03-S01).
 *
 * Wraps `scrapeCoursePreview` (`POST /api/v1/admin/courses/{id}/scrape-preview`)
 * and `listScrapers` (to populate the source picker for `kind: 'name'`, which
 * requires an explicit `source`).
 *
 * Deliberately returns raw candidates and nothing else — resolving
 * `instructorNames` / `studioName` / `tags` to entity ids is Stage 4 of the
 * identify pipeline (`runIdentifyTask` and friends), which is out of scope
 * for this card. The panel applies only the fields that map directly onto
 * `UpdateCourseRequest` without that resolution step.
 */

import { ref, type Ref } from 'vue';
import { scrapeCoursePreview, listScrapers, client } from '@app/api-client-ts';
import type { ScrapeCandidateDto, ScraperInfoDto, ScrapePreviewRequest } from '@app/api-client-ts';

export type ScrapePreviewStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseCourseScrapePreviewReturn {
  candidates: Ref<ScrapeCandidateDto[]>;
  status: Ref<ScrapePreviewStatus>;
  scrapers: Ref<ScraperInfoDto[]>;
  /** Runs the scrape; returns an error message key-agnostic Error, or null on success. */
  run: (request: ScrapePreviewRequest) => Promise<Error | null>;
}

export function useCourseScrapePreview(courseId: string): UseCourseScrapePreviewReturn {
  const candidates = ref<ScrapeCandidateDto[]>([]);
  const status = ref<ScrapePreviewStatus>('idle');
  const scrapers = ref<ScraperInfoDto[]>([]);

  async function loadScrapers(): Promise<void> {
    const res = await listScrapers({ client, throwOnError: false });
    if (!res.error) scrapers.value = res.data.scrapers;
  }
  void loadScrapers();

  async function run(request: ScrapePreviewRequest): Promise<Error | null> {
    status.value = 'pending';
    try {
      const res = await scrapeCoursePreview({
        client,
        throwOnError: false,
        path: { id: courseId },
        body: request,
      });
      if (res.error) {
        status.value = 'error';
        const p = res.error as { detail?: string; title?: string };
        return new Error(p.detail ?? p.title ?? 'Scrape failed');
      }
      candidates.value = res.data.candidates;
      status.value = 'success';
      return null;
    } catch (error_) {
      status.value = 'error';
      return error_ instanceof Error ? error_ : new Error('Unexpected error');
    }
  }

  return { candidates, status, scrapers, run };
}
