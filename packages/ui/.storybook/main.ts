import uiPlugin from '@nuxt/ui/vite';

import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: [
    '../src/foundations/**/*.stories.@(ts|mdx)',
    '../src/components/**/*.stories.@(ts|mdx)',
  ],
  // `@storybook/addon-mcp` serves an MCP endpoint at /mcp off the dev server,
  // so an agent can query this design system before writing a component of its
  // own. It is the reason the Storybook toolchain sits at ^10.6.0: the addon
  // ships no build below that. Harmless in a static build — the endpoint only
  // exists while `storybook dev` is running.
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes', '@storybook/addon-mcp'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  typescript: {
    check: false,
  },
  viteFinal: async (viteConfig) => {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(uiPlugin());
    return viteConfig;
  },
};

export default config;
