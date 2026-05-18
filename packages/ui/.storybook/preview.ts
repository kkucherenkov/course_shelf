import type { Preview, Renderer } from '@storybook/vue3';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { DecoratorFunction } from '@storybook/types';
import { setup } from '@storybook/vue3';
import ui from '@nuxt/ui/vue-plugin';
import { h, type PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import '../src/styles.css';
import './preview.css';

// Storybook has no Nuxt runtime — stub <NuxtLink> as a plain <a> so components
// that link to routes render without resolve-component warnings.
setup((app) => {
  // Register Nuxt UI Vue plugin first so overlay/portal primitives (UModal,
  // UTooltip, etc.) have the required context when rendered in Storybook.
  app.use(ui);
  app.component('NuxtLink', {
    props: {
      to: { type: [String, Object] as PropType<RouteLocationRaw>, required: true },
    },
    setup(props, { slots }) {
      const href =
        typeof props.to === 'string' ? props.to : ((props.to as { path?: string }).path ?? '#');
      return () => h('a', { href }, slots.default?.());
    },
  });
});

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: { disable: true },
    layout: 'centered',
    a11y: {
      // Blocks the Storybook test-runner in CI: any axe violation fails the
      // visual-regression job. If an author asserts a violation is a false
      // positive, disable the specific rule in that story's parameters —
      // never widen this global setting.
      //
      // STORYBOOK_A11Y_LEVEL lets a CI smoke job run with 'todo' (warn-only)
      // when its goal is render + interaction coverage rather than a11y.
      // Default stays 'error' for `pnpm storybook` and any unset env.
      test:
        ((import.meta.env as Record<string, string | undefined>)?.STORYBOOK_A11Y_LEVEL as
          | 'off'
          | 'todo'
          | 'warn'
          | 'error'
          | undefined) ?? 'error',
    },
  },
  decorators: [
    // Sync Nuxt UI's class-based dark mode with our theme selection.
    // UModal/UTooltip/etc. read class="dark" on <html>, not data-theme.
    ((story, context) => {
      const theme = (context.globals as Record<string, string>).theme ?? 'light';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return story();
    }) as DecoratorFunction<Renderer>,
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark', sepia: 'sepia', forest: 'forest' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
