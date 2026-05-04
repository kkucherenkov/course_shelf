import AppAvatar from './AppAvatar.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta: Meta<typeof AppAvatar> = {
  title: 'Primitives/AppAvatar',
  component: AppAvatar,
  tags: ['autodocs'],
  args: {
    name: 'John Doe',
    size: 'md',
    role: undefined,
    image: undefined,
    initials: undefined,
  },
  argTypes: {
    image: { control: 'text' },
    initials: { control: 'text' },
    name: { control: 'text' },
    size: { control: 'select', options: SIZES },
    role: { control: 'select', options: [undefined, 'admin', 'guest'] },
  },
};

export default meta;

type Story = StoryObj<typeof AppAvatar>;

export const Default: Story = {};

// Deterministic inline data URL — visual regression snapshots compare
// byte-for-byte, and an external CDN like i.pravatar.cc returns slightly
// different bytes between requests (CDN cache, recompression) which
// flakes the AppAvatar/WithImage smoke test on every CI run.
const SAMPLE_AVATAR_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/>` +
      `</linearGradient></defs>` +
      `<rect width="150" height="150" fill="url(#g)"/>` +
      `<circle cx="75" cy="58" r="24" fill="rgba(255,255,255,0.85)"/>` +
      `<path d="M30 130 Q75 80 120 130 Z" fill="rgba(255,255,255,0.85)"/>` +
      `</svg>`,
  );

export const WithImage: Story = {
  args: {
    image: SAMPLE_AVATAR_SVG,
    name: 'Jane Smith',
  },
};

export const InitialsFallback: Story = {
  args: {
    name: 'Mary Jane Watson',
  },
};

export const ExplicitInitials: Story = {
  args: {
    initials: 'ZZ',
  },
};

export const AllSizes: Story = {
  render: (args) => ({
    components: { AppAvatar },
    setup: () => ({ args, sizes: SIZES }),
    template: `
      <div style="display: flex; gap: var(--space-4); align-items: center;">
        <AppAvatar v-for="s in sizes" :key="s" v-bind="args" :size="s" />
      </div>
    `,
  }),
};

export const WithRoleBadge: Story = {
  render: (args) => ({
    components: { AppAvatar },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; gap: var(--space-5); align-items: center;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
          <AppAvatar v-bind="args" role="admin" size="lg" />
          <span style="font-size: var(--text-sm); color: var(--text-secondary);">Admin</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
          <AppAvatar v-bind="args" role="guest" size="lg" />
          <span style="font-size: var(--text-sm); color: var(--text-secondary);">Guest</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
          <AppAvatar v-bind="args" size="lg" />
          <span style="font-size: var(--text-sm); color: var(--text-secondary);">No role</span>
        </div>
      </div>
    `,
  }),
};
