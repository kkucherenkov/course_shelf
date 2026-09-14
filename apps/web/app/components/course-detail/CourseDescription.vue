<script setup lang="ts">
  defineProps<{
    /** Full course description — up to CourseDto.description's wire cap. */
    description: string;
    heading: string;
  }>();
</script>

<template>
  <section class="course-description">
    <h2 class="course-description__heading">{{ heading }}</h2>
    <p class="course-description__body">{{ description }}</p>
  </section>
</template>

<style scoped lang="scss">
  .course-description {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__heading {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__body {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      line-height: 1.6;
      // Newlines are the only structure a scraped description carries —
      // no markdown renderer/sanitiser for third-party HTML (see PR). This
      // is what turns 29 "what you'll learn" bullets back into a list
      // instead of one unbroken block.
      white-space: pre-line;
    }
  }
</style>
