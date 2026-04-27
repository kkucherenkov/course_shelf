<script setup lang="ts">
  import { computed } from 'vue';

  import AppIconButton from '../AppIconButton/AppIconButton.vue';
  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  type Variant = 'info' | 'success' | 'warning' | 'error';

  const props = withDefaults(
    defineProps<{
      variant?: Variant;
      title?: string;
      body?: string;
      dismissible?: boolean;
      dismissLabel?: string;
    }>(),
    {
      variant: 'info',
      title: undefined,
      body: undefined,
      dismissible: false,
      dismissLabel: 'Dismiss',
    },
  );

  const emit = defineEmits<{ dismiss: [] }>();

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

  const role = computed(() => (props.variant === 'error' ? 'alert' : 'status'));
</script>

<template>
  <div :class="['app-banner', `app-banner--${variant}`]" :role="role">
    <IconCS :name="iconName" :size="20" class="app-banner__icon" />
    <div class="app-banner__content">
      <strong v-if="title" class="app-banner__title">{{ title }}</strong>
      <div class="app-banner__body">
        <slot>{{ body }}</slot>
      </div>
    </div>
    <AppIconButton
      v-if="dismissible"
      name="x"
      variant="ghost"
      size="sm"
      :ariaLabel="dismissLabel"
      class="app-banner__dismiss"
      @click="emit('dismiss')"
    />
  </div>
</template>

<style scoped lang="scss">
  .app-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
    background: var(--surface-surface);

    &__icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    &__content {
      flex: 1 1 auto;
      min-width: 0;
    }

    &__title {
      display: block;
      font-weight: var(--fw-medium);
      color: var(--text-loud);
      margin-bottom: var(--space-1);
    }

    &__body {
      font-size: var(--text-sm);
      line-height: var(--leading-snug);
      color: var(--text-fg);
    }

    &__dismiss {
      flex-shrink: 0;
      margin-left: auto;
    }

    &--info {
      background: var(--info-soft);
      border-color: transparent;
      color: var(--info);
    }

    &--success {
      background: var(--success-soft);
      border-color: transparent;
      color: var(--success);
    }

    &--warning {
      background: var(--warning-soft);
      border-color: transparent;
      color: var(--warning);
    }

    &--error {
      background: var(--error-soft);
      border-color: transparent;
      color: var(--error);
    }
  }
</style>
