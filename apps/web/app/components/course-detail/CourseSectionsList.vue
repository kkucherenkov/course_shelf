<script setup lang="ts">
  import { ref } from 'vue';
  import { AppSectionHeader, AppLessonRow } from '@app/ui';
  import type { SectionOutline } from '@app/api-client-ts';

  const props = defineProps<{
    sections: SectionOutline[];
    /** The lesson id considered "current" (highlighted in the row). */
    currentLessonId: string | null;
    /** Called when user clicks a lesson row — emits the lesson id. */
  }>();

  const emit = defineEmits<{
    selectLesson: [lessonId: string];
  }>();

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
        @toggle="toggleSection(section.id)"
      />
      <div v-if="isOpen(section.id)" class="course-sections-list__lessons">
        <AppLessonRow
          v-for="lesson in section.lessons"
          :key="lesson.id"
          :num="lesson.position"
          :title="lesson.title"
          :duration="lesson.durationSeconds"
          :state="lesson.state"
          :materials="lesson.hasMaterials"
          :current="lesson.id === currentLessonId"
          :progress="lesson.progressPercent"
          @select="emit('selectLesson', lesson.id)"
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
