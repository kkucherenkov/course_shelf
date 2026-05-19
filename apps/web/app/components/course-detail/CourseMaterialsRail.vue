<script setup lang="ts">
  import { computed } from 'vue';
  import { IconCS } from '@app/ui';
  import type { IconName } from '@app/ui';
  import type { CourseMaterialItem } from '@app/api-client-ts';

  const props = defineProps<{
    materials: CourseMaterialItem[];
    heading: string;
    emptyLabel: string;
    /** aria-label for the download button. */
    downloadAriaLabel: string;
  }>();

  const emit = defineEmits<{
    downloadAttempt: [material: CourseMaterialItem];
  }>();

  // The backend now sorts the flat materials list by
  // (section.position, lesson.position, material.id) and decorates each
  // item with sectionId + sectionTitle. Group consecutive items by
  // sectionId to render a small caption above each cluster — preserves
  // the input order, no resort.
  interface MaterialGroup {
    sectionId: string;
    sectionTitle: string;
    items: CourseMaterialItem[];
  }

  const groups = computed<MaterialGroup[]>(() => {
    const out: MaterialGroup[] = [];
    for (const item of props.materials) {
      const last = out.at(-1);
      // Explicit `last !== undefined` guard: `last?.sectionId === item.sectionId`
      // wrongly evaluates `undefined === undefined` to true on the first
      // iteration (or whenever `item.sectionId` is missing), which then
      // crashes on `last.items.push` with `last` still undefined.
      if (last !== undefined && last.sectionId === item.sectionId) {
        last.items.push(item);
      } else {
        out.push({
          sectionId: item.sectionId,
          sectionTitle: item.sectionTitle,
          items: [item],
        });
      }
    }
    return out;
  });

  // Single-section courses skip the grouping caption — the list visual is
  // already obvious without the extra hierarchy. Only show captions when
  // there are 2+ distinct sections in the rail.
  const showCaptions = computed(() => groups.value.length > 1);

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

    <div v-else class="course-materials-rail__groups">
      <section v-for="group in groups" :key="group.sectionId" class="course-materials-rail__group">
        <p
          v-if="showCaptions"
          class="course-materials-rail__caption"
          :aria-label="group.sectionTitle"
        >
          {{ group.sectionTitle }}
        </p>
        <ul class="course-materials-rail__list">
          <li v-for="item in group.items" :key="item.id" class="course-materials-rail__item">
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
              :aria-label="downloadAriaLabel"
              @click="emit('downloadAttempt', item)"
            >
              <IconCS name="download" :size="16" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>
    </div>
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

    &__groups {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    &__group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    &__caption {
      margin: 0;
      padding: 0 var(--space-2);
      font-size: var(--text-xs);
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
