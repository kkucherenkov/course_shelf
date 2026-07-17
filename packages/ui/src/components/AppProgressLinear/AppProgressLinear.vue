<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      /** 0..100; undefined = indeterminate animated stripe. */
      value?: number;
      /** Drops track height from 4px to 2px. */
      thin?: boolean;
      /** aria-label / aria-valuetext text for screen readers. */
      label?: string;
    }>(),
    { value: undefined, thin: false, label: undefined },
  );

  const indeterminate = computed(() => props.value === undefined);
  const clamped = computed(() => Math.max(0, Math.min(100, props.value ?? 0)));
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : clamped"
    :class="[
      'app-progress-linear',
      {
        'app-progress-linear--thin': thin,
        'app-progress-linear--indeterminate': indeterminate,
      },
    ]"
  >
    <div
      class="app-progress-linear__fill"
      :style="indeterminate ? undefined : { width: `${clamped}%` }"
    />
  </div>
</template>

<style scoped lang="scss">
  // Bundle .progress-linear contract parity.
  // Token substitutions:
  //   --surface-3  → --surface-overlay  (ships as alias --surface-3)
  //   --primary    → --brand-accent     (ships as alias)
  //   --d-slow     → --dur-slow         (ships as alias)
  //   --e-out      → --ease-out         (ships as alias)
  //   --e-io       → --ease-default     (ships as alias)

  // Bar thickness — intrinsic geometry, named literal (same convention as
  // AppScanProgress's $bar-height).
  $bar-height: 4px;

  // Ambient indeterminate loop — not an interaction transition, so it sits
  // outside the --dur-* scale (which tops out at 400ms).
  $slide-duration: 1.4s;

  .app-progress-linear {
    width: 100%;
    height: $bar-height;
    border-radius: 2px;
    background: var(--surface-overlay); // bundle --surface-3
    overflow: hidden;
    position: relative;

    &--thin {
      height: 2px;
    }

    &__fill {
      height: 100%;
      background: var(--brand-accent); // bundle --primary
      border-radius: 2px;
      transition: width var(--dur-slow) var(--ease-out); // bundle --d-slow, --e-out
    }

    // Indeterminate: sliding stripe animation.
    &--indeterminate &__fill {
      width: 35%;
      animation: app-progress-linear-slide $slide-duration var(--ease-default) infinite; // bundle --e-io
    }
  }

  @keyframes app-progress-linear-slide {
    0% {
      transform: translateX(-100%);
    }

    100% {
      transform: translateX(300%);
    }
  }
</style>
