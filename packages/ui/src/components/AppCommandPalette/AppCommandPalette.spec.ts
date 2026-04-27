import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppCommandPalette from './AppCommandPalette.vue';
import type { Command } from './AppCommandPalette.vue';

// Stub the heavy AppDialog — we test AppCommandPalette logic in isolation.
// The stub renders a simple div so slot content is accessible.
const global = {
  stubs: {
    AppDialog: {
      props: ['open', 'title', 'size', 'dismissible'],
      emits: ['update:open'],
      template: `<div class="stub-dialog" v-if="open"><slot /></div>`,
    },
  },
} as const;

const COMMANDS: Command[] = [
  { id: 'home', label: 'Go home', description: 'Navigate to home', group: 'Navigation' },
  { id: 'settings', label: 'Open settings', icon: 'settings', group: 'Navigation' },
  { id: 'logout', label: 'Sign out', icon: 'logout', group: 'Account' },
  { id: 'search', label: 'Search files', icon: 'search' },
];

describe('AppCommandPalette', () => {
  it('renders all commands when no query', () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    const items = wrapper.findAll('.app-command-palette__item');
    expect(items).toHaveLength(COMMANDS.length);
  });

  it('filters commands by label substring', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    const input = wrapper.find('.app-command-palette__input');
    await input.setValue('home');

    const items = wrapper.findAll('.app-command-palette__item');
    expect(items).toHaveLength(1);
    expect(items[0]!.find('.app-command-palette__label').text()).toBe('Go home');
  });

  it('filters commands by description substring', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    const input = wrapper.find('.app-command-palette__input');
    await input.setValue('navigate');

    const items = wrapper.findAll('.app-command-palette__item');
    expect(items).toHaveLength(1);
    expect(items[0]!.find('.app-command-palette__label').text()).toBe('Go home');
  });

  it('shows "No commands match." when filter has no results', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    await wrapper.find('.app-command-palette__input').setValue('zzzznotfound');

    expect(wrapper.find('.app-command-palette__empty').exists()).toBe(true);
    expect(wrapper.find('.app-command-palette__empty').text()).toBe('No commands match.');
  });

  it('ArrowDown advances activeIndex — next item gets --active class', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    // Initial active is index 0
    const items = () => wrapper.findAll('.app-command-palette__item');
    expect(items()[0]!.classes()).toContain('app-command-palette__item--active');

    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowDown' });
    expect(items()[1]!.classes()).toContain('app-command-palette__item--active');
    expect(items()[0]!.classes()).not.toContain('app-command-palette__item--active');
  });

  it('ArrowUp retreats activeIndex', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    // Move to index 2 first
    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowDown' });

    const items = () => wrapper.findAll('.app-command-palette__item');
    expect(items()[2]!.classes()).toContain('app-command-palette__item--active');

    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowUp' });
    expect(items()[1]!.classes()).toContain('app-command-palette__item--active');
  });

  it('ArrowDown clamps at last item', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    // Advance past the end
    for (let i = 0; i < COMMANDS.length + 5; i++) {
      await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowDown' });
    }

    const items = wrapper.findAll('.app-command-palette__item');
    const lastItem = items.at(-1)!;
    expect(lastItem.classes()).toContain('app-command-palette__item--active');
  });

  it('ArrowUp clamps at index 0', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    // Already at 0, keep pressing up
    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowUp' });
    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowUp' });

    const items = wrapper.findAll('.app-command-palette__item');
    expect(items[0]!.classes()).toContain('app-command-palette__item--active');
  });

  it('Enter emits `select` with the active command and closes the dialog', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    // Move to second item
    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('select')).toHaveLength(1);
    expect((wrapper.emitted('select')![0] as [Command])[0].id).toBe(COMMANDS[1]!.id);

    expect(wrapper.emitted('update:open')).toHaveLength(1);
    expect((wrapper.emitted('update:open')![0] as [boolean])[0]).toBe(false);
  });

  it('Enter does nothing when list is empty', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    await wrapper.find('.app-command-palette__input').setValue('zzzznotfound');
    await wrapper.find('.app-command-palette').trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('select')).toBeFalsy();
    expect(wrapper.emitted('update:open')).toBeFalsy();
  });

  it('click on an item emits `select` and closes', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    await wrapper.findAll('.app-command-palette__item')[2]!.trigger('click');

    expect(wrapper.emitted('select')).toHaveLength(1);
    expect((wrapper.emitted('select')![0] as [Command])[0].id).toBe(COMMANDS[2]!.id);
    expect((wrapper.emitted('update:open')![0] as [boolean])[0]).toBe(false);
  });

  it('renders group headers', () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    const groups = wrapper.findAll('.app-command-palette__group');
    // Two distinct groups: Navigation, Account; one item has no group
    expect(groups.length).toBeGreaterThanOrEqual(2);
    const texts = groups.map((g) => g.text());
    expect(texts).toContain('Navigation');
    expect(texts).toContain('Account');
  });

  it('renders icon for commands that have one', () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    // 3 out of 4 commands have icons
    const icons = wrapper.findAll('.app-command-palette__icon');
    expect(icons.length).toBe(3);
  });

  it('resets query when re-opened', async () => {
    const wrapper = mount(AppCommandPalette, {
      global,
      props: { open: true, commands: COMMANDS },
    });

    await wrapper.find('.app-command-palette__input').setValue('home');
    expect((wrapper.find('.app-command-palette__input').element as HTMLInputElement).value).toBe(
      'home',
    );

    // Close then re-open
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await wrapper.vm.$nextTick();

    expect((wrapper.find('.app-command-palette__input').element as HTMLInputElement).value).toBe(
      '',
    );
  });
});
