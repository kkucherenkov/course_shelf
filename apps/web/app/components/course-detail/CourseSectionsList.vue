<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { AppSectionHeader, AppLessonRow } from '@app/ui';
  import { useSectionHeaderLabels } from '~/composables/useSectionHeaderLabels';
  import { usePreferencesStore, effectiveLessonState } from '~/stores/preferences';
  import type { SectionOutline, LessonOutlineItem } from '@app/api-client-ts';

  const props = defineProps<{
    sections: SectionOutline[];
    /** The lesson id considered "current" (highlighted in the row). */
    currentLessonId: string | null;
    /** Course the sections belong to — builds each lesson row's route (#780). */
    courseId: string;
  }>();

  const { t } = useI18n();
  const { sectionLabel, formatLessons, formatDuration } = useSectionHeaderLabels();
  const preferencesStore = usePreferencesStore();

  // Same threshold override PlayerSectionsTab.vue applies in the player
  // sidebar (#565) — kept in sync so the two lesson-badge displays never
  // disagree with each other (#596). Course-level aggregates (`courseState`
  // on the page, "Your week") stay on the server's own state on purpose:
  // this threshold is a display nicety for a single row, not a second source
  // of truth for whether the course is done.
  function displayState(lesson: LessonOutlineItem): LessonOutlineItem['state'] {
    return effectiveLessonState(lesson, preferencesStore.completionThreshold);
  }

  function formatWatched(percent: number): string {
    return t('ui.lessonRow.watched', { n: percent });
  }

  // Track open/closed state per section — all open by default.
  const openSections = ref<Set<string>>(new Set(props.sections.map((s) => s.id)));

  function toggleSection(id: string): void {
    if (openSections.value.has(id)) {
      openSections.value.delete(id);
    } else {
      openSections.value.add(id);
    }
  }

  function isOpen(id: string): boolean {
    return openSections.value.has(id);
  }
</script>

<template>
  <div class="course-sections-list">
    <div v-for="section in sections" :key="section.id" class="course-sections-list__section">
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
      <div v-if="isOpen(section.id)" class="course-sections-list__lessons">
        <AppLessonRow
          v-for="lesson in section.lessons"
          :key="lesson.id"
          :loading-label="t('ui.lessonRow.loading')"
          :materials-label="t('ui.lessonRow.materials')"
          :transcript-label="t('ui.lessonRow.transcript')"
          :format-watched="formatWatched"
          :num="lesson.position"
          :title="lesson.title"
          :duration="lesson.durationSeconds"
          :state="displayState(lesson)"
          :materials="lesson.hasMaterials"
          :transcript="lesson.hasTranscript"
          :current="lesson.id === currentLessonId"
          :progress="lesson.progressPercent"
          :to="`/courses/${courseId}/lessons/${lesson.id}`"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .course-sections-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    &__section {
      display: flex;
      flex-direction: column;
    }

    &__lessons {
      display: flex;
      flex-direction: column;
      padding: var(--space-1) 0;
    }
  }
</style>
