<script setup lang="ts">
  /**
   * Small inline indicator that shows the save state of a settings field.
   *
   * Props:
   *   state — one of 'idle' | 'saving' | 'saved' | 'error'
   *   labelSaving / labelSaved / labelError — translated strings supplied
   *     by the parent page so this component stays i18n-free.
   *
   * Usage: displayName row passes all three label props; future rows can
   * reuse the same component.
   */

  interface Props {
    state: 'idle' | 'saving' | 'saved' | 'error';
    labelSaving: string;
    labelSaved: string;
    labelError: string;
  }

  const props = defineProps<Props>();
</script>

<template>
  <span
    class="setting-sync-indicator"
    :class="`setting-sync-indicator--${props.state}`"
    aria-live="polite"
  >
    <template v-if="props.state === 'saving'">
      <span class="setting-sync-indicator__spinner" aria-hidden="true" />
      <span class="setting-sync-indicator__label">{{ props.labelSaving }}</span>
    </template>
    <template v-else-if="props.state === 'saved'">
      <span
        class="setting-sync-indicator__icon setting-sync-indicator__icon--check"
        aria-hidden="true"
        >✓</span
      >
      <span class="setting-sync-indicator__label">{{ props.labelSaved }}</span>
    </template>
    <template v-else-if="props.state === 'error'">
      <span
        class="setting-sync-indicator__icon setting-sync-indicator__icon--error"
        aria-hidden="true"
        >!</span
      >
      <span class="setting-sync-indicator__label">{{ props.labelError }}</span>
    </template>
  </span>
</template>

<style lang="scss" scoped>
  $spinner-size: 12px;
  $icon-size: 14px;
  $icon-font-size: 9px;
  $dur-spin: var(--dur-slow);
  $dur-fade: var(--dur-fast);

  .setting-sync-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    min-height: 1em;
    transition: opacity $dur-fade ease;

    &--idle {
      opacity: 0;
      pointer-events: none;
    }

    &--saving {
      color: var(--text-muted);
    }

    &--saved {
      color: var(--status-success-fg);
    }

    &--error {
      color: var(--status-error-fg);
    }

    &__spinner {
      display: inline-block;
      width: $spinner-size;
      height: $spinner-size;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: ssi-spin $dur-spin linear infinite;
      flex-shrink: 0;
    }

    &__icon {
      display: inline-flex;
      width: $icon-size;
      height: $icon-size;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: 700;
      border-radius: 50%;
      flex-shrink: 0;

      &--check {
        background: var(--status-success-fg);
        color: var(--text-inverse);
        font-size: $icon-font-size;
      }

      &--error {
        background: var(--status-error-fg);
        color: var(--text-inverse);
        font-size: $icon-font-size;
      }
    }

    &__label {
      white-space: nowrap;
    }
  }

  @keyframes ssi-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
