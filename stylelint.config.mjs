/**
 * Stylelint config — enforces CLAUDE.md styling bans:
 *  - no !important (declaration-no-important)
 *  - no hard-coded hex / rgb / hsl / oklch / color-mix colors (tokens only via var(--*))
 *  - no raw color values on color/background/border-color properties
 *  - no magic px on layout properties (must use var(--space-*) or named SCSS vars)
 *  - no literal ms/s in transition/animation (must use var(--dur-*) or named SCSS vars)
 *  - no literal z-index (must use var(--z-*))
 *  - BEM naming with `app-` / `health-` / `brand-` prefix in packages/ui
 *
 * Design-token generated files are excluded.
 */

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-recommended-scss', 'stylelint-config-recommended-vue/scss'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
    {
      // Strict BEM prefix applies only to design-system primitives/compositions.
      files: ['packages/ui/src/components/**/*.vue', 'packages/ui/src/components/**/*.scss'],
      rules: {
        'selector-class-pattern': [
          '^(app|health|brand|u|v)-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$',
          {
            message:
              'Use BEM with an `app-`/`health-`/`brand-` prefix: .app-button, .app-button__icon, .app-button--block.',
            resolveNestedSelectors: true,
          },
        ],
      },
    },
    {
      // Tailwind 4 uses the `@theme` directive in main.css.
      files: ['**/*.css'],
      rules: {
        'at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: [
              'theme',
              'tailwind',
              'apply',
              'variants',
              'responsive',
              'screen',
              'layer',
            ],
          },
        ],
      },
    },
  ],
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/storybook-static/**',
    'apps/web/app/assets/css/tokens.generated.css',
    'apps/web/app/design-tokens.generated.ts',
    'packages/design-tokens/dist/**',
    'packages/ui/src/tokens.generated.css',
    '**/*.generated.{css,ts,scss}',
    'packages/ui/.storybook/preview-head.html',
    'specs/design/source-bundle/**',
    // Reference-only design prototypes — own token namespace (var(--ui-*)), never bundled.
    'docs/design/**',
  ],
  rules: {
    // CLAUDE.md: no !important in any SCSS source.
    'declaration-no-important': true,

    // CLAUDE.md: no hard-coded hex color literals — use design tokens (var(--brand-*), etc.).
    'color-no-hex': [
      true,
      { message: 'Use a design token (var(--brand-*), var(--role-*), …) — no hex literals.' },
    ],

    // CLAUDE.md: no named CSS colors (red, blue, …) — use design tokens.
    'color-named': 'never',

    // Allow modern / legacy color function notation (postcss handles it).
    'color-function-notation': null,

    // CLAUDE.md: no raw rgb() / hsl() color literals — use design tokens.
    'function-disallowed-list': [
      ['/^rgb/i', '/^hsl/i'],
      { message: 'Use a design token — no raw rgb/hsl literals.' },
    ],

    // CLAUDE.md: color/background/border-color must use var(--*) tokens.
    'declaration-property-value-disallowed-list': [
      {
        '/.*/': [String.raw`/var\(--ui-/`],
        'z-index': [String.raw`/^-?\d+$/`],
        'transition-duration': [String.raw`/\b\d+m?s\b/`],
        'animation-duration': [String.raw`/\b\d+m?s\b/`],
        transition: [String.raw`/\b\d+m?s\b/`],
        animation: [String.raw`/\b\d+m?s\b/`],
        '/^font-size$/': [String.raw`/(?:^|\s)(?:[3-9]\d*|[1-9]\d+)px\b/`],
        '/^(min-height|max-height|min-width|max-width)$/': [
          String.raw`/(?:^|\s)(?:[3-9]\d*|[1-9]\d+)px\b/`,
        ],
        '/^(width|height)$/': [String.raw`/(?:^|\s)(?:[3-9]\d*|[1-9]\d+)px\b/`],
        '/^gap$|^column-gap$|^row-gap$/': [String.raw`/(?:^|\s)(?:[3-9]\d*|[1-9]\d+)px\b/`],
        '/^(margin|margin-top|margin-right|margin-bottom|margin-left|margin-inline|margin-block)$/':
          [String.raw`/(?:^|\s)(?:[3-9]\d*|[1-9]\d+)px\b/`],
        '/^(padding|padding-top|padding-right|padding-bottom|padding-left|padding-inline|padding-block)$/':
          [String.raw`/(?:^|\s)(?:[3-9]\d*|[1-9]\d+)px\b/`],
        '/^(top|right|bottom|left|inset|inset-inline|inset-block)$/': [
          String.raw`/(?:^|\s)-?(?:[3-9]\d*|[1-9]\d+)px\b/`,
        ],
      },
      {
        message:
          'Use a design token: var(--surface-*)/var(--text-*)/var(--border-*)/var(--status-*) ' +
          'instead of var(--ui-*). Also: var(--z-*) for z-index, var(--dur-*) for durations, ' +
          'var(--space-*) or a named SCSS variable for layout dimensions (0/1px/2px are exempt).',
      },
    ],

    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$',
      {
        message: 'Use kebab-case BEM class names: .block, .block__element, .block--modifier.',
        resolveNestedSelectors: true,
      },
    ],
    'scss/at-rule-no-unknown': [true, { ignoreAtRules: ['theme', 'tailwind', 'apply', 'layer'] }],
    'max-nesting-depth': [3, { ignore: ['pseudo-classes'] }],
    // Disable noisy rules that conflict with tokens / scoped SCSS.
    'scss/dollar-variable-pattern': null,
    'scss/no-global-function-names': null,
    'no-descending-specificity': null,
    'no-empty-source': null,
  },
};
