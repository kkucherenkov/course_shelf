<script setup lang="ts">
  withDefaults(
    defineProps<{
      /** CSS length string, e.g. "120px", "50%". Default "100%". */
      width?: string;
      /** CSS length string, e.g. "1em", "16px". Default "1em". */
      height?: string;
      /** Border-radius variant. Default "sm". */
      radius?: 'sm' | 'md' | 'pill';
    }>(),
    { width: '100%', height: '1em', radius: 'sm' },
  );
</script>

<template>
  <span
    :class="['app-skeleton', `app-skeleton--${radius}`]"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<style scoped lang="scss">
  // Bundle .skel contract parity.
  // CSS fallback: var(--surface-skeleton-base, var(--surface-overlay)) covers browsers/tests
  // that don't resolve the custom property.
  //   --e-io → ease-in-out (bundle uses ease-in-out; --ease-default is cubic-bezier)

  // Ambient shimmer loop — not an interaction transition, so it sits outside
  // the --dur-* scale (which tops out at 400ms).
  $shimmer-duration: 1.4s;

  .app-skeleton {
    display: inline-block;
    background: linear-gradient(
      90deg,
      var(--surface-skeleton-base, var(--surface-overlay)),
      var(--surface-skeleton-shine, var(--surface-raised)),
      var(--surface-skeleton-base, var(--surface-overlay))
    );
    background-size: 200% 100%;
    animation: app-skeleton-pulse $shimmer-duration ease-in-out infinite; // bundle skel-pulse

    &--sm {
      border-radius: var(--radius-sm);
    }

    &--md {
      border-radius: var(--radius-md);
    }

    &--pill {
      border-radius: var(--radius-pill);
    }
  }

  @keyframes app-skeleton-pulse {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
</style>
