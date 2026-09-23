import { describe, it, expect } from 'vitest';

import { isAdminGatedRoute, resolveAdminAccess } from '../useAdminAccess';

describe('resolveAdminAccess', () => {
  it('is "unknown" for a live token with no confirmed session yet', () => {
    expect(resolveAdminAccess(true, false, undefined)).toBe('unknown');
  });

  it('is "denied" for a confirmed non-admin session', () => {
    expect(resolveAdminAccess(true, true, 'user')).toBe('denied');
  });

  it('is "denied" for a confirmed session with no role at all', () => {
    expect(resolveAdminAccess(true, true, undefined)).toBe('denied');
  });

  it('is "granted" for a confirmed admin session', () => {
    expect(resolveAdminAccess(true, true, 'admin')).toBe('granted');
  });

  it('accepts the historical uppercase ADMIN stamp', () => {
    expect(resolveAdminAccess(true, true, 'ADMIN')).toBe('granted');
  });

  it('is "denied", not "unknown", once there is no token to wait on', () => {
    expect(resolveAdminAccess(false, false, undefined)).toBe('denied');
  });
});

describe('isAdminGatedRoute', () => {
  it('matches /admin and every path under it', () => {
    expect(isAdminGatedRoute('/admin')).toBe(true);
    expect(isAdminGatedRoute('/admin/users')).toBe(true);
    expect(isAdminGatedRoute('/admin/libraries/lib-1')).toBe(true);
  });

  it('matches the course metadata editor (#795)', () => {
    expect(isAdminGatedRoute('/courses/abc123/edit')).toBe(true);
  });

  it('does not match the course detail or lesson player pages', () => {
    expect(isAdminGatedRoute('/courses/abc123')).toBe(false);
    expect(isAdminGatedRoute('/courses/abc123/lessons/lesson-1')).toBe(false);
  });

  it('does not match an unrelated route that merely starts with "admin"', () => {
    expect(isAdminGatedRoute('/administration')).toBe(false);
  });

  it('does not match a random route', () => {
    expect(isAdminGatedRoute('/browse')).toBe(false);
    expect(isAdminGatedRoute('/')).toBe(false);
  });
});
