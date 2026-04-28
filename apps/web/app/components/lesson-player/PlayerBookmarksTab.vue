<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { AppBookmarkList } from '@app/ui';
  import type { BookmarkEntry } from '@app/ui';
  import { createBookmark, deleteBookmark } from '@app/api-client-ts';
  import type { BookmarkDto } from '@app/api-client-ts';

  const props = defineProps<{
    lessonId: string;
    bookmarks: BookmarkDto[];
    /** Current playhead position in seconds */
    currentTime: number;
    emptyTitle: string;
    emptyBody: string;
  }>();

  const emit = defineEmits<{
    seek: [time: number];
    'update:bookmarks': [bookmarks: BookmarkDto[]];
  }>();

  const adding = ref(false);
  const showAddRow = ref(false);

  const bookmarkEntries = computed<BookmarkEntry[]>(() =>
    props.bookmarks.map((b) => ({
      id: b.id,
      time: b.positionSeconds,
      label: b.label,
    })),
  );

  function onSelect(id: string): void {
    const bm = props.bookmarks.find((b) => b.id === id);
    if (bm) emit('seek', bm.positionSeconds);
  }

  async function onAddSave(payload: { time: number; label: string }): Promise<void> {
    adding.value = true;
    try {
      const res = await createBookmark({
        body: {
          // The HTML5 video element gives us a sub-second float, but the spec
          // declares positionSeconds as an integer. Floor here to match
          // useProgressReporter and avoid a 400 from openapi-validator.
          positionSeconds: Math.floor(payload.time),
          label: payload.label || undefined,
        },
        path: { lessonId: props.lessonId },
      });
      if (!res.error) {
        emit('update:bookmarks', [...props.bookmarks, res.data as BookmarkDto]);
      }
      showAddRow.value = false;
    } finally {
      adding.value = false;
    }
  }

  function onAddCancel(): void {
    showAddRow.value = false;
  }

  async function onDelete(id: string): Promise<void> {
    try {
      await deleteBookmark({ path: { id } });
      emit(
        'update:bookmarks',
        props.bookmarks.filter((b) => b.id !== id),
      );
    } catch {
      // best-effort
    }
  }
</script>

<template>
  <div class="player-bookmarks-tab">
    <AppBookmarkList
      :bookmarks="bookmarkEntries"
      :add-time="showAddRow ? props.currentTime : undefined"
      :adding="adding"
      :empty-title="props.emptyTitle"
      :empty-body="props.emptyBody"
      @select="onSelect"
      @add-save="onAddSave"
      @add-cancel="onAddCancel"
      @delete="onDelete"
    />
    <button
      v-if="!showAddRow"
      type="button"
      class="player-bookmarks-tab__add-btn"
      @click="showAddRow = true"
    >
      + Bookmark current position
    </button>
  </div>
</template>

<style scoped lang="scss">
  .player-bookmarks-tab {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__add-btn {
      align-self: flex-start;
      appearance: none;
      border: 1px dashed var(--border-default);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-secondary);
      font-size: var(--text-sm);
      padding: var(--space-2) var(--space-3);
      cursor: pointer;
      transition:
        border-color var(--dur-fast),
        color var(--dur-fast);

      &:hover {
        border-color: var(--brand-accent);
        color: var(--brand-accent);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }
  }
</style>
