/**
 * Spec for AdminEditLibrarySheet component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminEditLibrarySheet from '../AdminEditLibrarySheet.vue';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
const mockToastAdd = vi.fn();
vi.stubGlobal('useToast', () => ({ add: mockToastAdd }));

const mockT = vi.fn((key: string) => key);
vi.stubGlobal('useI18n', () => ({ t: mockT }));

vi.stubGlobal('navigateTo', vi.fn());

// ── SDK mock ───────────────────────────────────────────────────────────────
const mockUpdateLibrary = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  updateLibrary: (...args: unknown[]) => mockUpdateLibrary(...args),
  client: {},
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'body'],
    template: '<div class="stub-banner">{{ body }}</div>',
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
    template: '<button :type="type || \'button\'">{{ label }}</button>',
  },
}));

const baseLibrary = { id: 'lib-1', name: 'Computer Science' };

const baseProps = {
  open: true,
  library: baseLibrary,
  title: 'Rename library',
  labelName: 'Library name',
  placeholder: 'My Library',
  errorEmpty: 'Name cannot be empty.',
  saveLabel: 'Save',
  cancelLabel: 'Cancel',
};

describe('AdminEditLibrarySheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens with the current library name pre-filled', () => {
    const wrapper = mount(AdminEditLibrarySheet, { props: baseProps });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('Computer Science');
  });

  it('shows inline error when submitting an empty (trimmed) name', async () => {
    const wrapper = mount(AdminEditLibrarySheet, { props: baseProps });
    const input = wrapper.find('input');
    await input.setValue('   ');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.stub-banner').exists()).toBe(true);
    expect(wrapper.find('.stub-banner').text()).toContain('Name cannot be empty.');
    expect(mockUpdateLibrary).not.toHaveBeenCalled();
  });

  it('closes without firing the request when name is unchanged (same after trim)', async () => {
    const wrapper = mount(AdminEditLibrarySheet, { props: baseProps });
    // name is already 'Computer Science' — no change
    await wrapper.find('form').trigger('submit');
    expect(mockUpdateLibrary).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('calls updateLibrary with correct path/body and emits saved on success', async () => {
    const updatedLibrary = {
      id: 'lib-1',
      name: 'Data Science',
      rootPath: '/srv/ds',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };
    mockUpdateLibrary.mockResolvedValueOnce({
      data: updatedLibrary,
      error: null,
      response: { status: 200 },
    });

    const wrapper = mount(AdminEditLibrarySheet, { props: baseProps });
    const input = wrapper.find('input');
    await input.setValue('Data Science');
    await wrapper.find('form').trigger('submit');
    await new Promise((r) => setTimeout(r, 0));

    expect(mockUpdateLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: 'lib-1' },
        body: { name: 'Data Science' },
      }),
    );
    expect(wrapper.emitted('saved')).toEqual([[updatedLibrary]]);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('emits update:open false on Cancel click', async () => {
    const wrapper = mount(AdminEditLibrarySheet, { props: baseProps });
    const buttons = wrapper.findAll('button');
    const cancelBtn = buttons.find((b) => b.text() === 'Cancel');
    expect(cancelBtn).toBeDefined();
    await cancelBtn!.trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });
});
