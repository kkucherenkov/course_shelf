<script setup lang="ts">
  import AppBookmark from '../AppBookmark/AppBookmark.vue';
  import AppBookmarkAdd from '../AppBookmarkAdd/AppBookmarkAdd.vue';
  import AppEmptyState from '../AppEmptyState/AppEmptyState.vue';

  export interface BookmarkEntry {
    id: string;
    time: number;
    label?: string;
  }

  withDefaults(
    defineProps<{
      bookmarks: BookmarkEntry[];
      /** Current playhead — when defined, an inline add row appears on top. */
      addTime?: number;
      /** Disables row actions when false. */
      editable?: boolean;
      /** Forwarded to `AppBookmarkAdd` while a save is in flight. */
      adding?: boolean;
      /** Empty-state title — pure cosmetic override. */
      emptyTitle?: string;
      /** Empty-state body. */
      emptyBody?: string;
    }>(),
    {
      addTime: undefined,
      editable: true,
      adding: false,
      emptyTitle: 'No bookmarks yet',
      emptyBody: 'Add a bookmark from the player to mark a moment for later.',
    },
  );

  const emit = defineEmits<{
    select: [id: string];
    edit: [id: string];
    delete: [id: string];
    addSave: [payload: { time: number; label: string }];
    addCancel: [];
  }>();
</script>

<template>
  <div class="app-bookmark-list">
    <AppBookmarkAdd
      v-if="addTime !== undefined"
      :time="addTime"
      :submitting="adding"
      @save="(p) => emit('addSave', p)"
      @cancel="emit('addCancel')"
    />

    <template v-if="bookmarks.length > 0">
      <AppBookmark
        v-for="b in bookmarks"
        :key="b.id"
        :time="b.time"
        :label="b.label"
        :editable="editable"
        @select="emit('select', b.id)"
        @edit="emit('edit', b.id)"
        @delete="emit('delete', b.id)"
      />
    </template>

    <AppEmptyState
      v-else-if="addTime === undefined"
      icon="bookmark"
      :title="emptyTitle"
      :body="emptyBody"
    />
  </div>
</template>

<style scoped lang="scss">
  .app-bookmark-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
</style>
