import type { Meta, StoryObj } from '@storybook/vue3';

import AppSsoBlock from './AppSsoBlock.vue';
import type { SsoProvider } from './AppSsoBlock.vue';

const meta: Meta<typeof AppSsoBlock> = {
  title: 'Domain/AppSsoBlock',
  component: AppSsoBlock,
  render: (args) => ({
    components: { AppSsoBlock },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 360px; padding: 16px;"><AppSsoBlock v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppSsoBlock>;

const google: SsoProvider = { id: 'google', label: 'Continue with Google', iconName: 'mail' };
const github: SsoProvider = { id: 'github', label: 'Continue with GitHub', iconName: 'github' };
const sso: SsoProvider = { id: 'sso', label: 'Single sign-on', iconName: 'key' };

export const Default: Story = { args: { providers: [google, github, sso] } };

export const GoogleOnly: Story = { args: { providers: [google] } };

export const GitHubOnly: Story = { args: { providers: [github] } };

export const SsoOnly: Story = { args: { providers: [sso] } };

export const Empty: Story = { args: { providers: [] } };
