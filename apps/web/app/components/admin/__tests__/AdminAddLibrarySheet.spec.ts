/**
 * Spec for AdminAddLibrarySheet component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminAddLibrarySheet from '../AdminAddLibrarySheet.vue';

// Mock @app/api-client-ts so no real HTTP occurs
const mockRegisterLibrary = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  registerLibrary: (...args: unknown[]) => mockRegisterLibrary(...args),
  client: {},
}));

// Stub @app/ui components to keep tests simple
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

const baseProps = {
  title: 'Add library',
  nameLabel: 'Name',
  namePlaceholder: 'My Library',
  pathLabel: 'Path',
  pathPlaceholder: '/srv/courses',
  pathHint: 'Absolute path',
  submitLabel: 'Register',
  cancelLabel: 'Cancel',
  errorRequired: 'Both fields are required.',
  errorRegister: 'Could not register.',
};

describe('AdminAddLibrarySheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title', () => {
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });
    expect(wrapper.text()).toContain('Add library');
  });

  it('emits cancel when close button is clicked', async () => {
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });
    await wrapper.find('.adm-add-library-sheet__close').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('shows error banner when submitting empty form', async () => {
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.stub-banner').exists()).toBe(true);
    expect(wrapper.find('.stub-banner').text()).toContain('Both fields are required.');
  });

  it('calls registerLibrary with correct payload on submit', async () => {
    mockRegisterLibrary.mockResolvedValueOnce({
      data: { id: 'lib-new', name: 'CS', rootPath: '/srv/cs', createdAt: '', updatedAt: '' },
      error: null,
      response: { status: 201 },
    });

    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });

    // Fill in the inputs
    const inputs = wrapper.findAll('input');
    const nameInput = inputs.at(0);
    const pathInput = inputs.at(1);
    if (!nameInput || !pathInput) throw new Error('Expected two inputs');
    await nameInput.setValue('CS');
    await pathInput.setValue('/srv/cs');

    await wrapper.find('form').trigger('submit');
    await new Promise((r) => setTimeout(r, 0));

    expect(mockRegisterLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ body: { name: 'CS', rootPath: '/srv/cs' } }),
    );
    expect(wrapper.emitted('registered')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
