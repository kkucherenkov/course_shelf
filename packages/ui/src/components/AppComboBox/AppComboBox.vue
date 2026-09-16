<script lang="ts">
  /** A single choice rendered inside the dropdown. */
  export interface ComboBoxOption {
    id: string;
    label: string;
    disabled?: boolean;
  }

  // Opt out of the default root-level $attrs merge so id / aria-* attrs from a
  // parent (e.g. AppField's slot props) land on the inner <input> — that's
  // where the assistive tech reads them. Mirrors AppSelect.
  export default { inheritAttrs: false };
</script>

<script setup lang="ts">
  /**
   * Async multi-select combobox — ARIA combobox pattern (WAI-ARIA APG),
   * not a "div with handlers": `role="combobox"` lives on the text input,
   * a sibling `role="listbox"` holds the options, and the currently
   * highlighted option is communicated via `aria-activedescendant` on the
   * input rather than by moving DOM focus into the listbox. That is the one
   * property that makes a combobox usable with a screen reader while typing
   * — focus never leaves the input, so the highlighted option is announced
   * without losing the caret or the IME composition state.
   *
   * Pure visual component: it does not fetch. `items` is whatever the
   * current server search returned (already filtered — `ignore-filter`
   * equivalent), `loading` is a fetch-in-flight flag, and `searchTerm` is a
   * v-model the consumer feeds into its own debounced fetch. The consumer
   * (`useEntitySearch` in apps/web) must keep every previously-seen option in
   * `items` for as long as its id stays selected — otherwise a chip for an
   * id absent from `items` falls back to rendering the raw id.
   */
  import { computed, nextTick, ref, useAttrs, useId, watch } from 'vue';

  import AppSpinner from '../AppSpinner/AppSpinner.vue';
  import IconCS from '../IconCS/IconCS.vue';

  const props = withDefaults(
    defineProps<{
      /** Selected option ids. */
      modelValue: string[];
      /** Current search results (server-filtered) plus every previously-selected option. */
      items: readonly ComboBoxOption[];
      /** Search box text — a v-model the consumer debounces into its own fetch. */
      searchTerm: string;
      loading?: boolean;
      disabled?: boolean;
      placeholder?: string;
      loadingLabel?: string;
      /** Shown in the listbox when `items` is empty and not loading. */
      noResultsLabel?: string;
      /** Aria-label for a chip's remove button — `{name}` is replaced with the option's label. */
      removeLabel?: string;
      /**
       * Accessible name for the popup listbox itself — a `role="listbox"`
       * needs one independently of the input's own label (axe
       * `aria-input-field-name`). The field's own label text is the right
       * value in practice ("Instructors" names the "Instructors" listbox).
       */
      listboxLabel?: string;
    }>(),
    {
      loading: false,
      disabled: false,
      placeholder: undefined,
      loadingLabel: 'Loading…',
      noResultsLabel: 'No results',
      removeLabel: 'Remove {name}',
      listboxLabel: 'Options',
    },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string[]];
    'update:searchTerm': [value: string];
  }>();

  const attrs = useAttrs();
  const inputRef = ref<HTMLInputElement | null>(null);
  const isOpen = ref(false);
  const activeIndex = ref(-1);

  const baseId = useId();
  // `aria-controls` on the input targets the panel, not the listbox — the
  // panel exists for every open state (loading/no-results/options), while
  // the listbox itself only exists once there is an option to hold. Pointing
  // aria-controls at an id that vanishes whenever the state is anything but
  // "has options" is an axe `aria-valid-attr-value` violation.
  const panelId = `${baseId}-panel`;
  const listboxId = `${baseId}-listbox`;
  function optionId(index: number): string {
    return `${baseId}-option-${String(index)}`;
  }

  const selectedOptions = computed<ComboBoxOption[]>(() =>
    props.modelValue.map((id) => props.items.find((o) => o.id === id) ?? { id, label: id }),
  );

  const activeOptionId = computed<string | undefined>(() =>
    isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined,
  );

  function isSelected(id: string): boolean {
    return props.modelValue.includes(id);
  }

  function resetActiveIndex(): void {
    activeIndex.value = props.items.length > 0 ? 0 : -1;
  }

  // Re-anchor the highlighted option whenever the result set changes while
  // open — a stale index would point at a different option (or nothing)
  // once new search results land.
  watch(
    () => props.items,
    () => {
      if (isOpen.value) resetActiveIndex();
    },
  );

  function open(): void {
    if (props.disabled || isOpen.value) return;
    isOpen.value = true;
    resetActiveIndex();
  }

  function close(): void {
    isOpen.value = false;
    activeIndex.value = -1;
  }

  function toggleOption(option: ComboBoxOption): void {
    if (option.disabled) return;
    const next = isSelected(option.id)
      ? props.modelValue.filter((id) => id !== option.id)
      : [...props.modelValue, option.id];
    emit('update:modelValue', next);
  }

  function removeOption(id: string): void {
    if (props.disabled) return;
    emit(
      'update:modelValue',
      props.modelValue.filter((v) => v !== id),
    );
    // Removal can come from a chip's <button>, which the browser would
    // otherwise focus — pull focus back to the input so the field the
    // consumer keeps typing in never silently changes.
    void nextTick(() => inputRef.value?.focus());
  }

  function onInput(event: Event): void {
    emit('update:searchTerm', (event.target as HTMLInputElement).value);
  }

  // ponytail: keyboard nav lands on disabled options rather than skipping
  // them — course/instructor/studio/tag search never returns a disabled
  // option today. Skip-on-nav if a caller ever needs one.
  function moveActive(delta: number): void {
    if (props.items.length === 0) return;
    activeIndex.value = Math.min(Math.max(activeIndex.value + delta, 0), props.items.length - 1);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (props.disabled) return;
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (isOpen.value) {
          moveActive(1);
        } else {
          open();
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (isOpen.value) {
          moveActive(-1);
        } else {
          open();
        }
        break;
      }
      case 'Home': {
        if (isOpen.value && props.items.length > 0) {
          event.preventDefault();
          activeIndex.value = 0;
        }
        break;
      }
      case 'End': {
        if (isOpen.value && props.items.length > 0) {
          event.preventDefault();
          activeIndex.value = props.items.length - 1;
        }
        break;
      }
      case 'Enter': {
        if (!isOpen.value) break;
        const option = props.items[activeIndex.value];
        if (option) {
          event.preventDefault();
          toggleOption(option);
        }
        break;
      }
      case 'Escape': {
        if (isOpen.value) {
          event.preventDefault();
          close();
        }
        break;
      }
      case 'Backspace': {
        const last = selectedOptions.value.at(-1);
        if (props.searchTerm === '' && last) removeOption(last.id);
        break;
      }
      // No default
    }
  }

  function formatRemoveLabel(label: string): string {
    return props.removeLabel.replace('{name}', label);
  }

  function focusInput(): void {
    inputRef.value?.focus();
  }
