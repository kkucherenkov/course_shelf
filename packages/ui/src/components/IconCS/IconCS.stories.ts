import type { Meta, StoryObj } from '@storybook/vue3';

import { IconCS } from './';

const ALL_NAMES = [
  'play',
  'pause',
  'next',
  'prev',
  'home',
  'library',
  'search',
  'settings',
  'check',
  'check-circle',
  'circle',
  'lock',
  'download',
  'cloud',
  'cloud-down',
  'bookmark',
  'note',
  'pdf',
  'folder',
  'user',
  'users',
  'plus',
  'minus',
  'x',
  'chevron-right',
  'chevron-left',
  'chevron-down',
  'chevron-up',
  'arrow-right',
  'sun',
  'moon',
  'volume',
  'volume-mute',
  'subtitles',
  'fullscreen',
  'pip',
  'speed',
  'list',
  'grid',
  'filter',
  'sort',
  'eye',
  'eye-off',
  'mail',
  'key',
  'shield',
  'alert',
  'info',
  'wifi-off',
  'refresh',
  'edit',
  'trash',
  'copy',
  'logout',
  'menu',
  'more',
  'clock',
  'calendar',
  'at',
  'sliders',
  'arrow-left',
  'more-h',
  'corner-down-right',
  'hard-drive',
  'github',
  'banner',
] as const;

const meta: Meta<typeof IconCS> = {
  component: IconCS,
  title: '@app/ui/IconCS',
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: { type: 'select' },
      options: [...ALL_NAMES],
    },
    size: { control: { type: 'number' } },
    fill: { control: { type: 'boolean' } },
    title: { control: { type: 'text' } },
  },
};

export default meta;

type Story = StoryObj<typeof IconCS>;

export const Default: Story = {
  args: { name: 'play', size: 32 },
};

export const Grid: Story = {
  render: () => ({
    components: { IconCS },
    setup() {
      const names = [...ALL_NAMES];
      return { names };
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 24px; padding: 16px;">
        <div
          v-for="n in names"
          :key="n"
          style="display: flex; flex-direction: column; align-items: center; gap: 8px;"
        >
          <IconCS :name="n" :size="32" />
          <code style="font-size: 11px;">{{ n }}</code>
        </div>
      </div>
    `,
  }),
};
