/**
 * Runtime config bridge.
 *
 * The SPA is built once and shipped as static files. Per-deployment values
 * (apiBaseUrl, authBaseUrl) come from `window.__APP_CONFIG__`, which is
 * populated by `<script src="/_app-config.js">` — a tiny file the production
 * web image generates at container start from environment variables.
 *
 * This plugin's filename starts with `00.` so it runs before every other
 * plugin. By the time `~/plugins/api.client.ts` reads `apiBaseUrl` to
 * configure the SDK client, the runtime override is already applied.
 *
 * Missing or malformed `__APP_CONFIG__` is a no-op — the build-time
 * defaults from `nuxt.config.ts:runtimeConfig` keep working (the dev
 * stack relies on this; there is no _app-config.js in dev).
 */

interface AppRuntimeConfig {
  apiBaseUrl?: string;
  authBaseUrl?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppRuntimeConfig;
  }
}

export default defineNuxtPlugin(() => {
  const overrides = typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined;
  if (!overrides) return;

  const config = useRuntimeConfig();
  if (typeof overrides.apiBaseUrl === 'string' && overrides.apiBaseUrl.length > 0) {
    config.public.apiBaseUrl = overrides.apiBaseUrl;
  }
  if (typeof overrides.authBaseUrl === 'string' && overrides.authBaseUrl.length > 0) {
    config.public.authBaseUrl = overrides.authBaseUrl;
  }
});
