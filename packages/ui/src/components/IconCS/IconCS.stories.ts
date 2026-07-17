import type { Meta, StoryObj } from '@storybook/vue3';

import { IconCS } from './';

const ALL_NAMES = [
  'play',
  'pause',
  'next',
  'prev',
  'home',
  'home-fill',
  'library',
  'library-fill',
  'search',
  'search-fill',
  'settings',
  'settings-fill',
  'check',
  'check-circle',
  'circle',
  'lock',
  'download',
  'download-fill',
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

/// The bottom-tab bar swaps the active tab's outline for its filled
/// counterpart. Each pair must read as the same icon — the tab bar cross-fades
/// between them, so a shape or weight jump looks like a bug.
export const NavTabFills: Story = {
  render: () => ({
    components: { IconCS },
    setup() {
      const pairs = [
        ['home', 'home-fill'],
        ['library', 'library-fill'],
        ['download', 'download-fill'],
        ['search', 'search-fill'],
        ['settings', 'settings-fill'],
      ] as const;
      return { pairs };
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-5); padding: var(--space-4);">
        <div
          v-for="[outline, filled] in pairs"
          :key="outline"
          style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);"
        >
          <div style="display: flex; gap: var(--space-3); align-items: center;">
            <IconCS :name="outline" :size="32" />
            <IconCS :name="filled" :size="32" />
          </div>
          <code style="font-size: var(--text-xs);">{{ outline }}</code>
        </div>
      </div>
    `,
  }),
};

export const Grid: Story = {
  render: () => ({
    components: { IconCS },
    setup() {
      const names = [...ALL_NAMES];
      return { names };
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: var(--space-5); padding: var(--space-4);">
        <div
          v-for="n in names"
          :key="n"
          style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);"
        >
          <IconCS :name="n" :size="32" />
          <code style="font-size: var(--text-xs);">{{ n }}</code>
        </div>
      </div>
    `,
  }),
};
