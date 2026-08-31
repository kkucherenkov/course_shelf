import { Inject, Injectable, Optional, OnModuleInit } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer, emailOTP } from 'better-auth/plugins';
import { I18nService } from 'nestjs-i18n';

import { EMAIL_PORT } from '../../modules/integrations/domain/email.port';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';

import { AUTH_DATABASE } from './auth.tokens';

import type { IEmailService } from '../../modules/integrations/domain/email.port';
import type { Request } from 'express';

/**
 * The adapter-factory shape Better Auth's `database` option accepts.
 *
 * Derived from `prismaAdapter`'s return type rather than
 * `BetterAuthOptions['database']`: that union also admits a raw Kysely
 * dialect and a `better-sqlite3` handle, both typed `any`, which collapses
 * the whole union to `any`. Every adapter this project could plausibly use
 * (prisma, memory) is a factory.
 */
export type AuthDatabaseAdapter = ReturnType<typeof prismaAdapter>;

// TS2883/TS2322: the Better Auth plugins expose zod v4 core internals ($strip)
// in the inferred return type, which cannot be named portably, while the
// concrete `Auth<ConcreteOptions>` is not assignable to `Auth<BetterAuthOptions>`
// (the generic is invariant). Annotating with the base `betterAuth` return type
// and casting through `unknown` erases the un-nameable generic while keeping
// `handler` and `api.getSession` — the only two methods this service and its
// callers use.
function createInstance(
  prisma: PrismaService,
  config: AppConfig,
  email: IEmailService,
  i18n: I18nService,
  database: AuthDatabaseAdapter | undefined,
): ReturnType<typeof betterAuth> {
  const { basePath, secret, baseUrl } = config.betterAuth;
  // The same toggle `GET /admin/instance` advertises to the SPA, which is what
  // makes the sign-up wizard draw its 6-digit step. Wiring it here too is what
  // makes that step mean something: with it off, nothing below changes any
  // behaviour; with it on, sign-up mails an OTP and an unverified account
  // cannot sign in.
  const { emailVerificationRequired } = config.instance;
  const instance = betterAuth({
    database: database ?? prismaAdapter(prisma, { provider: 'postgresql' }),
    secret,
    baseURL: baseUrl,
    basePath,
    // Use UUID v4 for all IDs so they satisfy the OpenAPI `format: uuid`
    // contract and are consistent with seed data.
    advanced: { database: { generateId: () => crypto.randomUUID() } },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      // Better Auth calls this with { user, url, token } when
      // `requestPasswordReset` runs; without it the route answers
      // RESET_PASSWORD_DISABLED (GitHub #173). Delivery goes through the
      // EMAIL_PORT — MockEmailService in dev, a real SMTP adapter in prod.
      // The reset URL is server-built by Better Auth, so it is concatenated
      // verbatim rather than routed through i18n interpolation.
      sendResetPassword: async ({ user, url }) => {
        const subject = i18n.t('auth.resetPassword.subject');
        const body = i18n.t('auth.resetPassword.body');
        await email.send({
          to: user.email,
          subject,
          text: `${body}\n\n${url}`,
          html: `<p>${body}</p><p><a href="${url}">${url}</a></p>`,
        });
      },
      requireEmailVerification: emailVerificationRequired,
    },
    emailVerification: {
      // Without this the wizard's step 2 would have no code to verify — the
      // OTP has to be in the user's inbox before they are asked for it.
      sendOnSignUp: emailVerificationRequired,
      // Verification is the last gate before the wizard's library step, which
      // is an authenticated call. `requireEmailVerification` means sign-up's
      // `autoSignIn` produced no session, so verifying has to produce one or
      // the user lands on step 3 signed out.
      autoSignInAfterVerification: true,
    },
    // Additional fields on the user model:
    //   - role: stored by the admin plugin for RBAC checks (defaultValue 'USER').
    //   - displayName: optional user-facing name separate from the auth name.
    // These fields are type-safe in the DB and accessible on session.user via
    // the (session.user as Record<string, unknown>).role / .displayName cast pattern.
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'USER' },
        displayName: { type: 'string', required: false },
      },
    },
    plugins: [
      admin(),
      bearer(),
      // `overrideDefaultEmailVerification` replaces Better Auth's default
      // verification *link* with a 6-digit OTP, which is the surface
      // `pages/sign-up.vue` already draws.
      //
      // `disableSignUp` is load-bearing, not tidiness. The plugin's routes are
      // public and exist as soon as it is registered, and with sign-up left
      // enabled `POST /sign-in/email-otp` *creates* a user with
      // `emailVerified: true` when none matches the address — bypassing the
      // sign-up wizard, the password policy and `requireEmailVerification`,
      // and, on a fresh instance, taking `role: 'ADMIN'` from the
      // first-user hook below. It also makes
      // `/email-otp/send-verification-otp` mail a code to addresses with no
      // account at all. Email OTP is only ever a *verification* step here, so
      // both are closed.
      emailOTP({
        overrideDefaultEmailVerification: true,
        disableSignUp: true,
        sendVerificationOTP: async ({ email: to, otp }) => {
          const subject = i18n.t('auth.verifyEmail.subject');
          const body = i18n.t('auth.verifyEmail.body');
          await email.send({
            to,
            subject,
            text: `${body}\n\n${otp}`,
            html: `<p>${body}</p><p><strong>${otp}</strong></p>`,
          });
        },
      }),
    ],
    trustedOrigins: config.runtime.corsOrigins,
    databaseHooks: {
      user: {
        create: {
          // First user on a fresh install becomes the admin. After that the
          // additionalFields default ('USER') applies. take:1 short-circuits
          // at the first row.
          // Better Auth 1.6 passes (user, context) — context is unused here.
          before: async (user, _context) => {
            const existingCount = await prisma.user.count({ take: 1 });
            if (existingCount === 0) {
              return { data: { ...user, role: 'ADMIN' } };
            }
            return { data: user };
          },
        },
      },
    },
  });
  return instance as unknown as ReturnType<typeof betterAuth>;
}

type BetterAuthInstance = ReturnType<typeof createInstance>;

@Injectable()
export class AuthService implements OnModuleInit {
  private instance!: BetterAuthInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
    @Inject(EMAIL_PORT) private readonly email: IEmailService,
    private readonly i18n: I18nService,
    // Test seam — see AUTH_DATABASE. Unbound in the running app, in which case
    // the Prisma adapter below is used.
    @Optional() @Inject(AUTH_DATABASE) private readonly database?: AuthDatabaseAdapter,
  ) {}

  onModuleInit(): void {
    this.instance = createInstance(this.prisma, this.config, this.email, this.i18n, this.database);
  }

  /**
   * The Better Auth instance itself. Exposed so other modules (realtime) can
   * call `api.getSession(...)` and domain code can use typed helpers.
   */
  get auth(): BetterAuthInstance {
    return this.instance;
  }

  /**
   * Derive the active session (if any) from an Express request. Returns
   * `null` when unauthenticated — callers are expected to throw their own
   * localised errors on null.
   */
  async getSession(
    request: Request,
  ): Promise<Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>> {
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') headers.set(key, value);
      else if (Array.isArray(value)) headers.set(key, value.join(','));
    }
    return this.instance.api.getSession({ headers });
  }
}
