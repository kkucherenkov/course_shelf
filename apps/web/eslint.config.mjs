import nuxtPreset from '@app/eslint-config/nuxt.mjs';

// CLAUDE.md: Nuxt UI foundation primitives that must NOT appear in apps/web templates.
// These are plain visual elements — we replace them with native @app/ui components
// that use BEM/SCSS tokens. Behavior-heavy Nuxt UI primitives (UModal, UDropdownMenu, …)
// are wrapped by @app/ui and are only allowed via those wrappers.
const BANNED_NUXT_UI_FOUNDATION = [
  'UButton',
  'UBadge',
  'UChip',
  'UInput',
  'USwitch',
  'UField',
  'UProgress',
  'UAvatar',
  'UTabs',
  'UIcon',
  'URatingStars',
  'UBanner',
  'USegmentedControl',
  'UKbd',
];

const BANNED_MESSAGE =
  'Direct use of a Nuxt UI foundation primitive is banned (CLAUDE.md). ' +
  'Use the @app/ui equivalent: AppButton, AppInput, AppBadge, AppChip, AppSwitch, ' +
  'AppProgress, AppAvatar, AppTabs, AppIcon, AppRatingStars, AppBanner, AppSegmented, AppKbd.';

// Nuxt composables + auto-imports (this app is SPA-only: no SSR globals).
const nuxtGlobals = {
  $fetch: 'readonly',
  defineNuxtConfig: 'readonly',
  defineNuxtPlugin: 'readonly',
  defineNuxtRouteMiddleware: 'readonly',
  definePageMeta: 'readonly',
  navigateTo: 'readonly',
  useApi: 'readonly',
  useAsyncData: 'readonly',
  useAuth: 'readonly',
  useCookie: 'readonly',
  useHead: 'readonly',
  useI18n: 'readonly',
  useLazyAsyncData: 'readonly',
  useLazyFetch: 'readonly',
  useNuxtApp: 'readonly',
  useRoute: 'readonly',
  useRouter: 'readonly',
  useRuntimeConfig: 'readonly',
  useState: 'readonly',
};

const vueAutoImports = {
  computed: 'readonly',
  reactive: 'readonly',
  ref: 'readonly',
  shallowRef: 'readonly',
  watch: 'readonly',
  watchEffect: 'readonly',
  onMounted: 'readonly',
  onUnmounted: 'readonly',
  onBeforeMount: 'readonly',
  onBeforeUnmount: 'readonly',
  nextTick: 'readonly',
  provide: 'readonly',
  inject: 'readonly',
};

export default [
  ...nuxtPreset,
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'node_modules/**',
      'eslint.config.mjs',
      'nuxt.config.ts',
      'vitest.config.ts',
      'app/design-tokens.generated.ts',
      'app/assets/css/tokens.generated.css',
    ],
  },
  {
    languageOptions: { globals: { ...nuxtGlobals, ...vueAutoImports } },
    rules: {
      // ariaLabel is a camelCase prop on @app/ui components (AppIconButton, AppSpinner, …).
      // vue/attribute-hyphenation 'always' would force aria-label but TS rejects the kebab form
      // since the prop is declared as `ariaLabel: string` (not as an arbitrary HTML attr).
      'vue/attribute-hyphenation': ['error', 'always', { ignore: ['ariaLabel'] }],
      'unicorn/filename-case': [
        'error',
        { cases: { camelCase: true, kebabCase: true, pascalCase: true } },
      ],
      'unicorn/no-negated-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // CLAUDE.md: all styling goes through SCSS + BEM tokens. Static inline style=""
      // attributes bypass the design system — use a CSS class or custom property instead.
      'vue/no-static-inline-styles': 'error',
      // CLAUDE.md: every visual or interactive element goes through @app/ui.
      // Direct imports of Nuxt UI (or its auto-imported components via #components)
      // from apps/web are a review blocker — they leak Tailwind utilities into our DOM.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nuxt/ui',
              message:
                'Do not import @nuxt/ui directly. Go through @app/ui — add a wrapper there if missing.',
            },
            {
              name: '#components',
              message:
                'Do not import from #components. Visual elements come from @app/ui (CLAUDE.md).',
            },
            // Ban individual named imports of foundation primitives.
            ...BANNED_NUXT_UI_FOUNDATION.map((name) => ({
              name: '@nuxt/ui',
              importNames: [name],
              message: BANNED_MESSAGE,
            })),
          ],
          patterns: [
            {
              group: ['@nuxt/ui/*'],
              message: 'Do not import from @nuxt/ui subpaths. Use @app/ui instead.',
            },
          ],
        },
      ],
      // CLAUDE.md: Nuxt UI foundation primitives are banned from template usage.
      // In Nuxt 4, these are auto-imported — the import rule catches explicit imports,
      // but the component name rule catches auto-imported template usage.
      'vue/no-restricted-component-names': [
        'error',
        ...BANNED_NUXT_UI_FOUNDATION.map((name) => ({ name, message: BANNED_MESSAGE })),
      ],
    },
  },
];
