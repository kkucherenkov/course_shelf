<script setup lang="ts">
  import { ref } from 'vue';
  import { AppTabs, AppTab } from '@app/ui';
  import type { SectionOutline, BookmarkDto, MaterialDto } from '@app/api-client-ts';

  import PlayerSectionsTab from './PlayerSectionsTab.vue';
  import PlayerNotesTab from './PlayerNotesTab.vue';
  import PlayerBookmarksTab from './PlayerBookmarksTab.vue';
  import PlayerMaterialsTab from './PlayerMaterialsTab.vue';

  const props = defineProps<{
    sections: SectionOutline[];
    courseId: string;
    currentLessonId: string;
    bookmarks: BookmarkDto[];
    materials: MaterialDto[];
    currentTime: number;

    // i18n strings
    tabSections: string;
    tabNotes: string;
    tabBookmarks: string;
    tabMaterials: string;
    bookmarksEmptyTitle: string;
    bookmarksEmptyBody: string;
    bookmarksAddLabel: string;
    materialsEmptyLabel: string;
  }>();

  const emit = defineEmits<{
    seek: [time: number];
    'update:bookmarks': [bookmarks: BookmarkDto[]];
    downloadAttempt: [material: MaterialDto];
  }>();

  const activeTab = ref<'sections' | 'notes' | 'bookmarks' | 'materials'>('sections');
</script>

<template>
  <aside class="player-sidebar">
    <AppTabs v-model="activeTab" :label="props.tabSections" class="player-sidebar__tabs">
      <AppTab value="sections" :label="props.tabSections" />
      <AppTab value="notes" :label="props.tabNotes" />
      <AppTab value="bookmarks" :label="props.tabBookmarks" />
      <AppTab value="materials" :label="props.tabMaterials" />
    </AppTabs>

    <div class="player-sidebar__body">
      <PlayerSectionsTab
        v-if="activeTab === 'sections'"
        :sections="props.sections"
        :course-id="props.courseId"
        :current-lesson-id="props.currentLessonId"
      />
      <PlayerNotesTab v-else-if="activeTab === 'notes'" :lesson-id="props.currentLessonId" />
      <PlayerBookmarksTab
        v-else-if="activeTab === 'bookmarks'"
        :lesson-id="props.currentLessonId"
        :bookmarks="props.bookmarks"
        :current-time="props.currentTime"
        :empty-title="props.bookmarksEmptyTitle"
        :empty-body="props.bookmarksEmptyBody"
        :add-label="props.bookmarksAddLabel"
        @seek="(t) => emit('seek', t)"
        @update:bookmarks="(b) => emit('update:bookmarks', b)"
      />
      <PlayerMaterialsTab
        v-else-if="activeTab === 'materials'"
        :materials="props.materials"
        :empty-label="props.materialsEmptyLabel"
        @download-attempt="(m) => emit('downloadAttempt', m)"
      />
    </div>
  </aside>
</template>

<style scoped lang="scss">
  .player-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--surface-surface);
    border-left: 1px solid var(--border-default);
    overflow: hidden;

    &__tabs {
      flex-shrink: 0;
      // Tabs row wraps on narrow screens
      overflow-x: auto;
      flex-wrap: nowrap;
      white-space: nowrap;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    &__body {
      flex: 1;
      overflow-y: auto;
    }
  }
</style>
