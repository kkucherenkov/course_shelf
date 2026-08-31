/**
 * Optional override for the Better Auth database adapter.
 *
 * Unbound in the running application, where `AuthService` builds a
 * `prismaAdapter` over `PrismaService`. The backend e2e suite binds it to
 * `memoryAdapter({})` so the sign-up → sign-in → session → sign-out round trip
 * runs through the *real* Better Auth handler, the real `AuthController` and
 * the real `SessionGuard` without needing a Postgres instance — the database
 * is the only external system those tests have to fake, and faking it here is
 * cheaper and truer than stubbing `AuthService` itself.
 */
export const AUTH_DATABASE = Symbol('AUTH_DATABASE');
