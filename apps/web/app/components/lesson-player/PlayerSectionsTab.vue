<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { AppSectionHeader, AppLessonRow } from '@app/ui';
  import { useSectionHeaderLabels } from '~/composables/useSectionHeaderLabels';
  import type { SectionOutline } from '@app/api-client-ts';

  const props = defineProps<{
    sections: SectionOutline[];
    courseId: string;
    currentLessonId: string;
  }>();

  const { t } = useI18n();
  const { sectionLabel, formatLessons, formatDuration } = useSectionHeaderLabels();

  function formatWatched(percent: number): string {
    return t('ui.lessonRow.watched', { n: percent });
  }

  // Track collapsed state per section id
  const openSections = ref<Record<string, boolean>>({});

  function isOpen(sectionId: string): boolean {
    return openSections.value[sectionId] !== false;
  }

  function toggleSection(sectionId: string): void {
    openSections.value = {
      ...openSections.value,
      [sectionId]: !isOpen(sectionId),
    };
  }
</script>

<template>
  <div class="player-sections-tab">
    <div v-for="section in props.sections" :key="section.id" class="player-sections-tab__section">
      <AppSectionHeader
        :idx="section.position"
        :title="section.title"
        :count="section.lessons.length"
        :duration="section.totalDurationSeconds"
        :open="isOpen(section.id)"
        :section-label="sectionLabel"
        :format-lessons="formatLessons"
        :format-duration="formatDuration"
        @toggle="toggleSection(section.id)"
      />
      <div v-show="isOpen(section.id)" class="player-sections-tab__lessons">
        <NuxtLink
          v-for="lesson in section.lessons"
          :key="lesson.id"
          :to="`/courses/${props.courseId}/lessons/${lesson.id}`"
          class="player-sections-tab__lesson-link"
        >
          <AppLessonRow
            :loading-label="t('ui.lessonRow.loading')"
            :materials-label="t('ui.lessonRow.materials')"
            :format-watched="formatWatched"
            :num="lesson.position"
            :title="lesson.title"
            :duration="lesson.durationSeconds"
            :state="lesson.state"
            :materials="lesson.hasMaterials"
            :current="lesson.id === props.currentLessonId"
            :progress="lesson.progressPercent"
          />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .player-sections-tab {
    display: flex;
    flex-direction: column;

    &__section {
      display: flex;
      flex-direction: column;
    }

    &__lessons {
      display: flex;
      flex-direction: column;
    }

    &__lesson-link {
      text-decoration: none;
      color: inherit;
      display: block;
    }
  }
</style>
