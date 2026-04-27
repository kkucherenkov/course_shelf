<script setup lang="ts">
  import { computed } from 'vue';

  import IconCS from '../IconCS/IconCS.vue';

  type Variant = 'ring' | 'bar' | 'pill';
  type State = 'not-started' | 'in-progress' | 'completed' | 'locked';

  const props = withDefaults(
    defineProps<{
      variant?: Variant;
      state?: State;
      completed?: number;
      total?: number;
    }>(),
    { variant: 'pill', state: 'in-progress', completed: 0, total: 0 },
  );

  // Locked / not-started → 0 %; completed → 100 %; otherwise compute from
  // (completed / total). Guard against division by zero.
  const pct = computed<number>(() => {
    if (props.state === 'completed') return 100;
    if (props.state === 'not-started' || props.state === 'locked') return 0;
    if (props.total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((props.completed / props.total) * 100)));
  });

  const ringStyle = computed(() => {
    if (props.state === 'locked') {
      return { background: 'var(--surface-overlay)' };
    }
    return {
      background: `conic-gradient(var(--brand-accent) ${String(pct.value)}%, var(--surface-overlay) 0)`,
    };
  });
</script>

<template>
  <!-- ring -->
  <div
    v-if="variant === 'ring'"
    :class="['app-progress-badge', 'app-progress-badge--ring', `app-progress-badge--${state}`]"
    :style="ringStyle"
    role="img"
    :aria-label="`${String(pct)}%`"
  >
    <div class="app-progress-badge__ring-inner">
      <IconCS v-if="state === 'completed'" name="check" :size="14" />
      <IconCS v-else-if="state === 'locked'" name="lock" :size="12" />
      <span v-else class="app-progress-badge__ring-pct">{{ pct }}%</span>
    </div>
  </div>

  <!-- bar -->
  <div
    v-else-if="variant === 'bar'"
    :class="['app-progress-badge', 'app-progress-badge--bar', `app-progress-badge--${state}`]"
    role="img"
    :aria-label="`${String(pct)}%`"
  >
    <div class="app-progress-badge__bar-track">
      <div class="app-progress-badge__bar-fill" :style="{ width: `${String(pct)}%` }" />
    </div>
    <span class="app-progress-badge__bar-pct">{{ pct }}%</span>
  </div>

  <!-- pill (default) -->
  <span
    v-else
    :class="['app-progress-badge', 'app-progress-badge--pill', `app-progress-badge--${state}`]"
    :data-state="state"
  >
    <template v-if="state === 'completed'">
      <IconCS name="check" :size="10" />
      Done
    </template>
    <template v-else-if="state === 'locked'">
      <IconCS name="lock" :size="10" />
      Locked
    </template>
    <template v-else-if="state === 'not-started'">—</template>
    <template v-else>{{ completed }} of {{ total }}</template>
  </span>
</template>

<style scoped lang="scss">
  // bundle's --primary maps to --brand-accent; --surface-3 → --surface-overlay;
  // --success → --status-success-fg; --text-muted → --text-secondary
  .app-progress-badge {
    flex-shrink: 0;

    // Ring
    &--ring {
      position: relative;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
    }

    &__ring-inner {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--surface-surface);
      display: grid;
      place-items: center;
      color: var(--text-fg);
    }

    &__ring-pct {
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      font-variant-numeric: tabular-nums;
      color: var(--text-fg);
    }

    &--ring.app-progress-badge--completed &__ring-inner {
      background: var(--brand-accent);
      color: var(--brand-accent-fg);
    }

    &--ring.app-progress-badge--locked &__ring-inner {
      background: var(--surface-raised);
      color: var(--text-secondary);
    }

    // Bar
    &--bar {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
    }

    &__bar-track {
      flex: 1 1 auto;
      height: 4px;
      border-radius: 2px;
      background: var(--surface-overlay);
      overflow: hidden;
    }

    &__bar-fill {
      height: 100%;
      background: var(--brand-accent);
      border-radius: 2px;
      transition: width var(--dur-slow) var(--ease-out);
    }

    &--bar.app-progress-badge--completed &__bar-fill {
      background: var(--status-success-fg);
    }

    &__bar-pct {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-variant-numeric: tabular-nums;
      color: var(--text-secondary);
      min-width: 3em;
      text-align: right;
    }

    // Pill
    &--pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 0 var(--space-2);
      height: 22px;
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      background: var(--surface-overlay);
      color: var(--text-fg);
      font-variant-numeric: tabular-nums;
    }

    &--pill.app-progress-badge--completed {
      background: var(--status-success-soft);
      color: var(--status-success-fg);
    }

    &--pill.app-progress-badge--locked {
      background: var(--surface-overlay);
      color: var(--text-secondary);
    }

    &--pill.app-progress-badge--not-started {
      background: transparent;
      color: var(--text-secondary);
      padding: 0;
    }
  }
</style>
