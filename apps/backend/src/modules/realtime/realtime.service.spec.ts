import * as jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type SessionUser } from '../../common/auth/decorators';
import { AppConfig } from '../../common/config/app-config';

import { RealtimeService } from './realtime.service';

const SECRET = 'unit-test-secret';
const TTL = 300;

const config = {
  centrifugo: { tokenHmacSecret: SECRET, tokenTtlSeconds: TTL, apiUrl: '', apiKey: '' },
} as unknown as AppConfig;

const user: SessionUser = { id: 'user-abc-123', role: 'student' };

describe('RealtimeService', () => {
  let service: RealtimeService;

  beforeEach(() => {
    service = new RealtimeService(config);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a token whose sub matches the user id', () => {
    const { token } = service.issueToken(user);
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    expect(payload['sub']).toBe(user.id);
  });

  it('sets exp to approximately now + ttl (±2 s)', () => {
    const { token } = service.issueToken(user);
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    const expectedExp = Math.floor(Date.now() / 1000) + TTL;
    expect(payload['exp']).toBeGreaterThanOrEqual(expectedExp - 2);
    expect(payload['exp']).toBeLessThanOrEqual(expectedExp + 2);
  });

  it('includes exactly the expected channels claim', () => {
    const { token } = service.issueToken(user);
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    const channels: string[] = payload['channels'];
    const expected = [
      'system:health',
      `progress:user:${user.id}`,
      `notifications:user:${user.id}`,
      `scans:user:${user.id}`,
    ];
    expect(channels).toHaveLength(expected.length);
    for (const ch of expected) {
      expect(channels).toContain(ch);
    }
  });

  it('returns an expiresAt ISO string whose epoch seconds match exp', () => {
    const { token, expiresAt } = service.issueToken(user);
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    const expiresAtSeconds = Math.floor(new Date(expiresAt).getTime() / 1000);
    expect(expiresAtSeconds).toBe(payload['exp']);
  });

  it('signature verifies against the configured HMAC secret', () => {
    const { token } = service.issueToken(user);
    expect(() => jwt.verify(token, SECRET)).not.toThrow();
  });

  it('rejects the token when verified with a wrong secret', () => {
    const { token } = service.issueToken(user);
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });
});
