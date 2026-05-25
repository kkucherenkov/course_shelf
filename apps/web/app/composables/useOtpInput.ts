import { ref, computed, type Ref, type ComputedRef } from 'vue';

/**
 * Headless one-digit-per-cell OTP input model.
 *
 * Holds the per-cell digit state and the keyboard/paste behaviour shared by
 * any segmented code entry (sign-up email verification, phone OTP login).
 * Focus movement is delegated to an injected `focusInput(index)` callback so
 * the composable owns no DOM and stays unit-testable in isolation — the
 * consuming component wires `focusInput` to its cell template refs.
 */
export interface UseOtpInputOptions {
  /** Number of cells. Defaults to 6. */
  length?: number;
  /** Move focus to the cell at `index`. No-op when omitted (e.g. in tests). */
  focusInput?: (index: number) => void;
}

export interface UseOtpInput {
  digits: Ref<string[]>;
  fullCode: ComputedRef<string>;
  onInput: (index: number, event: Event) => void;
  onKeydown: (index: number, event: KeyboardEvent) => void;
  onPaste: (event: ClipboardEvent) => void;
  reset: () => void;
}

export function useOtpInput(options: UseOtpInputOptions = {}): UseOtpInput {
  const length = options.length ?? 6;
  const { focusInput } = options;

  const digits = ref<string[]>(Array.from({ length }, () => ''));
  const fullCode = computed(() => digits.value.join(''));

  /** Keep only the last typed digit in a cell and advance focus once filled. */
  function onInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const char = target.value.replaceAll(/\D/g, '').slice(-1);
    digits.value[index] = char;
    if (char && index < length - 1) {
      focusInput?.(index + 1);
    }
  }

  /** Backspace in an already-empty cell retreats focus to the previous cell. */
  function onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
      focusInput?.(index - 1);
    }
  }

  /** Distribute a pasted code across the cells, stripping non-digits. */
  function onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '')
      .replaceAll(/\D/g, '')
      .slice(0, length);
    if (pasted.length === 0) return;
    digits.value = Array.from({ length }, (_, i) => pasted[i] ?? '');
    // Focus the first empty cell after the paste, or the last cell when full.
    focusInput?.(Math.min(pasted.length, length - 1));
  }

  /** Clear every cell — used when the user goes back to edit their email. */
  function reset(): void {
    digits.value = Array.from({ length }, () => '');
  }

  return { digits, fullCode, onInput, onKeydown, onPaste, reset };
}
