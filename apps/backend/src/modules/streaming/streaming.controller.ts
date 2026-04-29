/**
 * WHY this file exists:
 * HTTP entry point for the Streaming bounded context. Follows the exact same
 * pattern as LessonsController:
 *   1. Extract the actor from @Session() — resolved by the global SessionGuard.
 *   2. Dispatch via QueryBus.
 *   3. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no domain mapping here.
 *
 * Path-prefix rearrangement (E08-F02-S01):
 *   The original controller used `@Controller({ path: 'lessons', version: '1' })`
 *   so that `GET :id/stream-url` resolved to `/api/v1/lessons/:id/stream-url`.
 *   The new streaming endpoint must be at `/api/v1/stream/lessons/:id` — a
 *   different top-level segment. Rather than adding a second controller class,
 *   we change the base path to `''` and explicitly prefix each route:
 *     - `@Get('lessons/:id/stream-url')` — unchanged URL for clients.
 *     - `@Get('stream/lessons/:id')` — new binary-response streaming endpoint.
 *     - `@Get('stream/lessons/:id/subtitles/:language')` — subtitle (E08-F02-S02).
 *     - `@Get('lessons/:lessonId/materials/:materialId/download-url')` — material URL.
 *     - `@Get('stream/materials/:materialId')` — material binary download endpoint.
 *   The empty-string base path is idiomatic NestJS when routes in one controller
 *   span multiple URL segments.
 *
 * getLessonStream and getLessonSubtitle use `@Res()` directly:
 *   Nest's standard return-value pipeline cannot stream binary data with custom
 *   status codes and Range headers. We take over the response manually. This is
 *   the documented NestJS escape hatch for streaming / binary endpoints.
 *
 *   Both streaming routes are @AllowAnonymous() because the caller presents a
 *   short-lived HMAC stream token (issued by issueStreamUrl) as the auth
 *   mechanism. The global SessionGuard must not intercept these routes; the
 *   StreamTokenSigner.verify() call is the only auth check needed here.
 *
 * getLessonSubtitle (E08-F02-S02):
 *   Reuses the same StreamTokenSigner.verify() call as the video endpoint. For
 *   `.vtt` sources the file is piped as-is. For `.srt` sources the content is
 *   converted in-memory via convertSrtToVtt() and the result is written to a
 *   `*.cache.vtt` sibling so the next request is a zero-cost file read. The
 *   cache write is best-effort — a read-only mount must not break the request.
 *   The route stays outside OpenAPI (same rationale as the video endpoint).
 *   The player builds the subtitle URL from LessonDto.subtitles[].language.
 *
 * getMaterialStream:
 *   Material sidecar files (PDF / Markdown / image) are downloaded whole — no
 *   Range support. The token is a material-scoped token minted by
 *   issueMaterialDownloadUrl (scope "material"). A lesson-scoped token is
 *   rejected by StreamTokenSigner.verifyMaterial (scope mismatch → 401).
 *   The material token embeds `lid` (lessonId) so locateMaterial can be called
 *   without an extra DB query.
 *   Content-Disposition: attachment forces a download rather than inline display.
 *   CORP: cross-origin mirrors the video endpoint for the same reasons.
 *   This route is exempt from OpenAPI validation (binary response, no JSON schema).
 */
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomBytes } from 'node:crypto';

import { BadRequestException, Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AllowAnonymous, Session } from '../../common/auth/decorators';
import { IssueStreamTokenQuery } from './application/queries/issue-stream-token.query';
import { IssueMaterialDownloadQuery } from './application/queries/issue-material-download.query';
import { LessonFileLocator } from './domain/lesson-file-locator';
import { parseRangeHeader } from './domain/range-request-parser';
import { convertSrtToVtt } from './domain/subtitle-converter';
import { StreamTokenSigner } from './domain/stream-token/stream-token-signer';
import { StreamTokenInvalidError } from './domain/stream-token/stream-token.errors';

import type { SessionContext } from '../../common/auth/decorators';
import type { Request, Response } from 'express';
import type { MaterialDownloadUrlDto, StreamUrlDto } from '@app/api-client-ts';

// ---------------------------------------------------------------------------
// Content-Type maps (extension → MIME)
// ---------------------------------------------------------------------------

const VIDEO_MIME_MAP: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
};

