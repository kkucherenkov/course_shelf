/**
 * Nuxt client-only plugin that configures the @app/api-client-ts singleton.
 *
 * Responsibilities:
 *  1. Set `baseUrl` from runtime config (strips the `/api/v1` suffix because
 *     the generated SDK already includes that prefix in every URL path).
 *  2. Attach a request interceptor that adds `Authorization: Bearer <token>`
 *     whenever the auth store holds a token.
 *  3. Attach a response interceptor that handles 401 by attempting one
 *     session refresh; on failure it clears auth state and redirects to
 *     `/login`.
 *
 * The `.client.ts` suffix makes Nuxt register this plugin client-side only,
 * consistent with the SPA (`ssr: false`) architecture.
 */

import { client } from '@app/api-client-ts';

import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  // The generated SDK paths include `/api/v1/...`, so baseUrl must be the
  // bare host+port. Strip any trailing `/api/v1` suffix that may appear in
  // the runtime config value.
  const baseUrl = (config.public.apiBaseUrl as string).replace(/\/api\/v1\/?$/, '');
  client.setConfig({ baseUrl });

  // -------------------------------------------------------------------------
  // Request interceptor — attach bearer token when present.
  // -------------------------------------------------------------------------
  client.interceptors.request.use((req: Request) => {
    // Resolve Pinia store lazily — Pinia is initialised before plugins run.
    const auth = useAuthStore();
    if (auth.token) {
      req.headers.set('Authorization', `Bearer ${auth.token}`);
    }
    return req;
  });

  // -------------------------------------------------------------------------
  // Response interceptor — 401 handling with one refresh attempt.
  // -------------------------------------------------------------------------
  let isRefreshing = false;

  client.interceptors.response.use(async (res: Response, req: Request) => {
    if (res.status !== 401 || isRefreshing) return res;

    const auth = useAuthStore();
    isRefreshing = true;

    try {
      const ok = await auth.refresh();

      if (!ok) {
        // Session could not be refreshed — clear state and redirect.
        auth.clear();
        await nuxtApp.runWithContext(() => navigateTo('/login'));
        return res;
      }

      // Retry the original request once with the refreshed token.
      if (auth.token) {
        req.headers.set('Authorization', `Bearer ${auth.token}`);
      }
      return fetch(req);
    } finally {
      isRefreshing = false;
    }
  });
});
