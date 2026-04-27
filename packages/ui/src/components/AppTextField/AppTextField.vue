<script setup lang="ts">
  import AppField from '../AppField/AppField.vue';
  import AppInput from '../AppInput/AppInput.vue';

  type Size = 'sm' | 'md' | 'lg';
  type TextInputType = 'text' | 'email' | 'password' | 'tel' | 'url';

  withDefaults(
    defineProps<{
      modelValue: string;
      label: string;
      placeholder?: string;
      help?: string;
      error?: string;
      required?: boolean;
      disabled?: boolean;
      readonly?: boolean;
      size?: Size;
      /** Narrower than AppInput — number/date types are not exposed here. */
      type?: TextInputType;
      autocomplete?: string;
      inputmode?: string;
    }>(),
    {
      placeholder: undefined,
      help: undefined,
      error: undefined,
      required: false,
      disabled: false,
      readonly: false,
      size: 'md',
      type: 'text',
      autocomplete: undefined,
      inputmode: undefined,
    },
  );

  defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <AppField :label="label" :help="help" :error="error" :required="required" :size="size">
    <template #default="slotAttrs">
      <AppInput
        v-bind="slotAttrs"
        :model-value="modelValue"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :size="size ?? 'md'"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </template>
  </AppField>
</template>
