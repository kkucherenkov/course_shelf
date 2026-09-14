/**
 * WHY this file exists:
 * Port for downloading a scraped course poster into DERIVED_PATH (#496).
 * `Course.posterUrl` is a third-party CDN URL (blocked by the SPA's CSP
 * `img-src 'self'`); this is the write side that turns it into a file our own
 * origin can serve. The adapter owns every bound on that network call (SSRF
 * guard, timeout, size cap, content-type allowlist) — this interface only
 * describes the outcome.
 */

export const POSTER_DOWNLOADER = Symbol('POSTER_DOWNLOADER');

export interface PosterDownloadRequest {
  readonly courseId: string;
  readonly libraryId: string;
  readonly url: string;
}

export interface PosterDownloader {
  /**
   * Downloads `url` and stores it under DERIVED_PATH, returning the absolute
   * path suitable for `Course.setPosterStoragePath`. Resolves to `undefined`
   * on ANY failure (blocked host, timeout, oversized body, unsupported
   * content-type, disk error) — never throws. A course without a reachable
   * poster must still save; the caller decides what "no poster" means.
   */
  download(request: PosterDownloadRequest): Promise<string | undefined>;
}
