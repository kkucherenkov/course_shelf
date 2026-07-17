<script setup lang="ts">
  import { computed, ref, useId } from 'vue';

  import AppLabel from '../AppLabel/AppLabel.vue';
  import IconCS from '../IconCS/IconCS.vue';

  type AutoComplete = 'current-password' | 'new-password';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      label?: string;
      withMeter?: boolean;
      autoComplete?: AutoComplete;
      hint?: string;
      error?: string;
      disabled?: boolean;
      required?: boolean;
      placeholder?: string;
      /** aria-label for the visibility toggle when password is hidden. */
      showLabel?: string;
      /** aria-label for the visibility toggle when password is shown. */
      hideLabel?: string;
    }>(),
    {
      label: 'Password',
      withMeter: false,
      autoComplete: 'current-password',
      hint: undefined,
      error: undefined,
      disabled: false,
      required: false,
      placeholder: '••••••••••',
      showLabel: 'Show password',
      hideLabel: 'Hide password',
    },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  const fieldId = useId();
  const descId = `${fieldId}-desc`;
  const visible = ref(false);

  // Score heuristic copied verbatim from `docs/design/shared/auth.jsx`
  // §PasswordField. Lives entirely in this component so policy changes are
  // localised — swap to zxcvbn here without touching consumers.
  const score = computed<0 | 1 | 2 | 3>(() => {
    const v = props.modelValue;
    if (!v) return 0;
    if (v.length < 8) return 1;
    if (v.length < 12) return 2;
    if (/[^a-z0-9]/i.test(v) || v.length > 16) return 3;
    return 2;
  });

  const scoreLabel = computed<'Empty' | 'Weak' | 'Okay' | 'Strong'>(() => {
    const labels = ['Empty', 'Weak', 'Okay', 'Strong'] as const;
    return labels[score.value];
  });

  function onInput(event: Event): void {
    emit('update:modelValue', (event.target as HTMLInputElement).value);
  }

  function toggleVisibility(): void {
    if (props.disabled) return;
    visible.value = !visible.value;
  }

  const describedBy = computed<string | undefined>(() =>
    props.error || props.hint || props.withMeter ? descId : undefined,
  );
</script>

<template>
  <div :class="['app-password-field', { 'app-password-field--error': !!error }]">
    <AppLabel :text="label" :for="fieldId" :required="required" class="app-password-field__label" />
    <div class="app-password-field__control">
      <IconCS name="lock" :size="14" class="app-password-field__leading-icon" aria-hidden="true" />
      <input
        :id="fieldId"
        :class="['app-password-field__input', { 'app-password-field__input--disabled': disabled }]"
        :type="visible ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autoComplete"
        :disabled="disabled"
        :required="required || undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        @input="onInput"
      />
      <button
        type="button"
        class="app-password-field__toggle"
        :aria-label="visible ? hideLabel : showLabel"
        :aria-pressed="visible"
        :disabled="disabled"
        @click="toggleVisibility"
      >
        <IconCS :name="visible ? 'eye-off' : 'eye'" :size="14" />
      </button>
    </div>
    <div v-if="withMeter" class="app-password-field__meter" aria-hidden="true">
      <div
        v-for="i in 3"
        :key="i"
        :class="[
          'app-password-field__meter-seg',
          { 'app-password-field__meter-seg--filled': score >= i },
          `app-password-field__meter-seg--score-${score}`,
        ]"
      />
    </div>
    <p v-if="error" :id="descId" class="app-password-field__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="descId" class="app-password-field__hint">
      {{ hint }}
    </p>
    <p v-else-if="withMeter" :id="descId" class="app-password-field__meter-label">
      {{ scoreLabel }} · 12+ chars w/ a symbol = strong
    </p>
  </div>
</template>

<style scoped lang="scss">
  // Tokens: --primary → --brand-accent; --surface-3 → --surface-overlay;
  // --status-warning-fg + --status-success-fg used for meter color steps.
  // No --space-* step matches these, so they are named SCSS variables.
  $input-height: 36px;
  $leading-icon-inset: 10px;
  $input-pad-trailing: 36px;
  $toggle-size: 28px;

  .app-password-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__control {
      position: relative;
      display: flex;
      align-items: center;
    }

    &__leading-icon {
      position: absolute;
      left: $leading-icon-inset;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      pointer-events: none;
      flex-shrink: 0;
    }

    &__input {
      display: block;
      width: 100%;
      padding: 0 $input-pad-trailing 0 var(--space-6);
      height: $input-height;
      min-height: $input-height;
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-fg);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
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

      &--disabled,
      &:disabled {
        background: var(--surface-overlay);
        color: var(--text-disabled);
        cursor: not-allowed;
      }
    }

    &--error &__input {
      border-color: var(--status-error-fg);

      &:focus-visible {
        box-shadow: 0 0 0 3px var(--status-error-soft);
      }
    }

    &__toggle {
      position: absolute;
      right: var(--space-1);
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: $toggle-size;
      height: $toggle-size;
      padding: 0;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition:
        background var(--dur-fast) var(--ease-default),
        color var(--dur-fast) var(--ease-default);

      &:hover:not(:disabled) {
        background: var(--surface-overlay);
        color: var(--text-fg);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }
    }

    &__meter {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-1);
    }

    &__meter-seg {
      height: var(--space-1);
      border-radius: 2px;
      background: var(--surface-overlay);
      transition: background var(--dur-fast) var(--ease-default);

      // Filled segments take a color matching the overall score so all three
      // shift together when the password gets stronger.
      &--filled.app-password-field__meter-seg--score-1 {
        background: var(--status-error-fg);
      }
      &--filled.app-password-field__meter-seg--score-2 {
        background: var(--status-warning-fg);
      }
      &--filled.app-password-field__meter-seg--score-3 {
        background: var(--status-success-fg);
      }
    }

    &__meter-label,
    &__hint {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    &__error {
      margin: 0;
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      color: var(--status-error-fg);
    }
  }
</style>
