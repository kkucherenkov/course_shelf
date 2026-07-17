<script setup lang="ts">
  import UIcon from '@nuxt/ui/runtime/vue/components/Icon.vue';
  import { computed } from 'vue';

  type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  const props = withDefaults(
    defineProps<{
      name: string;
      size?: Size;
      label?: string;
    }>(),
    { size: 'md', label: undefined },
  );

  const decorative = computed(() => props.label === undefined || props.label === '');
</script>

<template>
  <UIcon
    :name="name"
    :class="['app-icon', `app-icon--${size}`]"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : label"
  />
</template>

<style lang="scss" scoped>
  // Icon size ramp. Intrinsic glyph geometry rather than layout rhythm, so
  // these are named literals rather than --space-* steps (same convention as
  // AppScanProgress's $dot-size / AppLessonRow's $num-col-w).
  // Previously the --space-* scale, written against a phantom
  // `--space-N == N * 2px` scale this repo never emitted: xs/sm resolved to
  // 32px/64px (2-4x intended) and md/lg/xl were dangling, so those three
  // rendered with no width or height at all. The ramp below is the intent
  // that the phantom scale encoded.
  $size-xs: 12px;
  $size-sm: 16px;
  $size-md: 20px;
  $size-lg: 24px;
  $size-xl: 32px;

  .app-icon {
    display: inline-flex;
    flex-shrink: 0;
    color: currentcolor;

    &--xs {
      width: $size-xs;
      height: $size-xs;
    }

    &--sm {
      width: $size-sm;
      height: $size-sm;
    }

    &--md {
      width: $size-md;
      height: $size-md;
    }

    &--lg {
      width: $size-lg;
      height: $size-lg;
    }

    &--xl {
      width: $size-xl;
      height: $size-xl;
    }
  }
</style>
