/**
 * Spec for AdminRemoveLibraryDialog component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminRemoveLibraryDialog from '../AdminRemoveLibraryDialog.vue';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
const mockToastAdd = vi.fn();
vi.stubGlobal('useToast', () => ({ add: mockToastAdd }));

const mockT = vi.fn((key: string) => key);
vi.stubGlobal('useI18n', () => ({ t: mockT }));

const mockNavigateTo = vi.fn();
vi.stubGlobal('navigateTo', mockNavigateTo);

// ── SDK mock ───────────────────────────────────────────────────────────────
const mockRemoveLibrary = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  removeLibrary: (...args: unknown[]) => mockRemoveLibrary(...args),
  client: {},
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

describe('AdminRemoveLibraryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog content when open=true', () => {
    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Remove Computer Science?');
    expect(wrapper.text()).toContain('This action is permanent.');
  });

  it('Confirm button is disabled until typed name matches library name', async () => {
    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    const confirmBtn = wrapper.find('.adm-remove-lib-dialog__btn--danger');
    expect(confirmBtn.attributes('disabled')).toBeDefined();

    const input = wrapper.find('input');
    await input.setValue('Computer Scienc'); // one char short
    expect(confirmBtn.attributes('disabled')).toBeDefined();

    await input.setValue('Computer Science'); // exact match
    expect(confirmBtn.attributes('disabled')).toBeUndefined();
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

    const confirmBtn = wrapper.find('.adm-remove-lib-dialog__btn--danger');
    await confirmBtn.trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(mockRemoveLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'lib-1' } }),
    );
    expect(wrapper.emitted('removed')).toBeTruthy();
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(mockNavigateTo).toHaveBeenCalledWith('/admin/libraries');
  });

  it('emits update:open false when Cancel is clicked', async () => {
    const wrapper = mount(AdminRemoveLibraryDialog, { props: baseProps });
    const cancelBtn = wrapper.find('.adm-remove-lib-dialog__btn--ghost');
    await cancelBtn.trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(mockRemoveLibrary).not.toHaveBeenCalled();
  });

  it('does not render when open=false', () => {
    const wrapper = mount(AdminRemoveLibraryDialog, {
      props: { ...baseProps, open: false },
    });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
});
