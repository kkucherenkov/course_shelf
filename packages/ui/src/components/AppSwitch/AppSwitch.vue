<script setup lang="ts">
  import { computed, useAttrs, useId } from 'vue';

  type Size = 'sm' | 'md' | 'lg';
  type Color = 'primary' | 'success' | 'neutral';

  const props = withDefaults(
    defineProps<{
      modelValue: boolean;
      label?: string;
      disabled?: boolean;
      size?: Size;
      color?: Color;
    }>(),
    {
      label: undefined,
      disabled: false,
      size: 'md',
      color: 'primary',
    },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: boolean];
  }>();

  // A local id lets the wrapper <label> associate with the switch button so a
  // click on the label text forwards to the switch's click handler — same
  // affordance as a native `<input type="checkbox">` + <label>.
  // Disable automatic attr fallthrough so aria-* / id attrs from AppField's slot
  // contract land on the inner <button role="switch">, not the wrapper <label>.
  defineOptions({ inheritAttrs: false });

  const attrs = useAttrs();

  const switchId = useId();

  // Compute the effective button id: prefer the id passed in via attrs (from AppField)
  // over the internal stable id. Using bracket notation to satisfy TS index-signature rule.
  const effectiveSwitchId = computed(() => (attrs['id'] as string | undefined) ?? switchId);

  const rootClasses = computed(() => [
    'app-switch',
    `app-switch--${props.size}`,
    `app-switch--color-${props.color}`,
    {
      'app-switch--checked': props.modelValue,
      'app-switch--disabled': props.disabled,
    },
  ]);

  function toggle(): void {
    if (props.disabled) {
      return;
    }
    emit('update:modelValue', !props.modelValue);
  }

  function onClick(): void {
    toggle();
  }

  function onKeydown(event: KeyboardEvent): void {
    // Space is the standard activation key for role="switch". Enter is delegated
    // to native <button> semantics, which already fires `click` on Enter.
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      toggle();
    }
  }
</script>

<template>
  <!-- When attrs carries an `id` from AppField, prefer it over the internal switchId
       so the <label for="..."> association remains consistent. -->
  <label v-if="label" :class="rootClasses" :for="effectiveSwitchId">
    <!-- v-bind="attrs" lands id / aria-describedby / aria-invalid / aria-required
         from AppField's slot contract onto the interactive element, not the label. -->
    <button
      v-bind="attrs"
      :id="effectiveSwitchId"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      :disabled="disabled"
      class="app-switch__control"
      @click="onClick"
      @keydown="onKeydown"
    >
      <span class="app-switch__track">
        <span class="app-switch__thumb" />
      </span>
    </button>
    <span class="app-switch__label">{{ label }}</span>
  </label>
  <button
    v-else
    v-bind="attrs"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="[...rootClasses, 'app-switch__control']"
    @click="onClick"
    @keydown="onKeydown"
  >
    <span class="app-switch__track">
      <span class="app-switch__thumb" />
    </span>
  </button>
</template>

<style lang="scss" scoped>
  // Size scale — track width × height × thumb diameter × thumb translate.
  // Kept as SCSS vars so the --size modifier stays a one-line override.
  // These are intrinsic component geometry, not layout rhythm, so they are
  // named literals rather than --space-* steps (same convention as
  // AppScanProgress's $dot-size / AppLessonRow's $num-col-w). They previously
  // read the --space-* scale with px values in trailing comments — written
  // against a phantom `--space-N == N * 2px` scale that this repo never
  // emitted. Half the refs were dangling (no width at all) and the other half
  // resolved to 2-4x the intended size. The px values below are that intent.
  // Geometry invariant per size: track = inset + thumb + translate + inset,
  // with $thumb-inset on both ends so the pill reads symmetric off and on.
  $thumb-inset: 2px;

  $track-width-sm: 20px;
  $track-width-md: 24px;
  $track-width-lg: 32px;

  $track-height-sm: 12px;
  $track-height-md: 16px;
  $track-height-lg: 20px;

  $thumb-size-sm: 8px;
  $thumb-size-md: 10px;
  $thumb-size-lg: 12px;

  // translate = track - inset - thumb - inset
  $thumb-travel-sm: 8px;
  $thumb-travel-md: 10px;
  $thumb-travel-lg: 16px;

  .app-switch {
    display: inline-flex;
    gap: var(--space-4);
    align-items: center;
    cursor: pointer;

    &--disabled {
      cursor: not-allowed;
      opacity: var(--opacity-disabled);
    }

    &__control {
      display: inline-flex;
      padding: 0;
      background: transparent;
      border: 0;
      cursor: inherit;
      appearance: none;

      &:focus-visible {
        outline: none;

        .app-switch__track {
          box-shadow: var(--shadow-focus);
        }
      }

      &:disabled {
        cursor: not-allowed;
      }
    }

    &__track {
      position: relative;
      display: inline-block;
      flex-shrink: 0;
      background: var(--border-strong);
      border-radius: var(--radius-pill);
      transition: background-color var(--dur-base) var(--ease-default);
    }

    &__thumb {
      position: absolute;
      top: 50%;
      left: $thumb-inset;
      background: var(--surface-surface);
      border-radius: var(--radius-pill);
      box-shadow: var(--shadow-sm);
      transform: translateY(-50%);
      transition:
        transform var(--dur-base) var(--ease-default),
        background-color var(--dur-base) var(--ease-default);
    }

    &__label {
      color: var(--text-fg);
      font-size: var(--text-md);
      font-weight: var(--fw-medium);
      user-select: none;
    }

    // Size modifiers drive track + thumb geometry.
    &--sm {
      .app-switch__track {
        width: $track-width-sm;
        height: $track-height-sm;
      }

      .app-switch__thumb {
        width: $thumb-size-sm;
        height: $thumb-size-sm;
      }

      &.app-switch--checked .app-switch__thumb,
      .app-switch--checked .app-switch__thumb {
        transform: translate($thumb-travel-sm, -50%);
      }
    }

    &--md {
      .app-switch__track {
        width: $track-width-md;
        height: $track-height-md;
      }

      .app-switch__thumb {
        width: $thumb-size-md;
        height: $thumb-size-md;
      }

      &.app-switch--checked .app-switch__thumb,
      .app-switch--checked .app-switch__thumb {
        transform: translate($thumb-travel-md, -50%);
      }
    }

    &--lg {
      .app-switch__track {
        width: $track-width-lg;
        height: $track-height-lg;
      }

      .app-switch__thumb {
        width: $thumb-size-lg;
        height: $thumb-size-lg;
      }

      &.app-switch--checked .app-switch__thumb,
      .app-switch--checked .app-switch__thumb {
        transform: translate($thumb-travel-lg, -50%);
      }
    }

    // Colour modifiers — applied when checked. Off-state is always neutral.
    &--checked.app-switch--color-primary .app-switch__track,
    .app-switch--checked.app-switch--color-primary .app-switch__track {
      background: var(--brand-accent);
    }

    &--checked.app-switch--color-success .app-switch__track,
    .app-switch--checked.app-switch--color-success .app-switch__track {
      // Solid fill, matching the --brand-accent sibling above — so the -fg
      // triplet, not the -soft tint.
      background: var(--status-success-fg);
    }

    &--checked.app-switch--color-neutral .app-switch__track,
    .app-switch--checked.app-switch--color-neutral .app-switch__track {
      background: var(--text-fg);
    }
  }
</style>
