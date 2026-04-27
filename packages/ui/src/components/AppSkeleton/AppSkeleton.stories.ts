import AppSkeleton from './AppSkeleton.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppSkeleton> = {
  title: 'Primitives/AppSkeleton',
  component: AppSkeleton,
  tags: ['autodocs'],
  args: {
    width: '200px',
    height: '1em',
    radius: 'sm',
  },
};

export default meta;

type Story = StoryObj<typeof AppSkeleton>;

export const Default: Story = {};

export const CardPlaceholder: Story = {
  render: () => ({
    components: { AppSkeleton },
    template: `
      <div style="max-width:320px;display:flex;flex-direction:column;gap:var(--space-3);padding:var(--space-4);">
        <div style="display:flex;gap:var(--space-3);align-items:center;">
          <AppSkeleton width="40px" height="40px" radius="md" />
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-2);">
            <AppSkeleton width="60%" height="14px" />
            <AppSkeleton width="40%" height="12px" />
          </div>
        </div>
        <AppSkeleton width="100%" height="80px" radius="md" />
        <AppSkeleton width="80%" height="12px" />
        <AppSkeleton width="65%" height="12px" />
      </div>
    `,
  }),
};

export const AllRadii: Story = {
  render: () => ({
    components: { AppSkeleton },
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);max-width:200px;">
        <div style="display:flex;flex-direction:column;gap:var(--space-1);">
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">radius sm</span>
          <AppSkeleton width="100%" height="16px" radius="sm" />
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-1);">
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">radius md</span>
          <AppSkeleton width="100%" height="16px" radius="md" />
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-1);">
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">radius pill</span>
          <AppSkeleton width="100%" height="16px" radius="pill" />
        </div>
      </div>
    `,
  }),
};
