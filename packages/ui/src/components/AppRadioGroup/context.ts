import type { ComputedRef } from 'vue';

/** Injection key contract shared between AppRadioGroup and AppRadio. */
export interface AppRadioGroupContext<T extends string | number> {
  name: ComputedRef<string>;
  modelValue: ComputedRef<T>;
  disabled: ComputedRef<boolean>;
  setValue: (v: T) => void;
}
