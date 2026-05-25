/**
 * Unit tests for useOtpInput composable.
 *
 * Pure reactive logic — no Nuxt globals, no DOM queries. Focus movement is
 * delegated to an injected `focusInput` callback so the composable stays
 * testable in isolation.
 */

import { describe, it, expect, vi } from 'vitest';

import { useOtpInput } from '../useOtpInput';

// Build a fake <input> input event carrying the typed value.
function inputEvent(value: string): Event {
  return { target: { value } } as unknown as Event;
}

// Build a fake keydown event with the given key.
function keydownEvent(key: string): KeyboardEvent {
  return { key } as KeyboardEvent;
}

// Build a fake paste event whose clipboard yields `text`.
function pasteEvent(text: string): ClipboardEvent {
  return {
    clipboardData: { getData: () => text },
    preventDefault: vi.fn(),
  } as unknown as ClipboardEvent;
}

describe('useOtpInput', () => {
  it('starts with empty digits and an empty code', () => {
    const otp = useOtpInput();
    expect(otp.digits.value).toEqual(['', '', '', '', '', '']);
    expect(otp.fullCode.value).toBe('');
  });

  it('honours a custom length', () => {
    const otp = useOtpInput({ length: 4 });
    expect(otp.digits.value).toEqual(['', '', '', '']);
  });

  it('writes a single digit and advances focus to the next cell', () => {
    const focusInput = vi.fn();
    const otp = useOtpInput({ focusInput });
    otp.onInput(0, inputEvent('5'));
    expect(otp.digits.value[0]).toBe('5');
    expect(focusInput).toHaveBeenCalledWith(1);
  });

  it('keeps only the last typed digit and strips non-digits', () => {
    const otp = useOtpInput();
    otp.onInput(0, inputEvent('a7'));
    expect(otp.digits.value[0]).toBe('7');
  });

  it('clears the cell when the input is emptied', () => {
    const otp = useOtpInput();
    otp.onInput(0, inputEvent('3'));
    otp.onInput(0, inputEvent(''));
    expect(otp.digits.value[0]).toBe('');
  });

  it('does not advance focus past the last cell', () => {
    const focusInput = vi.fn();
    const otp = useOtpInput({ length: 6, focusInput });
    otp.onInput(5, inputEvent('9'));
    expect(focusInput).not.toHaveBeenCalled();
  });

  it('retreats focus on backspace in an empty cell', () => {
    const focusInput = vi.fn();
    const otp = useOtpInput({ focusInput });
    otp.onKeydown(2, keydownEvent('Backspace'));
    expect(focusInput).toHaveBeenCalledWith(1);
  });

  it('does not retreat focus on backspace when the cell is filled', () => {
    const focusInput = vi.fn();
    const otp = useOtpInput({ focusInput });
    otp.onInput(2, inputEvent('4'));
    focusInput.mockClear();
    otp.onKeydown(2, keydownEvent('Backspace'));
    expect(focusInput).not.toHaveBeenCalled();
  });

  it('does not retreat focus on backspace in the first cell', () => {
    const focusInput = vi.fn();
    const otp = useOtpInput({ focusInput });
    otp.onKeydown(0, keydownEvent('Backspace'));
    expect(focusInput).not.toHaveBeenCalled();
  });

  it('distributes a pasted 6-digit code across all cells', () => {
    const focusInput = vi.fn();
    const otp = useOtpInput({ focusInput });
    otp.onPaste(pasteEvent('123456'));
    expect(otp.digits.value).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(otp.fullCode.value).toBe('123456');
    // Last cell filled → focus the final cell.
    expect(focusInput).toHaveBeenCalledWith(5);
  });

  it('strips non-digits and spaces from a pasted code', () => {
    const otp = useOtpInput();
    otp.onPaste(pasteEvent('12 34-56'));
    expect(otp.digits.value).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('ignores overflow past the configured length when pasting', () => {
    const otp = useOtpInput({ length: 6 });
    otp.onPaste(pasteEvent('1234567890'));
    expect(otp.digits.value).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('fills only the leading cells for a short paste and focuses the next empty cell', () => {
    const focusInput = vi.fn();
    const otp = useOtpInput({ focusInput });
    otp.onPaste(pasteEvent('123'));
    expect(otp.digits.value).toEqual(['1', '2', '3', '', '', '']);
    // Next empty cell after the paste → index 3.
    expect(focusInput).toHaveBeenCalledWith(3);
  });

  it('prevents the browser default on paste', () => {
    const otp = useOtpInput();
    const event = pasteEvent('123456');
    otp.onPaste(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('reset clears all cells', () => {
    const otp = useOtpInput();
    otp.onPaste(pasteEvent('123456'));
    otp.reset();
    expect(otp.digits.value).toEqual(['', '', '', '', '', '']);
    expect(otp.fullCode.value).toBe('');
  });
});
