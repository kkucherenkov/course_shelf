import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer } from 'better-auth/plugins';
import { I18nService } from 'nestjs-i18n';

import { EMAIL_PORT } from '../../modules/integrations/domain/email.port';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';

import type { IEmailService } from '../../modules/integrations/domain/email.port';
import type { Request } from 'express';

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
): ReturnType<typeof betterAuth> {
  const { basePath, secret, baseUrl } = config.betterAuth;
  const instance = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
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
    plugins: [admin(), bearer()],
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
  ) {}

  onModuleInit(): void {
    this.instance = createInstance(this.prisma, this.config, this.email, this.i18n);
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
