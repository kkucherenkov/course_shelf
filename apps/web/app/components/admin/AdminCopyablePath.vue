<script setup lang="ts">
  import { ref } from 'vue';

  interface Props {
    /** The path string to display and copy. */
    path: string;
    /** Accessible label for the copy button. */
    ariaLabel: string;
  }

  const props = defineProps<Props>();

  const copied = ref(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  async function copyPath(): Promise<void> {
    try {
      await navigator.clipboard.writeText(props.path);
      copied.value = true;
      if (copyTimer !== null) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied.value = false;
        copyTimer = null;
      }, 1400);
    } catch {
      // Clipboard write failed — silently ignore (non-secure context, etc.)
    }
  }
</script>

<template>
  <button
    type="button"
    class="adm-copyable-path"
    :class="{ 'adm-copyable-path--copied': copied }"
    :aria-label="props.ariaLabel"
    @click="copyPath"
  >
    <span
      :class="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
      class="adm-copyable-path__icon"
      aria-hidden="true"
    />
    <span class="adm-copyable-path__text">{{ props.path }}</span>
  </button>
</template>

<style lang="scss" scoped>
  $icon-size: 12px;
  $dur-nav: var(--dur-fast, 120ms);

  .adm-copyable-path {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    min-width: 0;
    max-width: 100%;

    &:hover {
      color: var(--text-loud);

      .adm-copyable-path__icon {
        color: var(--brand-accent);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: 2px;
      border-radius: var(--radius-sm);
    }

    &--copied {
      .adm-copyable-path__icon {
        color: var(--status-success-fg);
      }
    }

    &__icon {
      flex-shrink: 0;
      width: $icon-size;
      height: $icon-size;
      color: var(--text-subtle);
      transition: color $dur-nav ease;
    }

    &__text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
