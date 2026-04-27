import { ref } from 'vue';
import AppCommandPalette from './AppCommandPalette.vue';

import type { Meta, StoryObj } from '@storybook/vue3';
import type { Command } from './AppCommandPalette.vue';

const DEMO_COMMANDS: Command[] = [
  {
    id: 'home',
    label: 'Go home',
    description: 'Navigate to main page',
    icon: 'home',
    group: 'Navigation',
  },
  {
    id: 'library',
    label: 'My library',
    description: 'Browse your courses',
    icon: 'library',
    group: 'Navigation',
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Find anything',
    icon: 'search',
    group: 'Navigation',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configure preferences',
    icon: 'settings',
    group: 'Account',
  },
  { id: 'logout', label: 'Sign out', icon: 'logout', group: 'Account' },
  { id: 'download', label: 'Download offline', icon: 'download' },
  { id: 'bookmark', label: 'Bookmarks', icon: 'bookmark' },
];

const meta: Meta<typeof AppCommandPalette> = {
  title: 'Primitives/AppCommandPalette',
  component: AppCommandPalette,
  tags: ['autodocs'],
  args: {
    open: false,
    commands: DEMO_COMMANDS,
    placeholder: 'Type a command…',
    title: 'Command palette',
  },
  argTypes: {
    open: { control: 'boolean' },
    placeholder: { control: 'text' },
    title: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof AppCommandPalette>;

export const Default: Story = {
  render: (args) => ({
    components: { AppCommandPalette },
    setup() {
      const open = ref(false);
      const lastSelected = ref<Command | null>(null);

      function onSelect(cmd: Command) {
        lastSelected.value = cmd;
      }

      return { args, open, lastSelected, onSelect };
    },
    template: `
      <div>
        <div style="display:flex; gap: 12px; align-items: center; margin-bottom: 16px;">
          <button
            @click="open = true"
            style="padding: 8px 16px; background: var(--brand-accent); color: white; border: none; border-radius: 8px; cursor: pointer;"
          >
            Open palette (or Cmd+K)
          </button>
          <span v-if="lastSelected" style="font-size: 13px; color: var(--text-secondary);">
            Selected: <strong>{{ lastSelected.label }}</strong>
          </span>
        </div>
        <AppCommandPalette
          v-bind="args"
          :open="open"
          @update:open="open = $event"
          @select="onSelect"
        />
      </div>
    `,
  }),
};

export const WithGlobalShortcut: Story = {
  render: (args) => ({
    components: { AppCommandPalette },
    setup() {
      const open = ref(false);

      function onKeydown(e: KeyboardEvent) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          open.value = true;
        }
      }

      return { args, open, onKeydown };
    },
    template: `
      <div @keydown="onKeydown" tabindex="0" style="padding: 16px; border: 1px dashed var(--border-default); border-radius: 8px; outline: none;">
        <p style="color: var(--text-secondary); font-size: 13px;">
          Click here to focus, then press <kbd style="padding: 2px 6px; background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 4px; font-size: 12px;">Cmd+K</kbd> or <kbd style="padding: 2px 6px; background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 4px; font-size: 12px;">Ctrl+K</kbd>
        </p>
        <AppCommandPalette
          v-bind="args"
          :open="open"
          @update:open="open = $event"
        />
      </div>
    `,
  }),
};
