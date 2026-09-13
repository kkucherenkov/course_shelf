<script setup lang="ts">
  import { AppRow, IconCS } from '@app/ui';
  import type { SearchTranscriptHitDto } from '@app/api-client-ts';

  import { highlight } from '~/utils/highlight';
  import { formatCueTime } from '~/utils/format-time';

  const props = defineProps<{
    hits: SearchTranscriptHitDto[];
    /** Raw search query, used to highlight the matched substring in cue text. */
    query: string;
    /** Translated group heading, e.g. "Transcripts". */
    title: string;
  }>();

  function hitHref(hit: SearchTranscriptHitDto): string {
    return `/courses/${hit.courseId}/lessons/${hit.lessonId}?t=${String(hit.startMs / 1000)}`;
  }
</script>

<template>
  <section v-if="props.hits.length > 0" class="search-transcript-group">
    <div class="search-transcript-group__header">
      <h2 class="search-transcript-group__title">{{ props.title }}</h2>
      <span class="search-transcript-group__count">{{ props.hits.length }}</span>
    </div>
    <ul class="search-transcript-group__list" role="list">
      <li
        v-for="(hit, idx) in props.hits"
        :key="`${hit.lessonId}-${hit.startMs}-${idx}`"
        class="search-transcript-group__list-item"
      >
        <NuxtLink :to="hitHref(hit)" class="search-transcript-group__link">
          <AppRow>
            <template #leading>
              <span class="search-transcript-group__icon" aria-hidden="true">
                <IconCS name="subtitles" :size="16" />
              </span>
            </template>
            <p class="search-transcript-group__breadcrumb">
              {{ hit.courseTitle }}
              <span aria-hidden="true"> · </span>
              {{ hit.sectionTitle }}
            </p>
            <p class="search-transcript-group__text">
              <template v-for="(seg, segIdx) in highlight(hit.text, props.query)" :key="segIdx">
                <mark v-if="seg.match" class="search-transcript-group__highlight">{{
                  seg.text
                }}</mark>
                <span v-else>{{ seg.text }}</span>
              </template>
            </p>
            <template #trailing>{{ formatCueTime(hit.startMs / 1000) }}</template>
          </AppRow>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
  .search-transcript-group {
    margin-bottom: var(--space-8);

    &__header {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    &__title {
      margin: 0;
      font-size: var(--text-xs);
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    &__count {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__list-item {
      display: contents;
    }

    &__link {
      display: block;
      text-decoration: none;
      color: inherit;
      border-radius: var(--radius-md);
      transition: background var(--dur-fast) var(--ease-default);

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    // Circular icon badge — deliberately distinct from the solid-fill initials
    // thumbnail the course/lesson groups use, so a transcript row reads as a
    // spoken line rather than another catalogue entry.
    &__icon {
      width: var(--space-7);
      height: var(--space-7);
      border-radius: var(--radius-pill);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      background: var(--brand-accent-soft);
      color: var(--brand-accent);
    }

    &__breadcrumb {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__text {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      font-style: italic;
      color: var(--text-fg);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__highlight {
      background: color-mix(in oklch, var(--brand-accent) 20%, transparent);
      color: var(--brand-accent);
      padding: 0 2px;
      border-radius: 2px;
      font-weight: var(--fw-semibold);
      font-style: normal;
    }
  }
</style>
