import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [vue(), tsconfigPaths()],
  resolve: {
    alias: {
      // Nuxt auto-import shim: resolve '#imports' to vue so composables
      // that import from '#imports' can still import real Vue primitives.
      // Page-level Nuxt composables (useColorMode, etc.) are mocked per-test.
      '#imports': resolve(root, 'vitest.nuxt-imports-shim.ts'),
      // Nuxt srcDir alias
      '~': resolve(root, 'app'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    // Mounting a whole Nuxt page costs well over vitest's 5s default once
    // another package's suite is competing for CPU. On 2026-09-17 four page
    // specs failed with "Test timed out in 5000ms" at the mount call during a
    // parallel `turbo run test`, and all 583 passed when this suite ran alone
    // (tuxedo 231). The timeout is a hung-process heuristic, not a performance
    // budget, so raising it costs nothing and stops a loaded runner reporting
    // a false red.
    testTimeout: 15_000,
    include: [
      'tests/unit/**/*.spec.ts',
      'app/__tests__/**/*.spec.ts',
      'app/pages/__tests__/**/*.spec.ts',
      'app/layouts/__tests__/**/*.spec.ts',
      'app/stores/**/*.spec.ts',
      'app/middleware/__tests__/**/*.spec.ts',
      'app/composables/__tests__/**/*.spec.ts',
      'app/components/**/__tests__/**/*.spec.ts',
      'app/components/__tests__/**/*.spec.ts',
      'app/utils/**/*.spec.ts',
    ],
  },
});
