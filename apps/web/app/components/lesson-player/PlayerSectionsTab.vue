<script setup lang="ts">
  import { ref } from 'vue';
  import { AppSectionHeader, AppLessonRow } from '@app/ui';
  import type { SectionOutline } from '@app/api-client-ts';

  const props = defineProps<{
    sections: SectionOutline[];
    courseId: string;
    currentLessonId: string;
  }>();

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
