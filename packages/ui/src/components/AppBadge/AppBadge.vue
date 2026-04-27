<script setup lang="ts">
  import UBadge from '@nuxt/ui/components/Badge.vue';
  import { computed } from 'vue';

  import AppIcon from '../AppIcon/AppIcon.vue';

  type Color = 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info';
  type Variant = 'solid' | 'outline' | 'soft' | 'subtle';
  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      label?: string;
      color?: Color;
      variant?: Variant;
      size?: Size;
      icon?: string;
      uppercase?: boolean;
    }>(),
    {
      label: undefined,
      color: 'neutral',
      variant: 'subtle',
      size: 'md',
      icon: undefined,
      uppercase: false,
    },
  );

  const rootClasses = computed(() => ['app-badge', { 'app-badge--uppercase': props.uppercase }]);

  // AppIcon size scale is `xs|sm|md|lg|xl` — the badge only uses the small end.
  const iconSize = computed<'xs' | 'sm' | 'md'>(() => {
    switch (props.size) {
      case 'sm': {
        return 'xs';
      }
      case 'lg': {
        return 'md';
      }
      default: {
        return 'sm';
      }
    }
  });
</script>

<template>
  <UBadge :color="color" :variant="variant" :size="size" :class="rootClasses">
    <AppIcon v-if="icon" :name="icon" :size="iconSize" class="app-badge__icon" />
    <span class="app-badge__label">
      <slot>{{ label }}</slot>
    </span>
  </UBadge>
</template>

<style lang="scss" scoped>
  .app-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);

    &__icon {
      flex-shrink: 0;
    }

    &__label {
      display: inline-flex;
      align-items: center;
    }

    &--uppercase {
      .app-badge__label {
        text-transform: uppercase;
        letter-spacing: var(--tracking-wide);
      }
    }
  }
</style>
