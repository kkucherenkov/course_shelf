<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { AppButton } from '@app/ui';

  const props = defineProps<{
    /** Full course description — up to CourseDto.description's wire cap. */
    description: string;
    heading: string;
  }>();

  const { t } = useI18n();

  const bodyRef = ref<HTMLParagraphElement | null>(null);
  const expanded = ref(false);
  const isTruncated = ref(false);

  // Only re-measure while collapsed — an expanded paragraph naturally has no
  // clamp to overflow, and re-checking then would fight the user's own
  // "show more" click on the next resize (e.g. toggling a sidebar).
  function checkTruncation(): void {
    if (expanded.value) return;
    const el = bodyRef.value;
    isTruncated.value = !!el && el.scrollHeight > el.clientHeight + 1;
  }

  let resizeObserver: ResizeObserver | undefined;

  onMounted(() => {
    checkTruncation();
    // jsdom (unit tests) has no ResizeObserver — real browsers all do.
    if (typeof ResizeObserver === 'undefined') return;
    resizeObserver = new ResizeObserver(() => {
      checkTruncation();
    });
    if (bodyRef.value) resizeObserver.observe(bodyRef.value);
  });

  onBeforeUnmount(() => resizeObserver?.disconnect());

  // A new description (navigating between courses without remounting)
  // starts collapsed again rather than carrying over the previous course's
  // expanded state. flush: 'post' so the DOM already reflects the new text
  // when checkTruncation reads scrollHeight — the default 'pre' timing runs
  // before that render and would measure the outgoing paragraph.
  watch(
    () => props.description,
    () => {
      expanded.value = false;
      checkTruncation();
    },
    { flush: 'post' },
  );
</script>

<template>
  <section class="course-description">
    <h2 class="course-description__heading">{{ heading }}</h2>
    <p
      ref="bodyRef"
      class="course-description__body"
      :class="{ 'course-description__body--clamped': !expanded }"
    >
      {{ description }}
    </p>
    <AppButton
      v-if="isTruncated"
      variant="ghost"
      size="sm"
      class="course-description__toggle"
      @click="expanded = !expanded"
    >
      {{
        expanded
          ? t('pages.courseDetail.descriptionShowLess')
          : t('pages.courseDetail.descriptionShowMore')
      }}
    </AppButton>
  </section>
</template>

<style scoped lang="scss">
  .course-description {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    align-items: flex-start;

    &__heading {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__body {
      margin: 0;
      max-width: 70ch;
      font-size: var(--text-base);
      color: var(--text-secondary);
      line-height: var(--leading-relaxed);
      // Newlines are the only structure a scraped description carries —
      // no markdown renderer/sanitiser for third-party HTML (see PR). This
      // is what turns 29 "what you'll learn" bullets back into a list
      // instead of one unbroken block.
      white-space: pre-line;

      &--clamped {
        display: -webkit-box;
        -webkit-line-clamp: 6;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    // AppButton is inline-flex; align-items: flex-start on the section
    // above keeps it from stretching to the column's full width.
  }
</style>
