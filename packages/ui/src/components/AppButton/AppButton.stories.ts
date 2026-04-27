import AppButton from './AppButton.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppButton> = {
  title: 'Primitives/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  args: { label: 'Submit', variant: 'primary', size: 'md' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    block: { control: 'boolean' },
    iconLeading: {
      control: 'text',
      description: 'IconName rendered via IconCS, aligned left of the label.',
    },
    iconTrailing: {
      control: 'text',
      description: 'IconName rendered via IconCS, aligned right of the label.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppButton>;

export const Default: Story = {
  args: { label: 'Button' },
};

export const Disabled: Story = {
  args: { label: 'Disabled', disabled: true },
};

export const Loading: Story = {
  args: { label: 'Loading…', loading: true },
};

export const Focus: Story = {
  args: { label: 'Focused' },
  parameters: {
    pseudo: { focus: true, focusVisible: true },
    docs: {
      description: {
        story: 'Focus-visible ring rendered via `:focus-visible` — 2px brand-accent outline.',
      },
    },
  },
};

export const WithLeadingIcon: Story = {
  args: { iconLeading: 'check', label: 'Confirm' },
};

export const WithTrailingIcon: Story = {
  args: { iconTrailing: 'arrow-right', label: 'Next' },
};

/**
 * 4 variants × 3 sizes = 12 cells.
 * Hover and active states are exercised by the user interacting with the
 * rendered cells — they rely on native CSS pseudo-classes.
 */
export const VariantsMatrix: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="display:flex; flex-direction:column; gap: 16px;">
        <template v-for="variant in ['primary','secondary','ghost','destructive']" :key="variant">
          <div style="display:flex; gap: 12px; align-items:center;">
            <AppButton :label="variant" :variant="variant" size="sm" />
            <AppButton :label="variant" :variant="variant" size="md" />
            <AppButton :label="variant" :variant="variant" size="lg" />
          </div>
        </template>
      </div>
    `,
  }),
};
