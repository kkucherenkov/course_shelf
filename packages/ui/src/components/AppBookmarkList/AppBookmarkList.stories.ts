import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppBookmarkList from './AppBookmarkList.vue';
import type { BookmarkEntry } from './AppBookmarkList.vue';

const meta: Meta<typeof AppBookmarkList> = {
  title: 'Domain/AppBookmarkList',
  component: AppBookmarkList,
  render: (args) => ({
    components: { AppBookmarkList },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 480px; padding: var(--space-4);"><AppBookmarkList v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppBookmarkList>;

const sample: BookmarkEntry[] = [
  { id: 'a', time: 42, label: 'Definition of consensus' },
  { id: 'b', time: 305, label: 'Quorum reads worked example' },
  { id: 'c', time: 612, label: 'Diagram redraw' },
  { id: 'd', time: 930 },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export const Default: Story = { args: { bookmarks: sample } };

export const Empty: Story = { args: { bookmarks: [] } };

export const ReadOnly: Story = { args: { bookmarks: sample, editable: false } };

export const WithAddRow: Story = { args: { bookmarks: sample, addTime: 1024 } };

export const EmptyWithAddRow: Story = { args: { bookmarks: [], addTime: 90 } };

export const Adding: Story = {
  args: { bookmarks: sample, addTime: 1024, adding: true },
};

export const Interactive: Story = {
  render: () => ({
    components: { AppBookmarkList },
    setup() {
      const items = ref<BookmarkEntry[]>([
        { id: '1', time: 90, label: 'Setup explanation' },
        { id: '2', time: 305, label: 'Diagram' },
      ]);
      const addTime = ref(425);
      const adding = ref(false);
      const lastEvent = ref('—');

      return {
        items,
        addTime,
        adding,
        lastEvent,
        onSelect: (id: string) => {
          lastEvent.value = `select(${id})`;
        },
        onEdit: (id: string) => {
          lastEvent.value = `edit(${id})`;
        },
        onDelete: (id: string) => {
          items.value = items.value.filter((b) => b.id !== id);
          lastEvent.value = `delete(${id})`;
        },
        onAddSave: (payload: { time: number; label: string }) => {
          adding.value = true;
          setTimeout(() => {
            items.value = [
              ...items.value,
              { id: uid(), time: payload.time, label: payload.label || undefined },
            ];
            adding.value = false;
            lastEvent.value = `addSave(${payload.time}, "${payload.label}")`;
          }, 250);
        },
        onAddCancel: () => {
          lastEvent.value = 'addCancel';
        },
      };
    },
    template: `
      <div style="max-width: 480px; padding: var(--space-4);">
        <AppBookmarkList
          :bookmarks="items"
          :add-time="addTime"
          :adding="adding"
          @select="onSelect"
          @edit="onEdit"
          @delete="onDelete"
          @add-save="onAddSave"
          @add-cancel="onAddCancel"
        />
        <p style="margin-top: var(--space-3); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">
          Last event: <strong>{{ lastEvent }}</strong>
        </p>
      </div>
    `,
  }),
};
