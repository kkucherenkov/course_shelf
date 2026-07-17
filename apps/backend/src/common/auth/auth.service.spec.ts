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
 * They also pin GitHub #173 (wiring password reset): the `sendResetPassword`
 * callback is present (without it Better Auth answers RESET_PASSWORD_DISABLED)
 * and it delivers the reset URL through the EMAIL_PORT.
 *
 * The instance is built for real (no mocking of better-auth); Prisma and
 * AppConfig are stubbed (constructing the instance performs no I/O) and the
 * EMAIL_PORT is a real MockEmailService so delivery is observable.
 */
import { describe, expect, it } from 'vitest';

import { MockEmailService } from '../../modules/integrations/infra/mock-email.service';
import { AuthService } from './auth.service';

import type { AppConfig } from '../config/app-config';
import type { PrismaService } from '../prisma/prisma.service';
import type { I18nService } from 'nestjs-i18n';

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

// Returns the i18n key verbatim so tests don't depend on locale-file contents;
// the reset URL is concatenated by the callback, not interpolated by i18n.
function makeI18n(): I18nService {
  return { t: (key: string) => key } as unknown as I18nService;
}

function bootService(email: MockEmailService = new MockEmailService()): AuthService {
  const service = new AuthService(makePrisma(), makeConfig(), email, makeI18n());
  service.onModuleInit();
  return service;
}

type ResetPasswordFn = (data: {
  user: { email: string };
  url: string;
  token: string;
}) => Promise<void>;

function sendResetPassword(service: AuthService): ResetPasswordFn | undefined {
  const options = service.auth.options as unknown as {
    emailAndPassword?: { sendResetPassword?: ResetPasswordFn };
  };
  return options.emailAndPassword?.sendResetPassword;
}

function apiKeys(service: AuthService): string[] {
  return Object.keys(service.auth.api as unknown as Record<string, unknown>);
}

function pluginIds(service: AuthService): string[] {
  const options = service.auth.options as unknown as { plugins?: { id: string }[] };
  return (options.plugins ?? []).map((plugin) => plugin.id);
}

describe('AuthService', () => {
  it('constructs from Prisma, AppConfig, the email port and i18n', () => {
    // The phoneNumber plugin was the only consumer of SMS_PORT (removed in
    // #157). #173 added the EMAIL_PORT + I18nService dependencies to deliver
    // the password-reset email, so the constructor now takes four args.
    expect(() => bootService()).not.toThrow();
    expect(AuthService.length).toBe(4);
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

    // Exact, not `toContain` — deliberately. This is how the phoneNumber
    // plugin got here in the first place: E04-F02-S01 ("Configure Better Auth
    // with bearer + admin plugins") shipped ✅ Done recording, as a footnote,
    // "Deviation 3: an extra `phoneNumber` plugin is enabled on top of the
    // card's three ... left as-is" — and it sat unnoticed until #157 removed
    // it. An exact assertion is what would have surfaced that the day it
    // landed. When SSO adds a plugin this test WILL fail; that failure is the
    // point — extend the list on purpose. Do not loosen it to `toContain`.
    expect(pluginIds(service)).toEqual(['admin', 'bearer']);
    // admin() route surface used by the admin module's RBAC.
    expect(apiKeys(service)).toContain('setRole');
    expect(apiKeys(service)).toContain('listUsers');
    expect(apiKeys(service)).toContain('banUser');
  });

  it('wires sendResetPassword so reset is enabled (not RESET_PASSWORD_DISABLED)', () => {
    // Better Auth only honors requestPasswordReset/resetPassword when
    // emailAndPassword.sendResetPassword is a function; otherwise the route
    // logs "Reset password isn't enabled" and answers RESET_PASSWORD_DISABLED.
    // The route key existing (asserted above) is necessary but NOT sufficient —
    // this pins the callback that makes the route actually work (#173).
    expect(typeof sendResetPassword(bootService())).toBe('function');
  });

  it('delivers the reset URL through the EMAIL_PORT', async () => {
    const email = new MockEmailService();
    const service = bootService(email);

    const send = sendResetPassword(service);
    expect(send).toBeDefined();

    const url = 'http://localhost:3000/api/v1/auth/reset-password/tok-123?callbackURL=';
    await send?.({ user: { email: 'reset@example.com' }, url, token: 'tok-123' });

    const sent = email.sentTo('reset@example.com');
    expect(sent).toHaveLength(1);
    // The reset link must survive into the delivered body, both text and HTML.
    expect(sent[0]?.text).toContain(url);
    expect(sent[0]?.html).toContain(url);
    expect(sent[0]?.subject).toBe('auth.resetPassword.subject');
    // Nothing was sent to an unrelated address.
    expect(email.sentTo('someone-else@example.com')).toHaveLength(0);
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
