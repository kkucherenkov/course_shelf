<script setup lang="ts">
  import { computed } from 'vue';

  import AppField from '../AppField/AppField.vue';
  import AppIconButton from '../AppIconButton/AppIconButton.vue';
  import AppInput from '../AppInput/AppInput.vue';

  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      modelValue: number | null;
      label: string;
      placeholder?: string;
      help?: string;
      error?: string;
      required?: boolean;
      disabled?: boolean;
      readonly?: boolean;
      size?: Size;
      min?: number;
      max?: number;
      step?: number;
    }>(),
    {
      placeholder: undefined,
      help: undefined,
      error: undefined,
      required: false,
      disabled: false,
      readonly: false,
      size: 'md',
      min: undefined,
      max: undefined,
      step: 1,
    },
  );

  const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

  const stringValue = computed<string>(() =>
    props.modelValue === null ? '' : String(props.modelValue),
  );

  const atMin = computed(
    () => props.modelValue !== null && props.min !== undefined && props.modelValue <= props.min,
  );

  const atMax = computed(
    () => props.modelValue !== null && props.max !== undefined && props.modelValue >= props.max,
  );

  function clamp(value: number): number {
    let v = value;
    if (props.min !== undefined) v = Math.max(props.min, v);
    if (props.max !== undefined) v = Math.min(props.max, v);
    return v;
  }

  function decrement() {
    if (props.disabled || props.readonly) return;
    // step defaults to 1 via withDefaults — never undefined here
    const current = props.modelValue ?? 0;
    emit('update:modelValue', clamp(current - props.step));
  }

  function increment() {
    if (props.disabled || props.readonly) return;
    // step defaults to 1 via withDefaults — never undefined here
    const current = props.modelValue ?? 0;
    emit('update:modelValue', clamp(current + props.step));
  }

  function onInput(raw: string) {
    if (raw === '' || raw === '-') {
      emit('update:modelValue', null);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      emit('update:modelValue', clamp(parsed));
    }
  }
</script>

<template>
  <AppField
    :label="label"
    :help="help"
    :error="error"
    :required="required"
    :size="size"
  >
    <template #default="slotAttrs">
      <div class="app-number-field__wrapper">
        <!-- Decrement stepper — ariaLabel is a component prop (exempted from kebab rule).
             The underlying <button> renders aria-label on the DOM element. -->
        <AppIconButton
          name="minus"
          variant="ghost"
          :size="size === 'lg' ? 'md' : 'sm'"
          ariaLabel="Decrement"
          :disabled="disabled || readonly || atMin"
          class="app-number-field__stepper"
          @click="decrement"
        />
        <AppInput
          v-bind="slotAttrs"
          :model-value="stringValue"
          type="number"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :size="size ?? 'md'"
          class="app-number-field__input"
          @update:model-value="onInput"
        />
        <!-- Increment stepper -->
        <AppIconButton
          name="plus"
          variant="ghost"
          :size="size === 'lg' ? 'md' : 'sm'"
          ariaLabel="Increment"
          :disabled="disabled || readonly || atMax"
          class="app-number-field__stepper"
          @click="increment"
        />
      </div>
    </template>
  </AppField>
</template>

<style scoped lang="scss">
  .app-number-field {
    &__wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    &__input {
      flex: 1 1 auto;
      min-width: 0;
      // Hide native number spinners — our custom steppers replace them.
      appearance: textfield;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        appearance: none;
        margin: 0;
      }
    }

    &__stepper {
      flex-shrink: 0;
    }
  }
</style>
