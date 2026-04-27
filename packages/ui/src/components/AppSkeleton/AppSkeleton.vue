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
  // Token substitutions:
  //   --skeleton-base   → --skeleton-base   (ships as alias for --surface-skeleton-base)
  //   --skeleton-shine  → --skeleton-shine  (ships as alias for --surface-skeleton-shine)
  //   CSS fallback: var(--skeleton-base, var(--surface-overlay)) in case alias not resolved.
  //   --e-io            → ease-in-out       (bundle uses ease-in-out; --ease-default is cubic-bezier)
  .app-skeleton {
    display: inline-block;
    background: linear-gradient(
      90deg,
      var(--skeleton-base, var(--surface-overlay)),
      var(--skeleton-shine, var(--surface-raised)),
      var(--skeleton-base, var(--surface-overlay))
    );
    background-size: 200% 100%;
    animation: app-skeleton-pulse 1.4s ease-in-out infinite; // bundle skel-pulse

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
