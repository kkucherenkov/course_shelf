<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { AppNoteEditor } from '@app/ui';
  import { getNote, upsertNote } from '@app/api-client-ts';
  import type { NoteDto } from '@app/api-client-ts';

  type SyncState = 'syncing' | 'saved' | 'failed' | 'offline';

  const props = defineProps<{
    lessonId: string;
  }>();

  const noteBody = ref('');
  const noteMode = ref<'edit' | 'view'>('edit');
  const syncState = ref<SyncState>('saved');
  const savedAt = ref<number | undefined>(undefined);

  // Load note on mount / lesson change
  watch(
    () => props.lessonId,
    async (id) => {
      if (!id) return;
      noteBody.value = '';
      syncState.value = 'saved';
      const res = await getNote({ path: { lessonId: id } });
      if (!res.error) {
        noteBody.value = (res.data as NoteDto).body;
        savedAt.value = Date.now();
      } else {
        // 404 = no note yet — treat as empty
        noteBody.value = '';
      }
    },
    { immediate: true },
  );

  async function onSave(value: string): Promise<void> {
    syncState.value = 'syncing';
    const res = await upsertNote({
      body: { lessonId: props.lessonId, body: value },
    });
    if (res.error) {
      syncState.value = 'failed';
    } else {
      syncState.value = 'saved';
      savedAt.value = Date.now();
    }
  }

  function onRetry(): void {
    void onSave(noteBody.value);
  }
</script>

<template>
  <div class="player-notes-tab">
    <AppNoteEditor
      :model-value="noteBody"
      :mode="noteMode"
      :sync-state="syncState"
      :saved-at="savedAt"
      @update:model-value="noteBody = $event"
      @update:mode="noteMode = $event"
      @save="onSave"
      @retry="onRetry"
    />
  </div>
</template>

<style scoped lang="scss">
  .player-notes-tab {
    padding: var(--space-3);
  }
</style>
