import AppCard from './AppCard.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

function logInteractiveClick(): void {
  // eslint-disable-next-line no-console -- Storybook-only demo handler.
  console.info('AppCard clicked');
}

const meta: Meta<typeof AppCard> = {
  title: 'Primitives/AppCard',
  component: AppCard,
  tags: ['autodocs'],
  args: {
    title: 'System health',
    description: 'Realtime dependency status',
  },
  render: (args) => ({
    components: { AppCard },
    setup() {
      return { args };
    },
    template: `
      <AppCard v-bind="args">
        <p>Ready to ship.</p>
      </AppCard>
    `,
  }),
};

export default meta;

type Story = StoryObj<typeof AppCard>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
    title: 'Upcoming booking',
    description: 'Tap to view the full appointment',
  },
  render: (args) => ({
    components: { AppCard },
    setup() {
      return { args, onClick: logInteractiveClick };
    },
    template: `
      <AppCard v-bind="args" @click="onClick">
        <p>This whole card is a button — try Tab, then Enter / Space.</p>
      </AppCard>
    `,
  }),
};

// Renders two cards side by side to demonstrate the hover/focus affordance —
// visual reviewers hover one and tab to the other to check the ring.
export const InteractiveHover: Story = {
  args: {
    interactive: true,
  },
  render: (args) => ({
    components: { AppCard },
    setup() {
      return { args };
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-8); max-width: 640px;">
        <AppCard v-bind="args" title="Hover me" description="A subtle elevation should appear on hover.">
          <p>The cursor becomes a pointer and the shadow lifts.</p>
        </AppCard>
        <AppCard v-bind="args" title="Focus me" description="Tab through to see the focus ring.">
          <p>The ring uses <code>--shadow-focus</code>, not an outline hack.</p>
        </AppCard>
      </div>
    `,
  }),
};

export const Large: Story = {
  args: {
    size: 'lg',
    title: 'Large card',
    description: '24px padding, --radius-lg corner.',
  },
  render: (args) => ({
    components: { AppCard },
    setup() {
      return { args };
    },
    template: `
      <AppCard v-bind="args">
        <p>Same content surface, more breathing room — matches the bundle's <code>.card-lg</code>.</p>
      </AppCard>
    `,
  }),
};

export const Hoverable: Story = {
  args: {
    hoverable: true,
    title: 'Hoverable',
    description: 'Visual lift on hover — not focusable, no click emit.',
  },
  render: (args) => ({
    components: { AppCard },
    setup() {
      return { args };
    },
    template: `
      <AppCard v-bind="args">
        <p>Hover me. Border darkens, background shifts to <code>--surface-raised</code>.</p>
      </AppCard>
    `,
  }),
};
