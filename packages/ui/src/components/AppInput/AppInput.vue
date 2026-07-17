<script setup lang="ts">
  type Size = 'sm' | 'md' | 'lg';
  type InputType =
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'url'
    | 'search'
    | 'number'
    | 'date'
    | 'time'
    | 'datetime-local';

  withDefaults(
    defineProps<{
      modelValue: string;
      type?: InputType;
      placeholder?: string;
      size?: Size;
      disabled?: boolean;
      readonly?: boolean;
      required?: boolean;
    }>(),
    {
      type: 'text',
      placeholder: undefined,
      size: 'md',
      disabled: false,
      readonly: false,
      required: false,
    },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  // a11y / field-linkage attrs (id, aria-describedby, aria-invalid,
  // aria-required) come in via $attrs from AppField's slot contract, as do
  // pass-through HTML attributes (inputmode, autocomplete, maxlength, pattern,
  // data-testid, …). They must land on the <input> itself, so we disable the
  // default root-element fallthrough and spread $attrs manually.
  defineOptions({ inheritAttrs: false });

  function onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.value);
  }
</script>

<template>
  <input
    :class="[
      'app-input',
      `app-input--${size}`,
      {
        'app-input--disabled': disabled,
        'app-input--readonly': readonly,
      },
    ]"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required || undefined"
    v-bind="$attrs"
    @input="onInput"
  />
</template>

<style lang="scss" scoped>
  // Control heights match the bundle's .btn-sm/default/lg and .input rules.
  // The --space-* scale (0,4,8,12,16,24,32,48,64,96) has no matching step, so
  // these are named SCSS variables per the stylelint rule's own guidance.
  $input-height-sm: 28px;
  $input-height-md: 36px;
  $input-height-lg: 44px;
  $input-height-md-compact: 30px;

  .app-input {
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
      background: var(--surface-overlay);
      color: var(--text-disabled);
      cursor: not-allowed;

      &::placeholder {
        color: var(--text-disabled);
      }
    }

    &--readonly {
      background: var(--surface-raised);
      cursor: default;
    }

    // sm = 28px, md = 36px (default .input), lg = 44px.
    &--sm {
      padding: 0 var(--space-3);
      font-size: var(--text-sm);
      height: $input-height-sm;
      min-height: $input-height-sm;
    }

    &--md {
      padding: 0 var(--space-3);
      font-size: var(--text-md);
      height: $input-height-md;
      min-height: $input-height-md;
    }

    &--lg {
      padding: 0 var(--space-4);
      font-size: var(--text-md);
      height: $input-height-lg;
      min-height: $input-height-lg;
    }
  }

  // Compact density — bundle spec ([data-density="compact"] .input) drops md to 30px.
  // The selector must pierce the scoped boundary so we address the host element
  // via :deep() — but since this is a single native <input> root there is no
  // child pierce needed; we address our own scoped class via a global ancestor.
  :global([data-density='compact']) .app-input--md {
    height: $input-height-md-compact;
    min-height: $input-height-md-compact;
  }
</style>