</script>

<template>
  <div :class="['app-combo-box', { 'app-combo-box--disabled': disabled }]">
    <div class="app-combo-box__control" @click="focusInput">
      <ul class="app-combo-box__chips">
        <li v-for="option in selectedOptions" :key="option.id" class="app-combo-box__chip">
          <span class="app-combo-box__chip-label">{{ option.label }}</span>
          <button
            type="button"
            class="app-combo-box__chip-remove"
            :disabled="disabled"
            :aria-label="formatRemoveLabel(option.label)"
            @mousedown.prevent
            @click="removeOption(option.id)"
          >
            <IconCS name="x" :size="10" />
          </button>
        </li>
      </ul>
      <input
        ref="inputRef"
        v-bind="attrs"
        class="app-combo-box__input"
        type="text"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isOpen"
        :aria-controls="panelId"
        :aria-activedescendant="activeOptionId"
        :disabled="disabled"
        :placeholder="placeholder"
        :value="searchTerm"
        @input="onInput"
        @focus="open"
        @blur="close"
        @keydown="onKeydown"
      />
      <span class="app-combo-box__chevron" :class="{ 'app-combo-box__chevron--open': isOpen }">
        <IconCS name="chevron-down" :size="12" />
      </span>
    </div>

    <div v-if="isOpen" :id="panelId" class="app-combo-box__panel">
      <!--
        A listbox's only valid ARIA children are option/group (axe:
        aria-required-children) — a status message is neither, so "loading"
        and "no results" render as a plain live region OUTSIDE the listbox
        rather than as a row inside it. The listbox itself only exists once
        there is at least one option to put in it.
      -->
      <!-- AppSpinner already carries its own role="status" — no need to double it here. -->
      <p v-if="loading" class="app-combo-box__status">
        <AppSpinner size="sm" /> {{ loadingLabel }}
      </p>
      <p v-else-if="items.length === 0" role="status" class="app-combo-box__status">
        {{ noResultsLabel }}
      </p>
      <ul
        v-else
        :id="listboxId"
        class="app-combo-box__listbox"
        role="listbox"
        :aria-label="listboxLabel"
        aria-multiselectable="true"
      >
        <li
          v-for="(option, index) in items"
          :id="optionId(index)"
          :key="option.id"
          role="option"
          :aria-selected="isSelected(option.id)"
          :aria-disabled="option.disabled ? 'true' : undefined"
          :class="[
            'app-combo-box__option',
            {
              'app-combo-box__option--active': index === activeIndex,
              'app-combo-box__option--selected': isSelected(option.id),
              'app-combo-box__option--disabled': option.disabled,
            },
          ]"
          @mousedown.prevent
          @mouseenter="activeIndex = index"
          @click="toggleOption(option)"
        >
          <span class="app-combo-box__option-label">{{ option.label }}</span>
          <IconCS
            v-if="isSelected(option.id)"
            name="check"
            :size="14"
            class="app-combo-box__option-check"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  // Intrinsic control geometry — matches AppInput's md height so the combo
  // box sits flush with the other fields on the same form.
  $control-min-height: 36px;
  $chip-height: 22px;
  $input-min-width: 80px;
  $listbox-max-height: 240px;

  .app-combo-box {
    position: relative;
    width: 100%;

    &__control {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-1);
      min-height: $control-min-height;
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-surface);
      cursor: text;
      transition: border-color var(--dur-fast) var(--ease-default);

      &:hover {
        border-color: var(--border-strong);
      }

      &:has(.app-combo-box__input:focus-visible) {
        border-color: var(--brand-accent);
        box-shadow: var(--shadow-focus);
      }
    }

    &__chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    &__chip {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      height: $chip-height;
      padding-inline: var(--space-2);
      border-radius: var(--radius-pill);
      background: var(--brand-accent-soft);
      color: var(--brand-accent-hover);
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
    }

    &__chip-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border: 0;
      border-radius: var(--radius-pill);
      background: none;
      color: currentcolor;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--surface-raised);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: var(--opacity-disabled);
      }

      &:focus-visible {
        outline: none;
        box-shadow: var(--shadow-focus);
      }
    }

    &__input {
      flex: 1 1 $input-min-width;
      min-width: $input-min-width;
      border: 0;
      background: none;
      color: var(--text-fg);
      font-family: var(--font-sans);
      font-size: var(--text-md);

      &:focus {
        outline: none;
      }

      &::placeholder {
        color: var(--text-tertiary);
      }

      &:disabled {
        cursor: not-allowed;

        &::placeholder {
          color: var(--text-disabled);
        }
      }
    }

    &__chevron {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      color: var(--text-secondary);
      transition: transform var(--dur-fast) var(--ease-default);

      &--open {
        transform: rotate(180deg);
      }
    }

    // The floating panel — present whenever open, whether it holds the
    // listbox or a status message, so both share one position/surface.
    &__panel {
      position: absolute;
      inset-inline: 0;
      top: calc(100% + var(--space-1));
      z-index: var(--z-dropdown);
      overflow-y: auto;
      max-height: $listbox-max-height;
      background: var(--surface-overlay);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    &__listbox {
      margin: 0;
      padding: var(--space-1);
      list-style: none;
    }

    &__status {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      padding: var(--space-2) var(--space-3);
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }

    &__option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-fg);
      font-size: var(--text-sm);
      cursor: pointer;

      &--active {
        background: var(--brand-accent-soft);
      }

      &--selected {
        font-weight: var(--fw-medium);
      }

      &--disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
    }

    &__option-check {
      flex-shrink: 0;
      color: var(--brand-accent);
    }

    &--disabled {
      .app-combo-box__control {
        cursor: not-allowed;
        background: var(--surface-raised);
      }
    }
  }
</style>
