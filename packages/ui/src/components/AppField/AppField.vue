<script setup lang="ts">
  import { computed, useId } from 'vue';

  import AppLabel from '../AppLabel/AppLabel.vue';

  type Size = 'sm' | 'md' | 'lg';

  const props = withDefaults(
    defineProps<{
      label: string;
      required?: boolean;
      help?: string;
      error?: string;
      size?: Size;
    }>(),
    { required: false, help: undefined, error: undefined, size: 'md' },
  );

  // Auto-generated, SSR-safe, stable across re-renders.
  const fieldId = useId();
  const descId = `${fieldId}-desc`;

  // AppLabel only ships sm/md; map the extra "lg" onto md so the label stays legible
  // without unnecessary growth — input height handles the size signal.
  const labelSize = computed<'sm' | 'md'>(() => (props.size === 'sm' ? 'sm' : 'md'));

  // We expose attributes the consumer spreads onto their input control — this is
  // how the field wires a11y linkage without owning the input itself.
  const slotAttrs = computed(() => ({
    id: fieldId,
    'aria-describedby': props.help || props.error ? descId : undefined,
    'aria-invalid': props.error ? true : undefined,
    'aria-required': props.required ? true : undefined,
  }));
</script>

<template>
  <div :class="['app-field', `app-field--${size}`, { 'app-field--error': !!error }]">
    <AppLabel
      :text="label"
      :for="fieldId"
      :required="required"
      :size="labelSize"
      class="app-field__label"
    />
    <div class="app-field__control">
      <slot v-bind="slotAttrs" />
    </div>
    <p
      v-if="error"
      :id="descId"
      class="app-field__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="help"
      :id="descId"
      class="app-field__help"
    >
      {{ help }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
  .app-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__control {
      display: flex;
      flex-direction: column;
    }

    &__help,
    &__error {
      margin: 0;
      font-family: var(--font-sans);
      font-size: var(--text-xs);
      line-height: var(--leading-normal);
    }

    &__help {
      color: var(--text-fg-muted);
    }

    &__error {
      // --status-danger is not a shipped token; the generated CSS ships
      // --status-error-fg (light: #A04434, dark: #D26B5C). Alias confirmed in
      // apps/web/app/assets/css/tokens.generated.css.
      color: var(--status-error-fg);
      font-weight: var(--fw-medium);
    }
  }
</style>
