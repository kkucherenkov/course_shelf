<script setup lang="ts">
  import { IconCS } from '@app/ui';
  import type { IconName } from '@app/ui';
  import type { CourseMaterialItem } from '@app/api-client-ts';

  defineProps<{
    materials: CourseMaterialItem[];
    heading: string;
    emptyLabel: string;
    /** Toast message emitted when user tries to download. */
    downloadSoonLabel: string;
  }>();

  const emit = defineEmits<{
    downloadAttempt: [materialId: string];
  }>();

  function kindIcon(kind: CourseMaterialItem['kind']): IconName {
    if (kind === 'doc') return 'pdf';
    if (kind === 'note') return 'note';
    if (kind === 'image') return 'folder';
    // slide and fallback
    return 'cloud';
  }

  function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${String(bytes)} B`;
    if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} KB`;
    return `${String(Math.round(bytes / (1024 * 1024)))} MB`;
  }
</script>

<template>
  <aside class="course-materials-rail">
    <h2 class="course-materials-rail__heading">{{ heading }}</h2>

    <p v-if="materials.length === 0" class="course-materials-rail__empty">
      {{ emptyLabel }}
    </p>

    <ul v-else class="course-materials-rail__list">
      <li v-for="item in materials" :key="item.id" class="course-materials-rail__item">
        <IconCS
          :name="kindIcon(item.kind)"
          :size="18"
          class="course-materials-rail__item-icon"
          aria-hidden="true"
        />
        <div class="course-materials-rail__item-info">
          <span class="course-materials-rail__item-label">{{ item.label }}</span>
          <span class="course-materials-rail__item-size">{{ fmtSize(item.sizeBytes) }}</span>
        </div>
        <button
          type="button"
          class="course-materials-rail__item-download"
          :aria-label="downloadSoonLabel"
          @click="emit('downloadAttempt', item.id)"
        >
          <IconCS name="download" :size="16" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </aside>
</template>

<style scoped lang="scss">
  // Named SCSS variable — exempt from raw-px lint rule.
  $download-btn-size: 28px;

  .course-materials-rail {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__heading {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__empty {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    &__item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-2);
      border-radius: var(--radius-md);
      transition: background var(--dur-fast);

      &:hover {
        background: var(--surface-raised);
      }
    }

    &__item-icon {
      flex-shrink: 0;
      color: var(--text-secondary);
    }

    &__item-info {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__item-label {
      font-size: var(--text-sm);
      color: var(--text-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__item-size {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    &__item-download {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: $download-btn-size;
      height: $download-btn-size;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition:
        color var(--dur-fast),
        background var(--dur-fast);

      &:hover {
        color: var(--text-fg);
        background: var(--surface-overlay);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 1px;
      }
    }
  }
</style>
