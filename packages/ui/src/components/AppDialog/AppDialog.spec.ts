import { mount } from '@vue/test-utils';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';

import AppDialog from './AppDialog.vue';

// JSDOM does not implement HTMLDialogElement.showModal() or .close().
//
// Strategy: install functional stubs on HTMLElement.prototype before the
// suite runs so that the component's watcher (flush: 'post') can call them
// without throwing. Each test that wants to assert the call installs a fresh
// vi.fn() spy on the individual element after mounting.
//
// We store original references so they can be restored after the suite.
const _origShowModal = (HTMLElement.prototype as unknown as HTMLDialogElement).showModal;
const _origClose = (HTMLElement.prototype as unknown as HTMLDialogElement).close;

function installPrototypeStubs() {
  const proto = HTMLElement.prototype as unknown as HTMLDialogElement;

  if (!proto.showModal || typeof proto.showModal !== 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (proto as any).showModal = function (this: HTMLDialogElement) {
      (this as unknown as Record<string, unknown>)['open'] = true;
    };
  }

  if (!proto.close || !proto.close.toString().includes('open')) {
    const orig = proto.close;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (proto as any).close = function (this: HTMLDialogElement) {
      (this as unknown as Record<string, unknown>)['open'] = false;
      this.dispatchEvent(new Event('close'));
      if (orig) orig.call(this);
    };
  }
}

// Patch a specific dialog element with vi.fn() spies so callers can assert.
function stubDialogElement(el: HTMLDialogElement) {
  Object.defineProperty(el, 'open', { writable: true, configurable: true, value: false });

  el.showModal = vi.fn(function (this: HTMLDialogElement) {
    (this as unknown as Record<string, unknown>)['open'] = true;
  });

  el.close = vi.fn(function (this: HTMLDialogElement) {
    (this as unknown as Record<string, unknown>)['open'] = false;
    this.dispatchEvent(new Event('close'));
  });
}

const global = { stubs: { AppIconButton: true } } as const;

beforeAll(() => {
  installPrototypeStubs();
});

afterAll(() => {
  if (_origShowModal !== undefined) {
    (HTMLElement.prototype as unknown as HTMLDialogElement).showModal = _origShowModal;
  }
  if (_origClose !== undefined) {
    (HTMLElement.prototype as unknown as HTMLDialogElement).close = _origClose;
  }
});

describe('AppDialog', () => {
  it('calls showModal when `open` becomes true', async () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'Test dialog' },
      attachTo: document.body,
    });

    const dialog = wrapper.find('dialog').element as HTMLDialogElement;
    stubDialogElement(dialog);

    await wrapper.setProps({ open: true });
    // Flush post watcher
    await new Promise((r) => setTimeout(r, 0));

    expect(dialog.showModal).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('calls close() when `open` becomes false after being open', async () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'Test dialog' },
      attachTo: document.body,
    });

    const dialog = wrapper.find('dialog').element as HTMLDialogElement;
    stubDialogElement(dialog);

    await wrapper.setProps({ open: true });
    await new Promise((r) => setTimeout(r, 0));

    await wrapper.setProps({ open: false });
    await new Promise((r) => setTimeout(r, 0));

    expect(dialog.close).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('emits update:open=false when native `close` event fires (ESC simulation)', async () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: true, title: 'Test dialog' },
      attachTo: document.body,
    });

    await new Promise((r) => setTimeout(r, 0));

    // Simulate native ESC → browser fires 'close' on the dialog element
    const dialog = wrapper.find('dialog').element as HTMLDialogElement;
    dialog.dispatchEvent(new Event('close'));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:open')).toBeTruthy();
    expect(wrapper.emitted('update:open')![0]).toEqual([false]);

    wrapper.unmount();
  });

  it('emits update:open=false on backdrop click when dismissible', async () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: true, title: 'Test dialog', dismissible: true },
      attachTo: document.body,
    });

    await new Promise((r) => setTimeout(r, 0));

    const dialog = wrapper.find('dialog');
    // Simulate click whose target IS the dialog element (backdrop click pattern)
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: dialog.element });
    dialog.element.dispatchEvent(clickEvent);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:open')).toBeTruthy();
    expect(wrapper.emitted('update:open')![0]).toEqual([false]);

    wrapper.unmount();
  });

  it('does NOT emit update:open on backdrop click when dismissible=false', async () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: true, title: 'Test dialog', dismissible: false },
      attachTo: document.body,
    });

    await new Promise((r) => setTimeout(r, 0));

    const dialog = wrapper.find('dialog');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: dialog.element });
    dialog.element.dispatchEvent(clickEvent);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:open')).toBeFalsy();

    wrapper.unmount();
  });

  it('links title via aria-labelledby', () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'My Title' },
    });

    const dialog = wrapper.find('dialog');
    const labelledby = dialog.attributes('aria-labelledby');
    expect(labelledby).toBeTruthy();

    const titleEl = wrapper.find(`#${labelledby}`);
    expect(titleEl.exists()).toBe(true);
    expect(titleEl.text()).toBe('My Title');
  });

  it('sets aria-describedby when description is provided', () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'T', description: 'Some description' },
    });

    const dialog = wrapper.find('dialog');
    const describedby = dialog.attributes('aria-describedby');
    expect(describedby).toBeTruthy();

    const descEl = wrapper.find(`#${describedby}`);
    expect(descEl.exists()).toBe(true);
    expect(descEl.text()).toBe('Some description');
  });

  it('does NOT set aria-describedby when description is absent', () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'T' },
    });

    expect(wrapper.find('dialog').attributes('aria-describedby')).toBeUndefined();
  });

  it('does not render description paragraph when description is absent', () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'T' },
    });

    expect(wrapper.find('.app-dialog__description').exists()).toBe(false);
  });

  it('renders footer slot when provided', () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'T' },
      slots: { footer: '<button>OK</button>' },
    });

    expect(wrapper.find('.app-dialog__footer').exists()).toBe(true);
    expect(wrapper.find('.app-dialog__footer button').text()).toBe('OK');
  });

  it('does not render footer when footer slot is absent', () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'T' },
    });

    expect(wrapper.find('.app-dialog__footer').exists()).toBe(false);
  });

  it('applies size modifier class', () => {
    const wrapperSm = mount(AppDialog, { global, props: { open: false, title: 'T', size: 'sm' } });
    expect(wrapperSm.find('.app-dialog--sm').exists()).toBe(true);

    const wrapperMd = mount(AppDialog, { global, props: { open: false, title: 'T', size: 'md' } });
    expect(wrapperMd.find('.app-dialog--md').exists()).toBe(true);
  });

  it('hides close button when dismissible=false', () => {
    const wrapper = mount(AppDialog, {
      global,
      props: { open: false, title: 'T', dismissible: false },
    });

    expect(wrapper.find('.app-dialog__close').exists()).toBe(false);
  });
});
