/**
 * WHY this file exists:
 * PostgreSQL cannot store `U+0000` in a `text` column. When one reaches a write
 * the driver raises
 *
 *   DriverAdapterError: invalid byte sequence for encoding "UTF8": 0x00
 *
 * which is neither a `DomainError` nor a `PrismaClientKnownRequestError`, so it
 * falls through every mapping and the request answers **500**. Found by the
 * first authenticated Schemathesis run (#321) on `POST /api/v1/admin/studios`,
 * but nothing about it is specific to that route: `"\u0000"` is legal JSON and
 * satisfies every `type: string` in the spec, so every write endpoint has the
 * same hole and no per-field validator would close it.
 *
 * A NUL byte in a display name is never meaningful input, so this rejects the
 * request at the trust boundary — one guard where all callers pass, rather than
 * a `.replaceAll('\0', '')` in every adapter. 400 is documented on every write
 * operation in openapi.yaml, so the answer stays inside the contract.
 *
 * Mounted in `configureApp()` after `express.json()` (the body has to exist
 * first) and before the Nest router. It covers the request line as well as the
 * body — `GET /api/v1/search?q=…%00…` 500'd for exactly the same reason.
 */
import { DomainError } from '../../shared/domain-error';

import type { NextFunction, Request, Response } from 'express';

/**
 * Guard against a pathological nesting depth in a hand-crafted body — the walk
 * is bounded, not the payload (that is `express.json({ limit })`'s job).
 */
const MAX_DEPTH = 64;

export class NullByteInPayloadError extends DomainError {
  constructor() {
    super({
      code: 'null-byte-in-payload',
      status: 400,
      title: 'Bad Request',
      detail: 'Request body contains a NUL character (U+0000), which cannot be stored.',
    });
    this.name = 'NullByteInPayloadError';
  }
}

function containsNullByte(value: unknown, depth: number): boolean {
  if (depth > MAX_DEPTH) return false;
  if (typeof value === 'string') return value.includes('\u0000');
  if (Array.isArray(value)) return value.some((item) => containsNullByte(item, depth + 1));
  if (typeof value === 'object' && value !== null) {
    // Keys too: `{"a\u0000b": 1}` reaches a JSONB column just as easily.
    return Object.entries(value).some(
      ([key, item]) => key.includes('\u0000') || containsNullByte(item, depth + 1),
    );
  }
  return false;
}

/**
 * A NUL cannot travel raw in a URL, so in the request line it is always the
 * `%00` escape — one `includes` on the raw URL covers every query parameter and
 * every path segment at once, before routing has even happened.
 * `GET /api/v1/search?q=…%00…` was the second 500 of this shape.
 */
function urlHasEncodedNullByte(url: string): boolean {
  return url.toLowerCase().includes('%00');
}

export function rejectNullBytes(req: Request, _res: Response, next: NextFunction): void {
  const url = req.originalUrl || req.url;
  if (urlHasEncodedNullByte(url) || (req.body !== undefined && containsNullByte(req.body, 0))) {
    next(new NullByteInPayloadError());
    return;
  }
  next();
}
