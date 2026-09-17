// `Decorator` rather than `DecoratorFunction<Renderer>` from '@storybook/types':
// that package does not exist in Storybook 10, and '@storybook/vue3' declares
// `Renderer` without exporting it. `Decorator` is the framework-specific type
// this file wanted all along, and taking it means the decorator below needs no
// cast and `context.globals` arrives typed.
import type { Decorator, Preview } from '@storybook/vue3';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { setup } from '@storybook/vue3';
import ui from '@nuxt/ui/vue-plugin';
import { defineComponent, h, type PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import '../src/styles.css';
import './preview.css';

// Storybook has no Nuxt runtime — stub <NuxtLink> as a plain <a> so components
// that link to routes render without resolve-component warnings.
setup((app) => {
  // Register Nuxt UI Vue plugin first so overlay/portal primitives (UModal,
  // UTooltip, etc.) have the required context when rendered in Storybook.
  // The plugin takes no options — `primary` is resolved from `app.config.ts`
  // by Nuxt's build, which Storybook does not run. `preview.css` maps
  // `--ui-primary` onto the brand accent instead.
  app.use(ui);
  app.component(
    'NuxtLink',
    // Wrapped in `defineComponent` so `props` and `slots` are inferred. A bare
    // object literal here left both implicitly `any`, which went unnoticed
    // while `.storybook/**` sat outside this package's tsconfig include.
    defineComponent({
      props: {
        to: { type: [String, Object] as PropType<RouteLocationRaw>, required: true },
      },
      setup(props, { slots }) {
        const href =
          typeof props.to === 'string' ? props.to : ((props.to as { path?: string }).path ?? '#');
        // Bracket form for the same TS4111 reason as `globals` below: the
        // slots object is an index signature, so dot access is an error.
        return () => h('a', { href }, slots['default']?.());
      },
    }),
  );
});

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: { disable: true },
    layout: 'centered',
    a11y: {
      // Blocks the Storybook test-runner in CI: any axe violation fails the
      // visual-regression job. If an author asserts a violation is a false
      // positive, disable the specific rule in that story's parameters, with
      // the reason — never widen this global setting.
      //
      // Not configurable by environment. This read `STORYBOOK_A11Y_LEVEL` and
      // both CI workflows set it to 'todo', which downgraded every violation
      // to a note; 75 stories were failing behind the switch. A gate with a
      // documented way to turn it off is how that happens, so the switch is
      // gone rather than merely unset.
      test: 'error',
    },
  },
  decorators: [
    // Sync Nuxt UI's class-based dark mode with our theme selection.
    // UModal/UTooltip/etc. read class="dark" on <html>, not data-theme.
    ((story, context) => {
      // `globals` is an index-signature type, so the key has to be read in
      // bracket form — TS4111. Not a style choice: dot access is an error here.
      const theme = context.globals['theme'] ?? 'light';
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return story();
    }) satisfies Decorator,
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark', sepia: 'sepia', forest: 'forest' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
