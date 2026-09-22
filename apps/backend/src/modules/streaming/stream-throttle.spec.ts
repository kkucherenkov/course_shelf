/**
 * WHY this file exists:
 * `isStreamRequest` decides which routes escape the global 60/60s budget, so a
 * predicate that matched too widely would quietly un-throttle the API. The two
 * `*-url` routes on the same controller are the trap: they mint signed URLs,
 * answer JSON, and must stay on the global budget even though they live beside
 * the streaming handlers and carry `stream` in their path (#792).
 */
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { isStreamRequest } from './stream-throttle';

function httpContext(url: string): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ url }) }),
  } as unknown as ExecutionContext;
}

describe('isStreamRequest', () => {
  it.each([
    '/api/v1/stream/lessons/lesson-1',
    '/api/v1/stream/lessons/lesson-1/subtitles/ru',
    '/api/v1/stream/materials/material-1',
    '/api/v1/stream/lessons/lesson-1?token=abc',
  ])('matches the streaming route %s', (url) => {
    expect(isStreamRequest(httpContext(url))).toBe(true);
  });

  // The whole point of scoping per method rather than per controller: these two
  // sit on StreamingController but are ordinary JSON and keep the global limit.
  it.each([
    '/api/v1/lessons/lesson-1/stream-url',
    '/api/v1/lessons/lesson-1/materials/material-1/download-url',
  ])('does not match the signed-URL route %s', (url) => {
    expect(isStreamRequest(httpContext(url))).toBe(false);
  });

  it.each(['/api/v1/courses', '/api/v1/auth/get-session', '/api/v1/realtime/token'])(
    'does not match the unrelated route %s',
    (url) => {
      expect(isStreamRequest(httpContext(url))).toBe(false);
    },
  );

  it('ignores a non-http context', () => {
    const ctx = { getType: () => 'rpc' } as unknown as ExecutionContext;
    expect(isStreamRequest(ctx)).toBe(false);
  });
});