const MATERIAL_MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function videoMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_MIME_MAP[ext] ?? 'application/octet-stream';
}

function materialMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MATERIAL_MIME_MAP[ext] ?? 'application/octet-stream';
}

/** Extract a single string value from a header that may be string | string[] | undefined. */
function firstHeader(h: string | string[] | undefined): string | undefined {
  if (h === undefined) return undefined;
  return Array.isArray(h) ? h[0] : h;
}

/**
 * Produce a safe filename for Content-Disposition by stripping characters that
 * are problematic inside a quoted-string (RFC 6266 / RFC 5987).
 * We keep letters, digits, spaces, hyphens, underscores, and dots — everything
 * else is replaced with an underscore.
 */
function safeFilename(label: string, ext: string): string {
  const sanitized = label.replaceAll(/[^a-zA-Z0-9 .\-_]/g, '_');
  return `${sanitized}${ext}`;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller({ path: '', version: '1' })
export class StreamingController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly streamTokenSigner: StreamTokenSigner,
    private readonly lessonFileLocator: LessonFileLocator,
  ) {}

  /** GET /api/v1/lessons/:id/stream-url */
  @Get('lessons/:id/stream-url')
  async issueStreamUrl(
    @Param('id') id: string,
    @Session() session: SessionContext,
  ): Promise<StreamUrlDto> {
    const actor = session.user;
    return this.queryBus.execute<IssueStreamTokenQuery, StreamUrlDto>(
      new IssueStreamTokenQuery(id, actor),
    );
  }

  /** GET /api/v1/lessons/:lessonId/materials/:materialId/download-url */
  @Get('lessons/:lessonId/materials/:materialId/download-url')
  async issueMaterialDownloadUrl(
    @Param('lessonId') lessonId: string,
    @Param('materialId') materialId: string,
    @Session() session: SessionContext,
  ): Promise<MaterialDownloadUrlDto> {
    const actor = session.user;
    return this.queryBus.execute<IssueMaterialDownloadQuery, MaterialDownloadUrlDto>(
      new IssueMaterialDownloadQuery(lessonId, materialId, actor),
    );
  }

  /**
   * GET /api/v1/stream/lessons/:id?token=…
   *
   * Streams the lesson video with full HTTP Range support:
   *   200  — full file (no Range header)
   *   206  — partial content (single or multipart/byteranges)
   *   400  — malformed Range header
   *   401  — invalid / expired / tampered stream token
   *   404  — lesson not found or file not on disk
   *   416  — range not satisfiable
   *   500  — path-traversal guard triggered (LessonFilePathEscapedError)
   *
   * WHY @AllowAnonymous(): the caller presents a short-lived HMAC stream token
   * in the query string as the auth mechanism; no session cookie is expected.
   * StreamTokenSigner.verify() is the sole auth check for this route.
   *
   * WHY @Res(): Nest's return-value pipeline cannot send binary data with
   * custom status codes, Range headers, and streaming body together. This is
   * the standard NestJS documented exception for full response control.
   */
  @AllowAnonymous()
  @Get('stream/lessons/:id')
  async getLessonStream(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('token') token: string,
  ): Promise<void> {
    // 1. Verify token — any StreamTokenInvalidError subclass surfaces as 401
    //    through HttpExceptionFilter. Re-throw as-is (domain error).
    if (!token) {
      throw new StreamTokenInvalidError('Stream token is required.');
    }
    this.streamTokenSigner.verify(token, id);

    // 2. Resolve absolute path.
    const { absolutePath, sizeBytes } = await this.lessonFileLocator.locate(id);

    // 3. Content-Type from extension.
    const mime = videoMimeType(absolutePath);

    // Helmet's default `Cross-Origin-Resource-Policy: same-origin` would
    // make the browser refuse to embed this response in a <video> from any
    // page that isn't on the exact same origin. The stream is auth'd via a
    // short-lived signed token in the query string, so cross-origin embeds
    // are intentional. Override CORP to `cross-origin` here so the SPA can
    // load the video whether it's on the proxy origin (8080), the bare
    // Nuxt origin (3001), or a future production domain.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // 4. Parse Range header.
    const range = parseRangeHeader(firstHeader(req.headers.range), sizeBytes);

    // 5. Branch on range kind.
    switch (range.kind) {
      case 'absent': {
        res.status(200);
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', sizeBytes);
        res.setHeader('Accept-Ranges', 'bytes');
        const stream = createReadStream(absolutePath);
        req.on('close', () => stream.destroy());
        await pipeline(stream, res);
        return;
      }

      case 'invalid': {
        // 400: malformed Range header — no body.
        throw new BadRequestException('Malformed Range header.');
      }

      case 'unsatisfiable': {
        res.status(416);
        res.setHeader('Content-Range', `bytes */${String(sizeBytes)}`);
        res.end();
        return;
      }

      case 'single': {
        const { start, end } = range.range;
        res.status(206);
        res.setHeader(
          'Content-Range',
          `bytes ${String(start)}-${String(end)}/${String(sizeBytes)}`,
        );
        res.setHeader('Content-Length', end - start + 1);
        res.setHeader('Content-Type', mime);
        res.setHeader('Accept-Ranges', 'bytes');
        const stream = createReadStream(absolutePath, { start, end });
        req.on('close', () => stream.destroy());
        await pipeline(stream, res);
        return;
      }

      case 'multi': {
        const boundary = randomBytes(16).toString('hex');
        res.status(206);
        res.setHeader('Content-Type', `multipart/byteranges; boundary=${boundary}`);
        res.setHeader('Accept-Ranges', 'bytes');
        // Write each part sequentially via an async generator so we never
        // preload the file into memory — each slice goes through its own
        // createReadStream.
        await writeMultipartRanges(res, req, absolutePath, range.ranges, mime, sizeBytes, boundary);
        return;
      }
    }
  }

  /**
   * GET /api/v1/stream/lessons/:id/subtitles/:language?token=…
   *
   * Delivers a subtitle track as WebVTT regardless of whether the source is
   * already `.vtt` or needs conversion from `.srt`. The token is the same
   * StreamTokenSigner token the video endpoint issues — no separate subtitle
   * token is minted.
   *
   *   200  — text/vtt body
   *   401  — missing / expired / tampered token
   *   404  — lesson not found OR no subtitle in the requested language
   *
   * WHY @AllowAnonymous(): same rationale as getLessonStream — the stream token
   * is the auth mechanism; no session cookie is expected.
   *
   * Source-form switch:
   *   .vtt  — pipe the file as-is.
   *   .srt  — convert in-memory, write result to `<abs>.cache.vtt` sibling
   *           (best-effort; read-only mounts must not break the request).
   *           On subsequent requests, if cacheStat.mtime > srcStat.mtime,
   *           serve the cache; otherwise regenerate.
   *
   * WHY @Res(): same reason as getLessonStream — we write a text body manually
   * to control Content-Type exactly and keep the controller interface lean.
   * This route is exempt from the OpenAPI validator (falls under the
   * `/v1/stream/lessons/` prefix already ignored in openapi-validator.middleware.ts).
   */
  @AllowAnonymous()
  @Get('stream/lessons/:id/subtitles/:language')
  async getLessonSubtitle(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('language') language: string,
    @Query('token') token: string,
  ): Promise<void> {
    // 1. Verify token.
    if (!token) {
      throw new StreamTokenInvalidError('Stream token is required.');
    }
    this.streamTokenSigner.verify(token, id);

    // 2. Locate the subtitle file.
    const { absolutePath, extension } = await this.lessonFileLocator.locateSubtitle(id, language);

    // 3. Serve with Content-Type: text/vtt and CORP cross-origin so the
    // <track> tag can load it from any SPA origin (see the video endpoint
    // above for the rationale).
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (extension === '.vtt') {
      // Source is already VTT — stream as-is.
      res.status(200);
      const stream = createReadStream(absolutePath);
      req.on('close', () => stream.destroy());
      await pipeline(stream, res);
      return;
    }

    // Source is .srt — check for a valid cache sibling first.
    const cachePath = `${absolutePath.slice(0, -4)}.cache.vtt`;

    try {
      const [srcStat, cacheStat] = await Promise.all([stat(absolutePath), stat(cachePath)]);
      if (cacheStat.mtime > srcStat.mtime) {
        // Cache is fresh — serve it.
        res.status(200);
        const cacheStream = createReadStream(cachePath);
        req.on('close', () => cacheStream.destroy());
        await pipeline(cacheStream, res);
        return;
      }
    } catch {
      // Cache absent or stat failed — fall through to (re)generate.
    }

    // Convert the .srt source in memory (subtitle files are small, < 1 MiB).
    const srtContent = await readFile(absolutePath, 'utf8');
    const vttContent = convertSrtToVtt(srtContent);

    // Best-effort cache write — ignore errors (e.g. read-only mount).
    try {
      await writeFile(cachePath, vttContent, 'utf8');
    } catch {
      // Intentionally swallowed.
    }

    res.status(200);
    res.end(vttContent, 'utf8');
  }

  /**
   * GET /api/v1/stream/materials/:materialId?token=…
   *
   * Downloads a material sidecar file (PDF, Markdown, image) as an attachment.
   * No Range support — materials are downloaded whole (no progressive streaming).
   *
   *   200  — full file with Content-Disposition: attachment
   *   401  — missing / expired / tampered / wrong-scope token
   *   404  — lesson or material not found, or file absent on disk
   *   500  — path-traversal guard triggered
   *
   * WHY @AllowAnonymous(): same rationale as getLessonStream — the material
   * token in the query string is the sole auth mechanism. verifyMaterial()
   * rejects any token whose scope is not "material" (lesson tokens, etc.).
   *
   * WHY @Res(): same reason as getLessonStream — binary body + custom headers.
   *
   * The material token embeds `lid` (lessonId) so locateMaterial(lessonId,
   * materialId) can be called without an extra DB query.
   *
   * This route is exempt from the OpenAPI validator — the response is raw bytes,
   * not JSON. See openapi-validator.middleware.ts ignorePaths.
   */
  @AllowAnonymous()
  @Get('stream/materials/:materialId')
  async getMaterialStream(
    @Req() req: Request,
    @Res() res: Response,
    @Param('materialId') materialId: string,
    @Query('token') token: string,
  ): Promise<void> {
    // 1. Verify material-scoped token. Returns embedded lessonId.
    if (!token) {
      throw new StreamTokenInvalidError('Stream token is required.');
    }
    const { lessonId } = this.streamTokenSigner.verifyMaterial(token, materialId);

    // 2. Locate the material file — also re-validates that materialId exists
    //    on this lesson (defence in depth: token binding + DB check).
    const { absolutePath, sizeBytes, label } = await this.lessonFileLocator.locateMaterial(
      lessonId,
      materialId,
    );

    // 3. Set headers.
    const mime = materialMimeType(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const filename = safeFilename(label, ext);

    // Same CORP override as the video endpoint — the download link is embedded
    // via a transient <a href> that may be on a different origin.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', sizeBytes);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 4. Pipe the file.
    res.status(200);
    const stream = createReadStream(absolutePath);
    req.on('close', () => stream.destroy());
    await pipeline(stream, res);
  }
}

