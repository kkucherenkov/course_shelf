import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppNoteEditor from './AppNoteEditor.vue';
import type { NoteSyncState } from './AppNoteEditor.vue';

const meta: Meta<typeof AppNoteEditor> = {
  title: 'Domain/AppNoteEditor',
  component: AppNoteEditor,
  argTypes: {
    syncState: {
      control: 'select',
      options: ['syncing', 'saved', 'failed', 'offline'],
    },
    mode: { control: 'inline-radio', options: ['edit', 'view'] },
  },
  render: (args) => ({
    components: { AppNoteEditor },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 560px; padding: var(--space-4);"><AppNoteEditor v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppNoteEditor>;

const sampleMd = [
  '# Quorum reads',
  '',
  'With **N=5, R=3, W=3** we satisfy R+W>N so reads see the latest write.',
  '',
  'Caveats:',
  '- Linearizable only with a leader.',
  '- Otherwise *stale-within-session* is still possible.',
  '',
  'See [Designing Data-Intensive Applications](https://dataintensive.net) chapter 9.',
].join('\n');

export const Default: Story = {
  args: { modelValue: sampleMd, syncState: 'saved', savedAt: Date.now() - 4000 },
};

export const Empty: Story = { args: { modelValue: '' } };

export const Preview: Story = {
  args: { modelValue: sampleMd, mode: 'view', syncState: 'saved' },
};

export const Syncing: Story = {
  args: { modelValue: sampleMd, syncState: 'syncing' },
};

export const Failed: Story = {
  args: { modelValue: sampleMd, syncState: 'failed' },
};

export const Offline: Story = {
  args: { modelValue: sampleMd, syncState: 'offline' },
};

export const Interactive: Story = {
  render: () => ({
    components: { AppNoteEditor },
    setup() {
      const text = ref(sampleMd);
      const mode = ref<'edit' | 'view'>('edit');
      const syncState = ref<NoteSyncState>('saved');
      const savedAt = ref<number | undefined>(Date.now() - 4000);
      const lastEvent = ref('—');

      return {
        text,
        mode,
        syncState,
        savedAt,
        lastEvent,
        onSave: (value: string) => {
          syncState.value = 'syncing';
          lastEvent.value = `save (${String(value.length)} chars)`;
          setTimeout(() => {
            syncState.value = 'saved';
            savedAt.value = Date.now();
          }, 500);
        },
        onRetry: () => {
          syncState.value = 'syncing';
          lastEvent.value = 'retry';
          setTimeout(() => {
            syncState.value = 'saved';
            savedAt.value = Date.now();
          }, 500);
        },
      };
    },
    template: `
      <div style="max-width: 560px; padding: var(--space-4);">
        <AppNoteEditor
          v-model="text"
          v-model:mode="mode"
          :sync-state="syncState"
          :saved-at="savedAt"
          @save="onSave"
          @retry="onRetry"
        />
        <p style="margin-top: var(--space-3); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">
          mode: <strong>{{ mode }}</strong>
          · sync: <strong>{{ syncState }}</strong>
          · last event: <strong>{{ lastEvent }}</strong>
        </p>
      </div>
    `,
  }),
};
