import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer, phoneNumber } from 'better-auth/plugins';

import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { SMS_PORT } from '../../modules/integrations/domain/sms.port';

import type { ISmsService } from '../../modules/integrations/domain/sms.port';
import type { Request } from 'express';

// TS2742: the phoneNumber() plugin exposes zod v4 core internals in its
// inferred return type. Casting through `unknown` to the base `betterAuth`
// return type erases the un-nameable generic while keeping `handler` and
// `api.getSession` — the only two methods this service and its callers use.
function createInstance(
  prisma: PrismaService,
  config: AppConfig,
  sms: ISmsService,
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
    emailAndPassword: { enabled: true, autoSignIn: true },
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
      phoneNumber({
        sendOTP: async ({ phoneNumber: phone, code }) => {
          await sms.sendOtp(phone, code);
        },
        // Required so the plugin creates a new user on first OTP verification.
        // The email is a synthetic non-deliverable placeholder; the phone number
        // is the primary credential. Users update their display name in /me.
        signUpOnVerification: {
          getTempEmail: (phone: string) => `phone-${phone.replace(/^\+/, '')}@noreply.app.internal`,
          getTempName: (phone: string) => phone,
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
    @Inject(SMS_PORT) private readonly sms: ISmsService,
  ) {}

  onModuleInit(): void {
    this.instance = createInstance(this.prisma, this.config, this.sms);
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
