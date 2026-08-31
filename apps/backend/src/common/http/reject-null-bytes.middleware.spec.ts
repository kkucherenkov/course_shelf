/**
 * Unit tests for the NUL-byte guard. The HTTP-level behaviour is covered in
 * `test/http-contract.e2e-spec.ts`; these pin the branches a closed OpenAPI
 * schema hides there — object keys, arrays and nesting.
 */
import { describe, expect, it, vi } from 'vitest';

import { NullByteInPayloadError, rejectNullBytes } from './reject-null-bytes.middleware';

import type { NextFunction, Request, Response } from 'express';

const NUL = '\u0000';

function run(body: unknown): unknown {
  const next: NextFunction = vi.fn();
  rejectNullBytes({ body } as Request, {} as Response, next);
  return (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
}

describe('rejectNullBytes', () => {
  it('passes a clean body through with no error', () => {
    expect(run({ displayName: 'Elena', tags: ['a', 'b'], nested: { n: 1 } })).toBeUndefined();
  });

  it('passes an absent body through', () => {
    expect(run(undefined)).toBeUndefined();
  });

  it('rejects a NUL in a top-level string value', () => {
    expect(run({ displayName: `Ele${NUL}na` })).toBeInstanceOf(NullByteInPayloadError);
  });

  it('rejects a NUL in an object key', () => {
    expect(run({ [`display${NUL}Name`]: 'Elena' })).toBeInstanceOf(NullByteInPayloadError);
  });

  it('rejects a NUL nested inside an array of objects', () => {
    expect(run({ externalIds: [{ source: 'udemy', externalId: `x${NUL}y` }] })).toBeInstanceOf(
      NullByteInPayloadError,
    );
  });

  it('answers 400 with a stable code', () => {
    const error = run({ a: NUL }) as NullByteInPayloadError;
    expect(error.status).toBe(400);
    expect(error.code).toBe('null-byte-in-payload');
  });

  it('gives up rather than recursing forever on a pathologically deep body', () => {
    let deep: Record<string, unknown> = { leaf: NUL };
    for (let i = 0; i < 200; i++) deep = { child: deep };
    // Bounded walk: the NUL past the depth cap is not found, and — the point of
    // the test — the call returns instead of blowing the stack.
    expect(() => run(deep)).not.toThrow();
  });
});
