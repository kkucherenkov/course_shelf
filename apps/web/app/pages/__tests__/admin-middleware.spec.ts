/**
 * Unit test for apps/web/app/middleware/admin.ts
 *
 * The middleware is a documented no-op now (#776) — it used to redirect a
 * confirmed non-admin to `/`, which meant the admin dashboard still mounted
 * (and 403'd) during the "role not yet known" window before this redirect
 * ever got a chance to fire (#695), and a redirect can't show an inline "no
 * access" screen anyway. The three-state decision (unknown / denied /
 * granted) this file used to make now lives in `useAdminAccess.spec.ts`
 * (the decision) and `AdminAccessGate.spec.ts` (the rendering) — this test
 * only guards that the middleware itself never navigates away, for any
 * auth state, so a page's `definePageMeta({ middleware: 'admin' })` keeps
 * resolving to a real middleware function.
 */

import { describe, it, expect, vi } from 'vitest';

const mockNavigateTo = vi.fn();

// defineNuxtRouteMiddleware and navigateTo are Nuxt compiler macros (global
// auto-imports). Stub them globally so the middleware module can be imported
// in a plain Vitest env without the Nuxt runtime.
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: (...args: unknown[]) => unknown) => fn);
vi.stubGlobal('navigateTo', (...args: unknown[]) => mockNavigateTo(...args));

describe('admin middleware', () => {
  it('never navigates away, regardless of caller — gating moved to AdminAccessGate', async () => {
    const mod = await import('../../middleware/admin');
    const middleware = mod.default;
    // @ts-expect-error — Nuxt's middleware signature takes (to, from); this
    // file's body never reads either argument, so the type is irrelevant here.
    await middleware();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });
});
