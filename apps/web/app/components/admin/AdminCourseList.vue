<script setup lang="ts">
  import { AppSkeleton, IconCS } from '@app/ui';

  /**
   * A course's admin entry point (#510). Reaching a single course was
   * impossible from the admin section — this lists every course in a
   * library and links each row straight into the existing `courses/:id`
   * page, which already carries the per-course Rescan / Resync /
   * Transcribe actions. No operational actions live here; this is a
   * directory, not a duplicate of the course page.
   */

  export interface AdminCourseListItem {
    id: string;
    title: string;
    /** Pre-translated, e.g. "12 lessons" — pluralisation is the caller's job. */
    /** Omitted when the true lesson count is unknown — see the caller (#808). */
    lessonsLabel?: string;
  }

  interface Props {
    items: AdminCourseListItem[];
    loading: boolean;
    emptyLabel: string;
  }

  defineProps<Props>();
</script>

<template>
  <!-- Skeleton -->
  <div v-if="loading" class="adm-course-list__skeleton-wrap">
    <div v-for="i in 3" :key="i" class="adm-course-list__skel-row">
      <AppSkeleton width="220px" height="14px" />
      <AppSkeleton width="64px" height="14px" />
    </div>
  </div>

  <!-- Empty -->
  <p v-else-if="items.length === 0" class="adm-course-list__empty">
    {{ emptyLabel }}
  </p>

  <!-- List -->
  <ul v-else class="adm-course-list">
    <li v-for="item in items" :key="item.id" class="adm-course-list__item">
      <NuxtLink :to="`/courses/${item.id}`" class="adm-course-list__link">
        <span class="adm-course-list__title">{{ item.title }}</span>
        <span v-if="item.lessonsLabel" class="adm-course-list__lessons">{{
          item.lessonsLabel
        }}</span>
        <IconCS name="chevron-right" :size="14" class="adm-course-list__chevron" />
      </NuxtLink>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
  $chevron-size: 14px;

  .adm-course-list {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;

    &__skeleton-wrap {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: var(--space-4);
    }

    &__skel-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-2) 0;

      & + & {
        border-top: 1px solid var(--border-default);
      }
    }

    &__empty {
      margin: 0;
      padding: var(--space-4);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
    }

    &__item {
      border-bottom: 1px solid var(--border-default);

      &:last-child {
        border-bottom: 0;
      }
    }

    &__link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      color: inherit;
      text-decoration: none;

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    &__title {
      flex: 1;
      min-width: 0;
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-loud);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__lessons {
      flex-shrink: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    &__chevron {
      flex-shrink: 0;
      width: $chevron-size;
      height: $chevron-size;
      color: var(--text-secondary);
    }
  }
</style>
