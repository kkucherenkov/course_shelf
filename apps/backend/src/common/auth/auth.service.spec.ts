/**
 * WHY this file exists:
 * `/api/v1/auth/*` is a Better Auth catch-all that is deliberately NOT declared
 * in `packages/specs/openapi/openapi.yaml`, so `express-openapi-validator`
 * cannot catch drift on these routes. These tests are the only automated guard
 * over the auth route surface.
 *
 * They pin the outcome of GitHub #157 (removal of the `phoneNumber` plugin —
 * "Appointments" template residue) from both directions:
 *   - the email/password product routes and the admin + bearer plugins survive;
 *   - no phone/OTP route can be reintroduced unnoticed.
 *
 * The instance is built for real (no mocking of better-auth); only Prisma and
 * AppConfig are stubbed, since constructing the instance performs no I/O.
 */
import { describe, expect, it } from 'vitest';

import { AuthService } from './auth.service';

import type { AppConfig } from '../config/app-config';
import type { PrismaService } from '../prisma/prisma.service';

function makeConfig(): AppConfig {
  return {
    betterAuth: {
      secret: 'test-secret-value-at-least-32-chars-long',
      baseUrl: 'http://localhost:3000',
      basePath: '/api/v1/auth',
    },
    runtime: { corsOrigins: ['http://localhost:3001'] },
  } as unknown as AppConfig;
}

function makePrisma(): PrismaService {
  return { user: { count: () => Promise.resolve(0) } } as unknown as PrismaService;
}

function bootService(): AuthService {
  const service = new AuthService(makePrisma(), makeConfig());
  service.onModuleInit();
  return service;
}

function apiKeys(service: AuthService): string[] {
  return Object.keys(service.auth.api as unknown as Record<string, unknown>);
}

function pluginIds(service: AuthService): string[] {
  const options = service.auth.options as unknown as { plugins?: { id: string }[] };
  return (options.plugins ?? []).map((plugin) => plugin.id);
}

describe('AuthService', () => {
  it('constructs without an SMS port', () => {
    // The phoneNumber plugin was the only consumer of SMS_PORT; AuthService now
    // depends on Prisma + AppConfig alone.
    expect(() => bootService()).not.toThrow();
    expect(AuthService.length).toBe(2);
  });

  it('keeps the email + password routes mobile and web depend on', () => {
    const keys = apiKeys(bootService());

    // /sign-in/email, /sign-up/email, /sign-out, /get-session
    expect(keys).toContain('signInEmail');
    expect(keys).toContain('signUpEmail');
    expect(keys).toContain('signOut');
    expect(keys).toContain('getSession');
  });

  it('keeps the core routes backed by the shared verification table', () => {
    const keys = apiKeys(bootService());

    // The phoneNumber plugin stored its OTPs in the CORE `verification` table
    // rather than owning one, so the table survives #157. These routes are why.
    expect(keys).toContain('requestPasswordReset');
    expect(keys).toContain('resetPassword');
    expect(keys).toContain('verifyEmail');
    expect(keys).toContain('sendVerificationEmail');
  });

  it('keeps the admin and bearer plugins, and only those', () => {
    const service = bootService();

    expect(pluginIds(service)).toEqual(['admin', 'bearer']);
    // admin() route surface used by the admin module's RBAC.
    expect(apiKeys(service)).toContain('setRole');
    expect(apiKeys(service)).toContain('listUsers');
    expect(apiKeys(service)).toContain('banUser');
  });

  it('exposes no phone or OTP route', () => {
    const service = bootService();

    expect(pluginIds(service)).not.toContain('phone-number');
    for (const endpoint of [
      'signInPhoneNumber',
      'sendPhoneNumberOTP',
      'verifyPhoneNumber',
      'requestPasswordResetPhoneNumber',
      'resetPasswordPhoneNumber',
    ]) {
      expect(apiKeys(service)).not.toContain(endpoint);
    }
    expect(apiKeys(service).filter((key) => /phone/i.test(key))).toEqual([]);
  });
});
