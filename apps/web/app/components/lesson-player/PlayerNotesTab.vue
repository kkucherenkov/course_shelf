<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { AppNoteEditor } from '@app/ui';
  import { getNote, upsertNote } from '@app/api-client-ts';
  import type { NoteDto } from '@app/api-client-ts';

  type SyncState = 'syncing' | 'saved' | 'failed' | 'offline';

  const props = defineProps<{
    lessonId: string;
  }>();

  const { t } = useI18n();

  // `@app/ui` ships English defaults and never calls `t()` itself — it has no
  // locale — so every string it renders is handed to it here.
  function formatSavedAt(at: Date | number): string {
    const ms = typeof at === 'number' ? Date.now() - at : Date.now() - at.getTime();
    const seconds = Math.max(0, Math.floor(ms / 1000));
    if (seconds < 5) return t('ui.noteEditor.agoJustNow');
    if (seconds < 60) return t('ui.noteEditor.agoSeconds', { n: seconds });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('ui.noteEditor.agoMinutes', { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('ui.noteEditor.agoHours', { n: hours });
    return t('ui.noteEditor.agoDays', { n: Math.floor(hours / 24) });
  }

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
      :syncing-label="t('ui.noteEditor.syncing')"
      :saved-label="t('ui.noteEditor.saved')"
      :failed-label="t('ui.noteEditor.failed')"
      :offline-label="t('ui.noteEditor.offline')"
      :toolbar-label="t('ui.noteEditor.toolbar')"
      :bold-label="t('ui.noteEditor.bold')"
      :italic-label="t('ui.noteEditor.italic')"
      :heading-label="t('ui.noteEditor.heading')"
      :list-label="t('ui.noteEditor.list')"
      :link-label="t('ui.noteEditor.link')"
      :preview-label="t('ui.noteEditor.preview')"
      :edit-label="t('ui.noteEditor.edit')"
      :textarea-label="t('ui.noteEditor.textarea')"
      :retry-label="t('ui.noteEditor.retry')"
      :placeholder="t('ui.noteEditor.placeholder')"
      :format-saved-at="formatSavedAt"
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
