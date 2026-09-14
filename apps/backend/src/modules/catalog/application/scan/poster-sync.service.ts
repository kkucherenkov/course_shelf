/**
 * WHY this file exists:
 * Single call site for "the course's posterUrl changed, keep
 * posterStoragePath in sync" (#496). Three command handlers set
 * Course.posterUrl from three different sources (a scan's course.json, the
 * admin PATCH /courses/:id body, the metadata backfill script) and all three
 * need the same download-or-clear behaviour after — pulled out here so the
 * download call and its idempotency check exist exactly once.
 *
 * Idempotency: re-applying the same URL (the common case — every scan of an
 * already-imported course re-reads the same course.json) is a no-op, so a
 * routine rescan never re-downloads. The trade-off: if the derived poster
 * file is deleted out-of-band while the URL stays the same, it stays missing
 * until the URL actually changes. Acceptable for v1 — not the failure mode
 * this fix targets.
 */
import { Inject, Injectable } from '@nestjs/common';

import { POSTER_DOWNLOADER } from '../../domain/course/poster-downloader.port';

import type { Course } from '../../domain/course/course';
import type { PosterDownloader } from '../../domain/course/poster-downloader.port';

@Injectable()
export class PosterSyncService {
  constructor(@Inject(POSTER_DOWNLOADER) private readonly downloader: PosterDownloader) {}

  /**
   * Sets `course.posterUrl` to `nextUrl` and keeps `posterStoragePath` in
   * sync with it:
   *   - `nextUrl` unchanged from the current value → no-op.
   *   - `nextUrl` undefined → both fields cleared.
   *   - new/changed `nextUrl` → download attempted; `posterStoragePath` is
   *     set on success and cleared on ANY failure — the course still saves.
   */
  async applyPosterUrl(course: Course, nextUrl: string | undefined): Promise<void> {
    if (course.posterUrl === nextUrl) return;

    course.setPosterUrl(nextUrl);

    if (!nextUrl) {
      course.setPosterStoragePath(undefined);
      return;
    }

    const storagePath = await this.downloader.download({
      courseId: course.id,
      libraryId: course.libraryId,
      url: nextUrl,
    });
    course.setPosterStoragePath(storagePath);
  }
}
