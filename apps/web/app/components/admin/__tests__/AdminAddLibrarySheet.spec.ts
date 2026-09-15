/**
 * Spec for AdminAddLibrarySheet component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminAddLibrarySheet from '../AdminAddLibrarySheet.vue';

// Mock @app/api-client-ts so no real HTTP occurs. `useLibraries.ts`'s
// `registerLibraryRequest` — which the component now calls instead of
// `registerLibrary` directly — imports both of these itself.
const mockRegisterLibrary = vi.fn();
const mockListLibraries = vi.fn();
vi.mock('@app/api-client-ts', () => ({
  registerLibrary: (...args: unknown[]) => mockRegisterLibrary(...args),
  listLibraries: (...args: unknown[]) => mockListLibraries(...args),
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
  IconCS: {
    name: 'IconCS',
    props: ['name', 'size'],
    template: '<svg class="stub-icon" :data-name="name" />',
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
  errorPathNotAbsolute: 'Enter an absolute path — it has to start with /.',
  errorRegister: 'Could not register the library. The server gave no reason — try again.',
};

/** Fills name + path and submits; returns after the microtask queue drains. */
async function submitWith(
  wrapper: ReturnType<typeof mount>,
  name: string,
  path: string,
): Promise<void> {
  const inputs = wrapper.findAll('input');
  const nameInput = inputs.at(0);
  const pathInput = inputs.at(1);
  if (!nameInput || !pathInput) throw new Error('Expected two inputs');
  await nameInput.setValue(name);
  await pathInput.setValue(path);
  await wrapper.find('form').trigger('submit');
  await new Promise((r) => setTimeout(r, 0));
}

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

  it('rejects a relative path without issuing a request', async () => {
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });

    await submitWith(wrapper, 'CS', 'volume1/courses');

    expect(mockRegisterLibrary).not.toHaveBeenCalled();
    expect(wrapper.find('.stub-banner').text()).toContain('absolute path');
    expect(wrapper.emitted('registered')).toBeFalsy();
  });

  it('strips the zero-width characters a pasted path carries', async () => {
    mockRegisterLibrary.mockResolvedValueOnce({
      data: { id: 'lib-new', name: 'CS', rootPath: '/srv/cs', createdAt: '', updatedAt: '' },
      error: null,
      response: { status: 201 },
    });
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });

    await submitWith(wrapper, 'CS', String.fromCodePoint(0x20_0b) + ' /srv/cs');

    expect(mockRegisterLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ body: { name: 'CS', rootPath: '/srv/cs' } }),
    );
  });

  it("shows the server's problem detail rather than a canned sentence", async () => {
    mockRegisterLibrary.mockResolvedValueOnce({
      data: undefined,
      error: {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'request/body/name must NOT have more than 200 characters',
      },
      response: { status: 400 },
    });
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });

    await submitWith(wrapper, 'CS', '/srv/cs');

    const banner = wrapper.find('.stub-banner').text();
    expect(banner).toContain('must NOT have more than 200 characters');
    expect(banner).not.toContain(baseProps.errorRegister);
  });

  it('falls back to the generic message only when the server explained nothing', async () => {
    mockRegisterLibrary.mockResolvedValueOnce({
      data: undefined,
      error: {},
      response: { status: 502 },
    });
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });

    await submitWith(wrapper, 'CS', '/srv/cs');

    expect(wrapper.find('.stub-banner').text()).toContain(baseProps.errorRegister);
  });

  it('matches snapshot', () => {
    const wrapper = mount(AdminAddLibrarySheet, { props: baseProps });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
