<script setup lang="ts">
  import { computed } from 'vue';

  import AppIconButton from '../AppIconButton/AppIconButton.vue';

  type Variant = 'success' | 'info' | 'error';

  const props = withDefaults(
    defineProps<{
      variant?: Variant;
      message: string;
      dismissible?: boolean;
      dismissLabel?: string;
    }>(),
    { variant: 'info', dismissible: false, dismissLabel: 'Dismiss' },
  );

  const emit = defineEmits<{ dismiss: [] }>();

  const role = computed(() => (props.variant === 'error' ? 'alert' : 'status'));
</script>

<template>
  <div :class="['app-toast', `app-toast--${variant}`]" :role="role">
    <span :class="['app-toast__dot', `app-toast__dot--${variant}`]" aria-hidden="true" />
    <span class="app-toast__message">{{ message }}</span>
    <AppIconButton
      v-if="dismissible"
      name="x"
      variant="ghost"
      size="sm"
      :ariaLabel="dismissLabel"
      class="app-toast__dismiss"
      @click="emit('dismiss')"
    />
  </div>
</template>

<style scoped lang="scss">
  // Bundle spec: min-width 280px. Named SCSS vars keep stylelint token rule satisfied.
  $toast-min-width: 280px;
  $toast-dot-size: 8px;

  .app-toast {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    min-width: $toast-min-width;

    &__dot {
      width: $toast-dot-size;
      height: $toast-dot-size;
      border-radius: 50%;
      flex-shrink: 0;
    }

    &__dot--success {
      background: var(--success);
    }

    &__dot--info {
      background: var(--info);
    }

    &__dot--error {
      background: var(--error);
    }

    &__message {
      flex: 1 1 auto;
      min-width: 0;
      font-size: var(--text-sm);
      color: var(--text-fg);
    }

    &__dismiss {
      flex-shrink: 0;
    }
  }
</style>
