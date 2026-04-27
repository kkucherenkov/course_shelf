<script setup lang="ts">
  import { ref, watch, useId, onUnmounted } from 'vue';
  import AppIconButton from '../AppIconButton/AppIconButton.vue';

  type Size = 'sm' | 'md';

  const props = withDefaults(
    defineProps<{
      open: boolean;
      size?: Size;
      title: string;
      description?: string;
      dismissible?: boolean;
      dismissLabel?: string;
    }>(),
    { size: 'md', description: undefined, dismissible: true, dismissLabel: 'Close' },
  );

  const emit = defineEmits<{ 'update:open': [value: boolean] }>();

  const dialogRef = ref<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descId = useId();

  function close() {
    if (!props.dismissible) return;
    emit('update:open', false);
  }

  watch(
    () => props.open,
    (next) => {
      const dialog = dialogRef.value;
      if (!dialog) return;
      if (next && !dialog.open) {
        dialog.showModal();
      } else if (!next && dialog.open) {
        dialog.close();
      }
    },
    { flush: 'post' },
  );

  function onClose() {
    // Native dialog `close` event fires on ESC and on .close() — ensure our
    // `open` prop reflects the closed state.
    if (props.open) emit('update:open', false);
  }

  function onBackdropClick(event: MouseEvent) {
    // Backdrop click on a native <dialog> is detectable: target is the dialog
    // itself when clicking outside its content. We only treat it as a close
    // when dismissible.
    if (event.target === dialogRef.value) close();
  }

  // Defensive: if the component unmounts while open, close the dialog so it
  // doesn't leave the inert state on the parent document.
  onUnmounted(() => {
    if (dialogRef.value?.open) dialogRef.value.close();
  });
</script>

<template>
  <dialog
    ref="dialogRef"
    :class="['app-dialog', `app-dialog--${size}`]"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descId : undefined"
    @close="onClose"
    @click="onBackdropClick"
  >
    <div class="app-dialog__panel">
      <header class="app-dialog__header">
        <h2 :id="titleId" class="app-dialog__title">
          {{ title }}
        </h2>
        <AppIconButton
          v-if="dismissible"
          name="x"
          variant="ghost"
          size="sm"
          :ariaLabel="dismissLabel ?? 'Close'"
          class="app-dialog__close"
          @click="close"
        />
      </header>
      <p v-if="description" :id="descId" class="app-dialog__description">
        {{ description }}
      </p>
      <div class="app-dialog__body">
        <slot />
      </div>
      <footer v-if="$slots['footer']" class="app-dialog__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
  .app-dialog {
    padding: 0;
    border: none;
    border-radius: var(--radius-lg);
    background: transparent;
    max-height: 90vh;
    overflow: visible;

    &::backdrop {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
    }

    &--sm .app-dialog__panel {
      max-width: 480px;
    }
    &--md .app-dialog__panel {
      max-width: 640px;
    }

    &__panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: 90vh;
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border-default);
    }

    &__title {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__close {
      flex-shrink: 0;
    }

    &__description {
      margin: 0;
      padding: var(--space-3) var(--space-5);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-default);
    }

    &__body {
      padding: var(--space-5);
      overflow-y: auto;
      flex: 1 1 auto;
    }

    &__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-5);
      border-top: 1px solid var(--border-default);
    }
  }
</style>
