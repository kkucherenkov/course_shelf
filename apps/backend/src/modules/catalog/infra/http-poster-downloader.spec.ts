/**
 * Unit tests for HttpPosterDownloader (#496) — real local HTTP server (same
 * approach as http-fetcher.spec.ts), real filesystem writes to a temp dir.
 * `allowLoopbackForTests: true` is folded into the fake AppConfig.scrapers
 * object so HttpFetcher's SSRF guard permits hitting the local server —
 * HttpFetcherConfig accepts it structurally even though ScrapersConfig
 * doesn't declare it; production AppConfig.scrapers never sets it.
 *
 * Scenarios:
 *   1. 200 + image/jpeg → writes the file under <derivedRoot>/<libraryId>/posters/<courseId>.jpg,
 *      returns that path.
 *   2. Non-200 status → resolves undefined, no file written.
 *   3. Unsupported/missing content-type → resolves undefined, no file written.
 *   4. Oversized body (exceeds maxResponseBytes) → resolves undefined.
 *   5. Blocked host (SSRF guard, allowLoopbackForTests: false) → resolves undefined, never throws.
 */
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HttpPosterDownloader } from './http-poster-downloader';

import type { AppConfig } from '../../../common/config/app-config';

let FIXTURE_DIR: string;
let server: Server;
let base: string;

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]);

beforeAll(async () => {
  FIXTURE_DIR = mkdtempSync(path.join(os.tmpdir(), 'poster-downloader-fixtures-'));

  server = createServer((req, res) => {
    switch (req.url) {
      case '/poster.jpg': {
        res.writeHead(200, { 'content-type': 'image/jpeg' }).end(JPEG_BYTES);
        break;
      }
      case '/not-found': {
        res.writeHead(404).end('nope');
        break;
      }
      case '/wrong-type': {
        res.writeHead(200, { 'content-type': 'text/html' }).end('<html>not an image</html>');
        break;
      }
      case '/no-type': {
        res.writeHead(200).end(JPEG_BYTES);
        break;
      }
      case '/huge': {
        res.writeHead(200, { 'content-type': 'image/jpeg' }).end(Buffer.alloc(5000, 1));
        break;
      }
      default: {
        res.writeHead(404).end('nope');
      }
    }
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

function makeAppConfig(allowLoopback: boolean): AppConfig {
  return {
    derivedPath: FIXTURE_DIR,
    scrapers: {
      httpTimeoutMs: 1000,
      maxResponseBytes: 1024,
      userAgent: 'courseShelf-test',
      allowLoopbackForTests: allowLoopback,
    },
  } as unknown as AppConfig;
}

describe('HttpPosterDownloader', () => {
  it('downloads a jpeg and writes it under <derivedRoot>/<libraryId>/posters/<courseId>.jpg', async () => {
    const downloader = new HttpPosterDownloader(makeAppConfig(true));

    const result = await downloader.download({
      courseId: 'course-1',
      libraryId: 'lib-1',
      url: `${base}/poster.jpg`,
    });

    const expected = path.join(FIXTURE_DIR, 'lib-1', 'posters', 'course-1.jpg');
    expect(result).toBe(expected);
    expect(existsSync(expected)).toBe(true);
    expect(Buffer.compare(readFileSync(expected), JPEG_BYTES)).toBe(0);
  });

  it('resolves undefined (never throws) on a non-200 status', async () => {
    const downloader = new HttpPosterDownloader(makeAppConfig(true));

    const result = await downloader.download({
      courseId: 'course-2',
      libraryId: 'lib-1',
      url: `${base}/not-found`,
    });

    expect(result).toBeUndefined();
    expect(existsSync(path.join(FIXTURE_DIR, 'lib-1', 'posters', 'course-2.jpg'))).toBe(false);
  });

  it('resolves undefined for a content-type outside the fixed allowlist', async () => {
    const downloader = new HttpPosterDownloader(makeAppConfig(true));

    const result = await downloader.download({
      courseId: 'course-3',
      libraryId: 'lib-1',
      url: `${base}/wrong-type`,
    });

    expect(result).toBeUndefined();
  });

  it('resolves undefined when the response has no content-type header', async () => {
    const downloader = new HttpPosterDownloader(makeAppConfig(true));

    const result = await downloader.download({
      courseId: 'course-4',
      libraryId: 'lib-1',
      url: `${base}/no-type`,
    });

    expect(result).toBeUndefined();
  });

  it('resolves undefined when the body exceeds maxResponseBytes', async () => {
    const downloader = new HttpPosterDownloader(makeAppConfig(true));

    const result = await downloader.download({
      courseId: 'course-5',
      libraryId: 'lib-1',
      url: `${base}/huge`,
    });

    expect(result).toBeUndefined();
  });

  it('resolves undefined (never throws) when the SSRF guard blocks the host', async () => {
    const downloader = new HttpPosterDownloader(makeAppConfig(false));

    const result = await downloader.download({
      courseId: 'course-6',
      libraryId: 'lib-1',
      url: `${base}/poster.jpg`,
    });

    expect(result).toBeUndefined();
  });
});
