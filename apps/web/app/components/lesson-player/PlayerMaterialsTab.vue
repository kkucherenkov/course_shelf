<script setup lang="ts">
  import type { MaterialDto } from '@app/api-client-ts';

  const props = defineProps<{
    materials: MaterialDto[];
    emptyLabel: string;
  }>();

  const emit = defineEmits<{
    downloadAttempt: [material: MaterialDto];
  }>();

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${String(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<template>
  <div class="player-materials-tab">
    <div v-if="props.materials.length === 0" class="player-materials-tab__empty">
      {{ props.emptyLabel }}
    </div>
    <ul v-else class="player-materials-tab__list">
      <li v-for="material in props.materials" :key="material.id" class="player-materials-tab__item">
        <button
          type="button"
          class="player-materials-tab__btn"
          @click="emit('downloadAttempt', material)"
        >
          <span class="player-materials-tab__kind" :data-kind="material.kind">
            {{ material.kind.toUpperCase() }}
          </span>
          <span class="player-materials-tab__label">{{ material.label }}</span>
          <span class="player-materials-tab__size">{{ formatSize(material.sizeBytes) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
  .player-materials-tab {
    padding: var(--space-3);

    &__empty {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      padding: var(--space-4) 0;
      text-align: center;
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
      display: block;
    }

    &__btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid var(--border-default);
      cursor: pointer;
      text-align: left;
      transition: background var(--dur-fast);

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__kind {
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      background: var(--surface-raised);
      border-radius: var(--radius-sm);
      padding: 2px var(--space-2);

      &[data-kind='doc'] {
        color: var(--status-error-fg);
      }

      &[data-kind='note'] {
        color: var(--text-secondary);
      }

      &[data-kind='image'] {
        color: var(--status-info-fg);
      }
    }

    &__label {
      flex: 1 1 auto;
      min-width: 0;
      font-size: var(--text-sm);
      color: var(--text-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__size {
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }
  }
</style>
