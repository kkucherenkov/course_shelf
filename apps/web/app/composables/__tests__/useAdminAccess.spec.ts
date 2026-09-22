import { describe, it, expect } from 'vitest';

import { resolveAdminAccess } from '../useAdminAccess';

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
