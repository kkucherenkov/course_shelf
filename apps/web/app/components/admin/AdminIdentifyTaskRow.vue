<script setup lang="ts">
  import { computed } from 'vue';
  import { AppBadge, IconCS } from '@app/ui';
  import type { IdentifyTaskDto, IdentifyTaskStatus } from '@app/api-client-ts';

  interface Props {
    task: IdentifyTaskDto;
    labelProposed: string;
    labelApplied: string;
    labelDiscarded: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    /** Emitted when the row is clicked (navigate to the review page). */
    click: [];
  }>();

  const { t } = useI18n();

  type BadgeColor = 'warning' | 'success' | 'neutral';

  const statusBadge = computed<{ label: string; color: BadgeColor }>(() => {
    const map: Record<IdentifyTaskStatus, { label: string; color: BadgeColor }> = {
      proposed: { label: props.labelProposed, color: 'warning' },
      applied: { label: props.labelApplied, color: 'success' },
      discarded: { label: props.labelDiscarded, color: 'neutral' },
    };
    return map[props.task.status];
  });

  function formatRelative(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return t('pages.admin.identifyTasks.timeAgoSeconds', { n: diffSec });
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t('pages.admin.identifyTasks.timeAgoMinutes', { n: diffMin });
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return t('pages.admin.identifyTasks.timeAgoHours', { n: diffH });
    const diffD = Math.floor(diffH / 24);
    return t('pages.admin.identifyTasks.timeAgoDays', { n: diffD });
  }
</script>

<template>
  <div
    class="adm-identify-row"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <AppBadge
      class="adm-identify-row__badge"
      :label="statusBadge.label"
      :color="statusBadge.color"
      size="sm"
    />

    <div class="adm-identify-row__main">
      <div class="adm-identify-row__title">{{ props.task.courseTitle }}</div>
      <div class="adm-identify-row__meta">
        <span>{{ props.task.source }}</span>
        <span class="adm-identify-row__sep">·</span>
        <span>{{ formatRelative(props.task.createdAt) }}</span>
      </div>
    </div>

    <IconCS name="chevron-right" class="adm-identify-row__chevron" />
  </div>
</template>

<style lang="scss" scoped>
  $chevron-size: 14px;

  .adm-identify-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    background: var(--surface-surface);
    margin-bottom: var(--space-2);
    cursor: pointer;

    &:hover {
      border-color: var(--border-strong);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: 2px;
    }

    &__badge {
      flex-shrink: 0;
    }

    &__main {
      min-width: 0;
      flex: 1;
    }

    &__title {
      font-weight: 500;
      color: var(--text-loud);
      font-size: var(--text-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__meta {
      display: flex;
      gap: var(--space-2);
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
    }

    &__sep {
      color: var(--text-subtle);
    }

    &__chevron {
      width: $chevron-size;
      height: $chevron-size;
      color: var(--text-muted);
      flex-shrink: 0;
    }
  }
</style>
