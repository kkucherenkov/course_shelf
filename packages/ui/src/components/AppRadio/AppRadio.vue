<script setup lang="ts" generic="T extends string | number">
  import { computed, inject } from 'vue';

  import type { AppRadioGroupContext } from '../AppRadioGroup/context';

  const props = withDefaults(
    defineProps<{
      value: T;
      label?: string;
      disabled?: boolean;
    }>(),
    { label: undefined, disabled: false },
  );

  const _ctx = inject<AppRadioGroupContext<T>>('app-radio-group');

  if (!_ctx) {
    throw new Error('[AppRadio] must be used inside <AppRadioGroup>.');
  }

  // After the throw guard above, _ctx is guaranteed to be defined.
  // Re-assign to a non-optional const so TypeScript sees the narrowing downstream.
  const ctx: AppRadioGroupContext<T> = _ctx;

  const checked = computed(() => ctx.modelValue.value === props.value);
  const isDisabled = computed(() => props.disabled || ctx.disabled.value);

  function select() {
    if (isDisabled.value) return;
    ctx.setValue(props.value);
  }

  function onKeydown(event: KeyboardEvent) {
    // Arrow-key navigation: move focus + select adjacent radio in the DOM.
    // This is a deliberate direct DOM approach — the group renders all its radios
    // as siblings inside the radiogroup div, so sibling traversal is reliable and
    // ref-free (avoids requiring AppRadioGroup to manage a ref array).
    const target = event.currentTarget as HTMLElement;
    const group = target.closest('[role="radiogroup"]');
    if (!group) return;

    const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
    const idx = radios.indexOf(target);

    let next: HTMLElement | undefined;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight': {
        event.preventDefault();
        next = radios[(idx + 1) % radios.length];

        break;
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        event.preventDefault();
        next = radios[(idx - 1 + radios.length) % radios.length];

        break;
      }
      case ' ':
      case 'Enter': {
        event.preventDefault();
        select();

        break;
      }
      // No default
    }

    if (next) {
      next.focus();
      next.click();
    }
  }
</script>

<template>
  <label :class="['app-radio', { 'app-radio--disabled': isDisabled }]">
    <button
      type="button"
      role="radio"
      :aria-checked="checked"
      :aria-disabled="isDisabled || undefined"
      :tabindex="checked ? 0 : -1"
      :class="['app-radio__circle', { 'app-radio__circle--checked': checked }]"
      :disabled="isDisabled"
      @click="select"
      @keydown="onKeydown"
    >
      <span
        v-if="checked"
        class="app-radio__dot"
        aria-hidden="true"
      />
    </button>
    <span
      v-if="label || $slots['default']"
      class="app-radio__label"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
  .app-radio {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;

    &__circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border: 1.5px solid var(--border-strong);
      border-radius: 50%;
      background: var(--surface-surface);
      cursor: pointer;
      padding: 0;
      transition:
        border-color var(--dur-fast) var(--ease),
        background-color var(--dur-fast) var(--ease);

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &--checked {
        border-color: var(--brand-accent);
      }
    }

    &__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--brand-accent);
    }

    &__label {
      font-size: var(--text-sm);
      color: var(--text-fg);
    }

    &--disabled {
      cursor: not-allowed;
      opacity: var(--opacity-disabled);
    }
  }
</style>
