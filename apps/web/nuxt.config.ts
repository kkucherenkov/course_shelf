import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';

const here = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2026-04-18',
  srcDir: 'app/',
  ssr: false,
  // devtools is disabled in dev because vite-plugin-inspect (its hard
  // dependency) interferes with plugin ordering for @intlify/unplugin-vue-i18n
  // — it lets vite:json run after the unplugin's transform of locale JSON
  // files, which then fails because the unplugin has already converted the
  // JSON to a JS module. Re-enable per-developer if needed.
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/i18n'],

  nitro: {
    // No explicit `preset: 'static'`. With `ssr: false` Nuxt infers the static
    // preset automatically on `nuxt generate`, and forcing it here triggers
    // Nitro's "Payload extraction is recommended" warning that cannot be
    // silenced by user config — `@nuxt/schema` hard-resolves
    // `experimental.payloadExtraction` to `false` whenever `ssr: false`,
    // which the same module then flags as a missing opt-in. Upstream bug.
    //
    // Separately, Nuxt 4.4 + Nitro 2.13 ship overlapping `useAppConfig`
    // auto-imports (`nitropack/runtime/internal/config` +
    // `@nuxt/nitro-server/.../app-config`). Unimport logs a benign
    // "Duplicated imports" warning; @nuxt/nitro-server's copy wins.
    // Pending https://github.com/nuxt/nuxt — expected to clear in 4.5.
  },

  // Translations live in per-locale JSON files under `app/i18n/locales/`.
  // We tried per-component `<i18n lang="json">` blocks, but @nuxtjs/i18n v10
  // forces `include: []` on @intlify/unplugin-vue-i18n whenever `langDir` is
  // unset, and with an empty include the unplugin's transform is a no-op.
  // The result: vite:json wins the transform race for `?vue&type=i18n&...
  // lang.json` URLs and throws "Failed to parse JSON file" on every page
  // mount. Standard per-locale files are the @nuxtjs/i18n v10 supported path.
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    langDir: 'locales',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
    },
  },

  css: ['~/assets/css/main.css'],

  vite: {
    // Register @intlify/unplugin-vue-i18n FIRST so it claims locale
    // JSON files via a stable glob pattern. @nuxtjs/i18n v10 also
    // registers the unplugin internally but with `include: localePaths`
    // (absolute path strings used as picomatch patterns) — those don't
    // reliably match the absolute path Vite passes during transform,
    // so vite:json (built-in) ends up running on the JS code the
    // unplugin already produced and chokes with "Failed to parse JSON".
    // Our manual registration uses a glob and `enforce: 'pre'` so it's
    // unambiguously first in the chain.
    plugins: [
      VueI18nPlugin({
        include: [resolve(here, './i18n/locales/**')],
      }),
      tailwindcss(),
    ],
    // Pre-bundle libs Vite would otherwise discover at runtime and trigger
    // a full dev-server reload for.
    optimizeDeps: {
      include: ['better-auth/vue'],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1',
      authBaseUrl: process.env.NUXT_PUBLIC_AUTH_BASE_URL ?? 'http://localhost:3000',
    },
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  ui: {
    colorMode: true,
  },

  devServer: {
    port: 3001,
    host: '0.0.0.0',
  },
});
