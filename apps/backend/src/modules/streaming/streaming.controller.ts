/**
 * WHY this file exists:
 * HTTP entry point for the Streaming bounded context. Follows the exact same
 * pattern as LessonsController:
 *   1. Resolve session → actor (id + role).
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
 *   The empty-string base path is idiomatic NestJS when routes in one controller
 *   span multiple URL segments.
 *
 * getLessonStream uses `@Res()` directly:
 *   Nest's standard return-value pipeline cannot stream binary data with custom
 *   status codes and Range headers. We take over the response manually. This is
 *   the documented NestJS escape hatch for streaming / binary endpoints.
 */
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { IssueStreamTokenQuery } from './application/queries/issue-stream-token.query';
import { LessonFileLocator } from './domain/lesson-file-locator';
import { parseRangeHeader } from './domain/range-request-parser';
import { StreamTokenSigner } from './domain/stream-token/stream-token-signer';
import { StreamTokenInvalidError } from './domain/stream-token/stream-token.errors';

import type { Request, Response } from 'express';
import type { StreamUrlDto } from '@app/api-client-ts';

// ---------------------------------------------------------------------------
// Content-Type map (extension → MIME)
// ---------------------------------------------------------------------------

const MIME_MAP: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
};

function videoMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

/** Extract a single string value from a header that may be string | string[] | undefined. */
function firstHeader(h: string | string[] | undefined): string | undefined {
  if (h === undefined) return undefined;
  return Array.isArray(h) ? h[0] : h;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller({ path: '', version: '1' })
export class StreamingController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
    private readonly streamTokenSigner: StreamTokenSigner,
    private readonly lessonFileLocator: LessonFileLocator,
  ) {}

  /**
   * Resolves the session and returns the actor (id + role).
   * Throws UnauthorizedException (401) — the only HTTP exception allowed in a
   * controller; domain errors are thrown by handlers.
   */
  private async resolveActor(req: Request): Promise<{ id: string; role: string }> {
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    return { id: session.user.id, role };
  }

  /** GET /api/v1/lessons/:id/stream-url */
  @UseGuards(SessionGuard)
  @Get('lessons/:id/stream-url')
  async issueStreamUrl(@Param('id') id: string, @Req() req: Request): Promise<StreamUrlDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<IssueStreamTokenQuery, StreamUrlDto>(
      new IssueStreamTokenQuery(id, actor),
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
   * WHY @Res(): Nest's return-value pipeline cannot send binary data with
   * custom status codes, Range headers, and streaming body together. This is
   * the standard NestJS documented exception for full response control.
   */
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
