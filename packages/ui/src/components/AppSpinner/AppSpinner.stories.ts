import AppSpinner from './AppSpinner.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppSpinner> = {
  title: 'Primitives/AppSpinner',
  component: AppSpinner,
  tags: ['autodocs'],
  args: {
    size: 'md',
    label: 'Loading',
  },
};

export default meta;

type Story = StoryObj<typeof AppSpinner>;

export const Default: Story = {};

export const AllSizes: Story = {
  render: () => ({
    components: { AppSpinner },
    template: `
      <div style="display:flex;align-items:center;gap:var(--space-5);">
        <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppSpinner size="sm" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">sm 12px</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppSpinner size="md" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">md 16px</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppSpinner size="lg" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">lg 24px</span>
        </div>
      </div>
    `,
  }),
};

export const InheritColor: Story = {
  render: () => ({
    components: { AppSpinner },
    template: `
      <div style="display:flex;align-items:center;gap:var(--space-5);">
        <AppSpinner size="md" style="color:var(--brand-accent);" />
        <AppSpinner size="md" style="color:var(--status-error-fg);" />
        <AppSpinner size="md" style="color:var(--status-success-fg);" />
      </div>
    `,
  }),
};
