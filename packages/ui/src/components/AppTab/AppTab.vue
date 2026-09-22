<script setup lang="ts" generic="T extends string | number">
  import { computed, inject } from 'vue';

  interface AppTabsContext<V extends string | number> {
    modelValue: { value: V };
    setValue: (v: V) => void;
  }

  const props = defineProps<{
    value: T;
    /** Fallback label rendered when no default slot is provided. */
    label?: string;
  }>();

  const injected = inject<AppTabsContext<T>>('app-tabs');

  if (!injected) throw new Error('AppTab must be used inside AppTabs');

  // After the throw guard above, `injected` is narrowed but vue-tsc still
  // considers it potentially undefined inside computed/functions — use a
  // non-null assertion to satisfy the type checker.

  const ctx = injected;

  const selected = computed(() => ctx.modelValue.value === props.value);

  function onClick(): void {
    ctx.setValue(props.value);
  }

  function onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    switch (event.key) {
      case 'ArrowLeft': {
        event.preventDefault();
        const prev = target.previousElementSibling as HTMLElement | null;
        prev?.focus();
        prev?.click();

        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        const next = target.nextElementSibling as HTMLElement | null;
        next?.focus();
        next?.click();

        break;
      }
      case ' ':
      case 'Enter': {
        event.preventDefault();
        onClick();

        break;
      }
      // No default
    }
  }
</script>

<template>
  <button
    type="button"
    role="tab"
    :aria-selected="selected"
    :tabindex="selected ? 0 : -1"
    :class="['app-tab', { 'app-tab--selected': selected }]"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped lang="scss">
  // Bundle .tab contract parity.
  // Token substitutions:
  //   --text-muted  → --text-secondary  (ships as alias --text-muted)
  //   --text        → --text-fg         (ships as alias)
  //   --text-loud   → --text-loud       (ships verbatim — darker than --text-fg)
  //   --primary     → --brand-accent    (ships as alias)
  //   --d-fast      → --dur-fast        (ships as alias)
  //   --e-io        → --ease-default    (ships as alias)
  .app-tab {
    padding: var(--space-3) var(--space-4); // 10px 14px ≈ 12px 16px (closest shipped)
    color: var(--text-secondary); // bundle --text-muted
    font-weight: var(--fw-medium);
    font-size: var(--text-md); // 14px, matching the bundle exactly (#696)
    font-family: var(--font-sans);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    cursor: pointer;
    // A tab's own label never wraps or shrinks — a row that doesn't fit
    // should scroll (see AppTabs consumers), not fold a label onto a second
    // line where it loses its border-bottom "selected" underline (#782).
    flex-shrink: 0;
    white-space: nowrap;
    transition:
      color var(--dur-fast) var(--ease-default),
      border-color var(--dur-fast) var(--ease-default);

    &:hover {
      color: var(--text-fg); // bundle --text
    }

    &:focus-visible {
      outline: none;
      color: var(--text-fg);
      border-bottom-color: var(--brand-accent);
    }

    &--selected {
      color: var(--text-loud); // bundle --text-loud — slightly darker
      border-bottom-color: var(--brand-accent); // bundle --primary
    }
  }
</style>
