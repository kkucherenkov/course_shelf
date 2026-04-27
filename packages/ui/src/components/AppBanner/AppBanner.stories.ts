import type { Meta, StoryObj } from '@storybook/vue3';

import AppBanner from './AppBanner.vue';

const VARIANTS = ['info', 'success', 'warning', 'error'] as const;

const meta: Meta<typeof AppBanner> = {
  title: 'Feedback/AppBanner',
  component: AppBanner,
  tags: ['autodocs'],
  args: {
    body: 'This is a notification message.',
    variant: 'info',
    dismissible: false,
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    title: { control: 'text' },
    body: { control: 'text' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof AppBanner>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => ({
    components: { AppBanner },
    setup: () => ({ args, variants: VARIANTS }),
    template: `
      <div style="display:flex; flex-direction:column; gap:var(--space-3);">
        <AppBanner
          v-for="v in variants"
          :key="v"
          v-bind="args"
          :variant="v"
          :body="v + ' — ' + args.body"
        />
      </div>
    `,
  }),
};

export const WithTitle: Story = {
  args: {
    variant: 'warning',
    title: 'Action required',
    body: 'Please verify your email address before continuing.',
  },
};

export const WithTitleAndSlot: Story = {
  render: (args) => ({
    components: { AppBanner },
    setup: () => ({ args }),
    template: `
      <AppBanner v-bind="args" variant="info" title="Slot example">
        Body content from the <strong>default slot</strong> — wins over the body prop.
      </AppBanner>
    `,
  }),
};

export const Dismissible: Story = {
  args: {
    variant: 'success',
    title: 'Upload complete',
    body: 'Your file has been uploaded successfully.',
    dismissible: true,
  },
};

export const DismissibleAllVariants: Story = {
  render: (args) => ({
    components: { AppBanner },
    setup: () => ({ args, variants: VARIANTS }),
    template: `
      <div style="display:flex; flex-direction:column; gap:var(--space-3);">
        <AppBanner
          v-for="v in variants"
          :key="v"
          v-bind="args"
          :variant="v"
          :body="v + ' — dismissible'"
          :dismissible="true"
        />
      </div>
    `,
  }),
};
