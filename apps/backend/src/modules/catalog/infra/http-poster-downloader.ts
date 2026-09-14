/**
 * WHY this file exists:
 * Adapter for the PosterDownloader port (#496). Reuses HttpFetcher's
 * SSRF-guarded, timeout-bounded, size-capped fetch — the same trust boundary
 * as scraping (a URL that came from third-party page content) — and adds the
 * one extra check a binary download needs that an HTML fetch doesn't: the
 * Content-Type must be a real image, mapped through a fixed allowlist so the
 * on-disk extension is never derived from an attacker-controlled string.
 *
 * Every failure mode (blocked host, timeout, oversized body, wrong/missing
 * content-type, disk error) resolves to `undefined` and logs a warning —
 * never throws. A course without a reachable poster must still save (#496).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Injectable, Logger } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import { derivedCoursePosterPath } from '../domain/transcription/derived-path';
import { HttpFetcher } from './scrapers/http-fetcher';

import type {
  PosterDownloadRequest,
  PosterDownloader,
} from '../domain/course/poster-downloader.port';

/** Fixed allowlist — the on-disk extension is never derived from a raw header string. */
const CONTENT_TYPE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class HttpPosterDownloader implements PosterDownloader {
  private readonly logger = new Logger(HttpPosterDownloader.name);
  private readonly fetcher: HttpFetcher;

  constructor(private readonly appConfig: AppConfig) {
    // Reuses the scraper HTTP budget (timeout/size-cap/UA) — poster downloads
    // are the same trust boundary as scraping, not a separately-tuned concern.
    this.fetcher = new HttpFetcher(appConfig.scrapers);
  }

  async download({ courseId, libraryId, url }: PosterDownloadRequest): Promise<string | undefined> {
    try {
      const { status, headers, body } = await this.fetcher.fetchBinary(url);
      if (status !== 200) {
        this.logger.warn(`Poster download for course ${courseId} got status ${String(status)}.`);
        return undefined;
      }

      const rawContentType = headers.get('content-type') ?? '';
      const contentType = rawContentType.split(';')[0]?.trim().toLowerCase() ?? '';
      const extension = CONTENT_TYPE_EXTENSIONS[contentType];
      if (!extension) {
        this.logger.warn(
          `Poster download for course ${courseId} has unsupported content-type "${rawContentType}".`,
        );
        return undefined;
      }

      const absolutePath = derivedCoursePosterPath({
        derivedRoot: this.appConfig.derivedPath,
        libraryId,
        courseId,
        extension,
      });
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, body);
      return absolutePath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Poster download for course ${courseId} failed: ${message}`);
      return undefined;
    }
  }
}
