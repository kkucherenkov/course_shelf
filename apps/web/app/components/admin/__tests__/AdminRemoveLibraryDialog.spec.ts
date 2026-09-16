/**
 * Spec for AdminRemoveLibraryDialog component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { getCurrentInstance } from 'vue';
import AdminRemoveLibraryDialog from '../AdminRemoveLibraryDialog.vue';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
// Guarded like the real composables: `useToast`/`useI18n` only resolve
// inside an active component instance (`setup()`, not a post-`await`
// continuation). An unconditional stub here would hide the exact defect
// these components shipped with — see #639.
const mockToastAdd = vi.fn();
vi.stubGlobal('useToast', () => {
  if (!getCurrentInstance()) throw new Error('useToast() called outside setup()');
  return { add: mockToastAdd };
});

const mockT = vi.fn((key: string) => key);
vi.stubGlobal('useI18n', () => {
  if (!getCurrentInstance()) throw new Error('useI18n() called outside setup()');
  return { t: mockT };
});

const mockNavigateTo = vi.fn();
vi.stubGlobal('navigateTo', mockNavigateTo);

// ── SDK mock ───────────────────────────────────────────────────────────────
const mockRemoveLibrary = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  removeLibrary: (...args: unknown[]) => mockRemoveLibrary(...args),
  client: {},
}));

vi.mock('@app/ui', () => ({
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'size', 'title', 'description', 'dismissible', 'dismissLabel'],
    emits: ['update:open'],
    template:
      '<div class="stub-dialog" :data-open="open"><h2>{{ title }}</h2><p>{{ description }}</p><slot /><slot name="footer" /></div>',
  },
  AppField: {
    name: 'AppField',
    props: ['label', 'help', 'required'],
    template: '<div><slot v-bind="{}" /></div>',
  },
  AppInput: {
    name: 'AppInput',
    props: ['modelValue', 'placeholder', 'disabled', 'required'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  AppButton: {
    name: 'AppButton',
    props: ['type', 'variant', 'label', 'disabled', 'loading'],
    template: '<button :type="type || \'button\'" :disabled="disabled">{{ label }}</button>',
  },
}));

const baseLibrary = { id: 'lib-1', name: 'Computer Science' };

const baseProps = {
  open: true,
  library: baseLibrary,
  dialogTitle: 'Remove Computer Science?',
  dialogBody: 'This action is permanent.',
  confirmPrompt: 'Type the library name to confirm:',
  confirmCta: 'Remove library',
  cancelCta: 'Cancel',
};

function findButton(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((b) => b.text() === text);
  if (!button) throw new Error(`Expected a button labelled "${text}"`);
  return button;
}

describe('AdminRemoveLibraryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog content when open=true', () => {
    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    expect(wrapper.find('.stub-dialog').attributes('data-open')).toBe('true');
    expect(wrapper.text()).toContain('Remove Computer Science?');
    expect(wrapper.text()).toContain('This action is permanent.');
  });

  it('passes open=false through to AppDialog', () => {
    const wrapper = mount(AdminRemoveLibraryDialog, {
      props: { ...baseProps, open: false },
    });
    expect(wrapper.find('.stub-dialog').attributes('data-open')).toBe('false');
  });

  it('Confirm button is disabled until typed name matches library name', async () => {
    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    const confirmBtn = findButton(wrapper, baseProps.confirmCta);
    expect(confirmBtn.attributes('disabled')).toBeDefined();

    const input = wrapper.find('input');
    await input.setValue('Computer Scienc'); // one char short
    expect(findButton(wrapper, baseProps.confirmCta).attributes('disabled')).toBeDefined();

    await input.setValue('Computer Science'); // exact match
    expect(findButton(wrapper, baseProps.confirmCta).attributes('disabled')).toBeUndefined();
  });

  it('calls removeLibrary and emits removed + navigates on success', async () => {
    mockRemoveLibrary.mockResolvedValueOnce({
      data: undefined,
      error: null,
      response: { status: 204 },
    });

    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    const input = wrapper.find('input');
    await input.setValue('Computer Science');

    await findButton(wrapper, baseProps.confirmCta).trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(mockRemoveLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'lib-1' } }),
    );
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }));
    expect(wrapper.emitted('removed')).toBeTruthy();
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(mockNavigateTo).toHaveBeenCalledWith('/admin/libraries');
  });

  it('shows a toast and closes on 403 without throwing', async () => {
    mockRemoveLibrary.mockResolvedValueOnce({
      data: undefined,
      error: { status: 403 },
      response: { status: 403 },
    });

    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    await wrapper.find('input').setValue('Computer Science');
    await findButton(wrapper, baseProps.confirmCta).trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }));
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('emits update:open false when Cancel is clicked', async () => {
    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    await findButton(wrapper, baseProps.cancelCta).trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(mockRemoveLibrary).not.toHaveBeenCalled();
  });
});
