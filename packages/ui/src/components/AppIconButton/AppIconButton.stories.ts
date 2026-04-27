import AppIconButton from './AppIconButton.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppIconButton> = {
  title: 'Primitives/AppIconButton',
  component: AppIconButton,
  tags: ['autodocs'],
  args: { name: 'settings', ariaLabel: 'Open settings', variant: 'primary', size: 'md' },
  argTypes: {
    name: { control: 'text' },
    ariaLabel: { control: 'text' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof AppIconButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
  parameters: {
    docs: {
      description: {
        story: 'Icon is hidden; CSS ::after pseudo-element renders the spinner.',
      },
    },
  },
};

export const Focus: Story = {
  parameters: {
    pseudo: { focus: true, focusVisible: true },
    docs: {
      description: {
        story: 'Focus-visible ring: 2px brand-accent outline with 2px offset.',
      },
    },
  },
};

export const Destructive: Story = {
  args: { name: 'trash', ariaLabel: 'Delete', variant: 'destructive' },
};

export const Ghost: Story = {
  args: { name: 'more', ariaLabel: 'More options', variant: 'ghost' },
};

/**
 * 4 variants × 3 sizes = 12 cells.
 */
export const VariantsMatrix: Story = {
  render: () => ({
    components: { AppIconButton },
    template: `
      <div style="display:flex; flex-direction:column; gap: var(--space-4);">
        <template v-for="variant in ['primary','secondary','ghost','destructive']" :key="variant">
          <div style="display:flex; gap: var(--space-3); align-items:center;">
            <AppIconButton name="settings" :aria-label="variant + ' sm'" :variant="variant" size="sm" />
            <AppIconButton name="settings" :aria-label="variant + ' md'" :variant="variant" size="md" />
            <AppIconButton name="settings" :aria-label="variant + ' lg'" :variant="variant" size="lg" />
          </div>
        </template>
      </div>
    `,
  }),
};
