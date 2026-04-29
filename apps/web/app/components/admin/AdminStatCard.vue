<script setup lang="ts">
  interface Props {
    icon: string;
    label: string;
    value: string;
    meta?: string;
    error?: boolean;
    loading?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    meta: undefined,
    error: false,
    loading: false,
  });
</script>

<template>
  <div
    class="admin-stat-card"
    :class="{
      'admin-stat-card--error': props.error,
      'admin-stat-card--loading': props.loading,
    }"
  >
    <div v-if="props.loading" class="admin-stat-card__skeleton">
      <div class="admin-stat-card__skel-header" />
      <div class="admin-stat-card__skel-value" />
      <div class="admin-stat-card__skel-meta" />
    </div>
    <template v-else>
      <div class="admin-stat-card__header">
        <span class="admin-stat-card__icon-wrap" aria-hidden="true">
          <span :class="icon" class="admin-stat-card__icon" />
        </span>
        <span class="admin-stat-card__label">{{ props.label }}</span>
      </div>
      <div class="admin-stat-card__value">{{ props.value }}</div>
      <div v-if="props.meta" class="admin-stat-card__meta">{{ props.meta }}</div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  // Named SCSS vars for fixed UI chrome dimensions
  $icon-wrap-size: 24px;
  $icon-size: 14px;
  $skel-value-h: 28px;
  $dur-skel: var(--dur-slow, 1400ms);

  .admin-stat-card {
    padding: var(--space-4);
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-muted);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    &__icon-wrap {
      width: $icon-wrap-size;
      height: $icon-wrap-size;
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      display: grid;
      place-items: center;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    &__icon {
      width: $icon-size;
      height: $icon-size;
    }

    &__label {
      font-weight: 600;
    }

    &__value {
      font-size: var(--text-3xl);
      font-weight: 600;
      color: var(--text-loud);
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em;
    }

    &__meta {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    // Error variant: value turns error colour
    &--error {
      .admin-stat-card__value {
        color: var(--status-error-fg);
      }
    }

    // ── Skeleton ────────────────────────────────────────────────────────────
    &__skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__skel-header,
    &__skel-value,
    &__skel-meta {
      background: var(--surface-skeleton-base);
      border-radius: var(--radius-sm);
      animation: adm-skel-pulse $dur-skel ease-in-out infinite;
    }

    &__skel-header {
      height: var(--text-xs);
      width: 60%;
    }

    &__skel-value {
      height: $skel-value-h;
      width: 40%;
    }

    &__skel-meta {
      height: var(--text-xs);
      width: 75%;
    }
  }

  @keyframes adm-skel-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>
