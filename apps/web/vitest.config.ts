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
    include: [
      'tests/unit/**/*.spec.ts',
      'app/pages/__tests__/**/*.spec.ts',
      'app/stores/**/*.spec.ts',
      'app/composables/__tests__/**/*.spec.ts',
    ],
  },
});
