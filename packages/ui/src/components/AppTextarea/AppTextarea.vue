<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue';

  type Size = 'sm' | 'md' | 'lg';
  type Resize = 'none' | 'vertical' | 'horizontal' | 'both';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      placeholder?: string;
      rows?: number;
      maxRows?: number;
      autoGrow?: boolean;
      size?: Size;
      disabled?: boolean;
      readonly?: boolean;
      resize?: Resize;
    }>(),
    {
      placeholder: undefined,
      rows: 3,
      maxRows: undefined,
      autoGrow: false,
      size: 'md',
      disabled: false,
      readonly: false,
      resize: 'vertical',
    },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  // Every a11y/field linkage attribute (id, aria-describedby, aria-invalid,
  // aria-required) comes in via $attrs from AppField's slot contract. We want
  // them *on the textarea itself*, not the wrapper, so we opt out of the
  // default root-element fallthrough.
  defineOptions({ inheritAttrs: false });

  const textareaRef = ref<HTMLTextAreaElement | null>(null);

  const rootClasses = computed(() => [
    'app-textarea',
    `app-textarea--${props.size}`,
    `app-textarea--resize-${props.resize}`,
    {
      'app-textarea--disabled': props.disabled,
      'app-textarea--readonly': props.readonly,
      'app-textarea--autogrow': props.autoGrow,
    },
  ]);

  // When autoGrow is true we want the control to hug its content. CSS
  // `field-sizing: content` is the simplest path and we layer a JS recompute on
  // top as the polyfill — set height to auto, then to scrollHeight, capped at
  // maxRows * approximated line-height. Keeping both means browsers that ship
  // field-sizing get zero-JS behaviour; older engines get the polyfill path.
  function recomputeHeight(): void {
    if (!props.autoGrow) {
      return;
    }
    const el = textareaRef.value;
    if (!el) {
      return;
    }
    el.style.height = 'auto';
    const nextHeight = props.maxRows
      ? Math.min(el.scrollHeight, approximateMaxPx(el, props.maxRows))
      : el.scrollHeight;
    el.style.height = `${String(nextHeight)}px`;
  }

  function approximateMaxPx(el: HTMLTextAreaElement, maxRows: number): number {
    // computed line-height can be `normal`; fall back to 1.5 × fontSize which is
    // our --leading-normal token value (defined in tokens.generated.css).
    const style = globalThis.getComputedStyle(el);
    const lineHeightRaw = Number.parseFloat(style.lineHeight);
    const fontSize = Number.parseFloat(style.fontSize) || 0;
    const lineHeight = Number.isFinite(lineHeightRaw) ? lineHeightRaw : fontSize * 1.5;
    return lineHeight * maxRows;
  }

  function onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    emit('update:modelValue', target.value);
    // Recompute after the new value is in the DOM so scrollHeight is accurate.
    void nextTick(recomputeHeight);
  }

  // Keep auto-grow honest when the parent controls the value (programmatic
  // reset, template-driven fill, etc.) — without this, pasting via v-model
  // wouldn't re-measure until the next user keystroke.
  watch(
    () => props.modelValue,
    () => {
      void nextTick(recomputeHeight);
    },
  );
</script>

<template>
  <textarea
    ref="textareaRef"
    :class="rootClasses"
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :disabled="disabled"
    :readonly="readonly"
    v-bind="$attrs"
    @input="onInput"
  />
</template>

<style lang="scss" scoped>
  .app-textarea {
    display: block;
    width: 100%;
    min-width: 0;
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-fg);
    font-family: var(--font-sans);
    line-height: var(--leading-normal);
    transition:
      border-color var(--dur-fast) var(--ease-default),
      box-shadow var(--dur-fast) var(--ease-default);

    &::placeholder {
      color: var(--text-tertiary);
    }

    &:focus-visible {
      border-color: var(--brand-accent);
      box-shadow: var(--shadow-focus);
      outline: none;
    }

    &:disabled,
    &--disabled {
      background: var(--surface-bg-muted);
      color: var(--text-fg-disabled);
      cursor: not-allowed;
    }

    &--readonly {
      background: var(--surface-bg-subtle);
      cursor: default;
    }

    &--sm {
      padding: var(--space-3) var(--space-3);
      font-size: var(--text-xs);
    }

    &--md {
      padding: var(--space-4) var(--space-4);
      font-size: var(--text-sm);
    }

    &--lg {
      padding: var(--space-5) var(--space-5);
      font-size: var(--text-md);
    }

    // Resize modifiers — map directly onto CSS `resize`.
    &--resize-none {
      resize: none;
    }

    &--resize-vertical {
      resize: vertical;
    }

    &--resize-horizontal {
      resize: horizontal;
    }

    &--resize-both {
      resize: both;
    }

    // Auto-grow: let the UA size the field to its content when it supports
    // `field-sizing`, and always disable manual resize so our JS polyfill is
    // authoritative. Browsers without field-sizing will still get sized via the
    // recomputeHeight() hook.
    &--autogrow {
      resize: none;
      field-sizing: content;
    }
  }
</style>
