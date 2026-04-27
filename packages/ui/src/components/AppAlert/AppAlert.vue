<script setup lang="ts">
  import { computed } from 'vue';

  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  type Variant = 'info' | 'success' | 'warning' | 'error';

  const props = withDefaults(
    defineProps<{
      variant?: Variant;
      message: string;
    }>(),
    { variant: 'info' },
  );

  const iconName = computed<IconName>(() => {
    switch (props.variant) {
      case 'success': {
        return 'check-circle';
      }
      case 'warning': {
        return 'alert';
      }
      case 'error': {
        return 'alert';
      }
      default: {
        return 'info';
      }
    }
  });
</script>

<template>
  <div :class="['app-alert', `app-alert--${variant}`]" role="alert">
    <IconCS :name="iconName" :size="14" class="app-alert__icon" />
    <span class="app-alert__message">{{ message }}</span>
  </div>
</template>

<style scoped lang="scss">
  .app-alert {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    font-weight: var(--fw-medium);

    &__icon {
      flex-shrink: 0;
    }

    &--info {
      color: var(--info);
    }

    &--success {
      color: var(--success);
    }

    &--warning {
      color: var(--warning);
    }

    &--error {
      color: var(--error);
    }
  }
</style>