// ---------------------------------------------------------------------------
// Multipart helper
// ---------------------------------------------------------------------------

/**
 * Streams a multipart/byteranges response to `res`.
 * Each range is written as:
 *   --<boundary>\r\n
 *   Content-Type: <mime>\r\n
 *   Content-Range: bytes <start>-<end>/<total>\r\n
 *   \r\n
 *   <slice bytes>\r\n
 * Followed by the closing delimiter:
 *   --<boundary>--\r\n
 *
 * WHY sequential pipe: each createReadStream is opened and closed before the
 * next starts, so file descriptors are bounded by range count (not opened in
 * parallel). res.write + pipe-with-{end:false} keeps the connection open
 * across parts.
 */
async function writeMultipartRanges(
  res: Response,
  req: Request,
  absolutePath: string,
  ranges: { start: number; end: number }[],
  mime: string,
  total: number,
  boundary: string,
): Promise<void> {
  for (const { start, end } of ranges) {
    const partHeader =
      `--${boundary}\r\n` +
      `Content-Type: ${mime}\r\n` +
      `Content-Range: bytes ${String(start)}-${String(end)}/${String(total)}\r\n` +
      `\r\n`;
    res.write(partHeader);

    const slice = createReadStream(absolutePath, { start, end });
    req.on('close', () => slice.destroy());

    // pipe with end:false keeps the response open between parts.
    await new Promise<void>((resolve, reject) => {
      slice.on('end', resolve);
      slice.on('error', reject);
      slice.pipe(res, { end: false });
    });

    res.write('\r\n');
  }

  res.write(`--${boundary}--\r\n`);
  res.end();
}
