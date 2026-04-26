import { describe, expect, it } from 'vitest';

import { DomainError, InvariantViolation, NotFound, PermissionDenied } from './domain-error';

describe('DomainError', () => {
  it('captures code, status, title, detail in instance fields', () => {
    const error = new DomainError({
      code: 'sample',
      status: 418,
      title: 'I am a teapot',
      detail: 'Brewing not supported.',
    });
    expect(error.code).toBe('sample');
    expect(error.status).toBe(418);
    expect(error.title).toBe('I am a teapot');
    expect(error.detail).toBe('Brewing not supported.');
    expect(error.message).toBe('Brewing not supported.');
  });

  it('falls back to title when detail is omitted', () => {
    const error = new DomainError({ code: 'no-detail', status: 500, title: 'Boom' });
    expect(error.message).toBe('Boom');
    expect(error.detail).toBeUndefined();
  });

  it('preserves cause for error chain inspection', () => {
    const root = new Error('root');
    const error = new DomainError({ code: 'wrap', status: 500, title: 'Wrap', cause: root });
    expect(error.cause).toBe(root);
  });

  it('is instanceof Error and DomainError', () => {
    const error = new DomainError({ code: 's', status: 500, title: 't' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('InvariantViolation', () => {
  it('uses 422 with default code', () => {
    const error = new InvariantViolation('Quantity must be positive.');
    expect(error.status).toBe(422);
    expect(error.code).toBe('invariant-violation');
    expect(error.title).toBe('Invariant violation');
    expect(error.detail).toBe('Quantity must be positive.');
    expect(error.name).toBe('InvariantViolation');
    expect(error).toBeInstanceOf(DomainError);
  });

  it('accepts a narrower code override', () => {
    const error = new InvariantViolation('detail', 'cart-empty');
    expect(error.code).toBe('cart-empty');
  });
});

describe('NotFound', () => {
  it('uses 404 with default code', () => {
    const error = new NotFound('Course c-1 does not exist.');
    expect(error.status).toBe(404);
    expect(error.code).toBe('not-found');
    expect(error.title).toBe('Not found');
    expect(error.name).toBe('NotFound');
  });
});

describe('PermissionDenied', () => {
  it('uses 403 with default detail and code', () => {
    const error = new PermissionDenied();
    expect(error.status).toBe(403);
    expect(error.code).toBe('permission-denied');
    expect(error.detail).toBe('Access denied.');
    expect(error.name).toBe('PermissionDenied');
  });

  it('accepts a custom detail', () => {
    const error = new PermissionDenied('You do not own this lesson.');
    expect(error.detail).toBe('You do not own this lesson.');
  });
});
