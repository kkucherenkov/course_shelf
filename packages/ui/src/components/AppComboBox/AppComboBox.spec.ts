import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppComboBox, { type ComboBoxOption } from './AppComboBox.vue';

const OPTIONS: ComboBoxOption[] = [
  { id: 'alice', label: 'Alice' },
  { id: 'bob', label: 'Bob' },
  { id: 'carol', label: 'Carol (unavailable)', disabled: true },
];

function baseProps(extra: Partial<InstanceType<typeof AppComboBox>['$props']> = {}) {
  return {
    modelValue: [] as string[],
    items: OPTIONS,
    searchTerm: '',
    ...extra,
  };
}

describe('AppComboBox', () => {
  // ── Rendering ──────────────────────────────────────────────────────────

  it('starts closed — no listbox until the input is focused', () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('false');
  });

  it('opens the listbox on focus and renders every item as an option', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    await wrapper.find('input').trigger('focus');

    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true');
    expect(wrapper.findAll('[role="option"]')).toHaveLength(OPTIONS.length);
  });

  // Regression: axe `aria-input-field-name` flags any role="listbox" with no
  // accessible name of its own — it isn't automatically named by the input
  // it belongs to.
  it('names the listbox via `listboxLabel`, defaulting to "Options"', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    await wrapper.find('input').trigger('focus');
    expect(wrapper.find('[role="listbox"]').attributes('aria-label')).toBe('Options');

    await wrapper.setProps({ listboxLabel: 'Instructors' });
    expect(wrapper.find('[role="listbox"]').attributes('aria-label')).toBe('Instructors');
  });

  it('renders a chip for every selected id, resolved against `items`', () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ modelValue: ['alice', 'bob'] }) });
    const chips = wrapper.findAll('.app-combo-box__chip-label');
    expect(chips.map((c) => c.text())).toEqual(['Alice', 'Bob']);
  });

  it('falls back to the raw id when a selected id has no matching item', () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ modelValue: ['ghost'] }) });
    expect(wrapper.find('.app-combo-box__chip-label').text()).toBe('ghost');
  });

  it('shows the loading status row instead of options when `loading` is true', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ loading: true }) });
    await wrapper.find('input').trigger('focus');

    expect(wrapper.find('.app-combo-box__status').exists()).toBe(true);
    expect(wrapper.find('[role="option"]').exists()).toBe(false);
  });

  // Regression: axe's aria-required-children rule flags a listbox whose only
  // child isn't option/group — a status row used to live *inside* the <ul
  // role="listbox">. It now renders as a sibling, and the listbox itself
  // only exists once there's an option to put in it.
  it('does not render the listbox element while loading or empty', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ loading: true }) });
    await wrapper.find('input').trigger('focus');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);

    await wrapper.setProps({ loading: false, items: [] });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    expect(wrapper.find('.app-combo-box__status').attributes('role')).toBe('status');
  });

  it('shows the no-results status row when items is empty and not loading', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ items: [] }) });
    await wrapper.find('input').trigger('focus');

    expect(wrapper.find('.app-combo-box__status').exists()).toBe(true);
    expect(wrapper.find('[role="option"]').exists()).toBe(false);
  });

  it('uses caller-supplied loading/no-results/remove labels over the English defaults', async () => {
    const wrapper = mount(AppComboBox, {
      props: baseProps({
        loading: true,
        loadingLabel: 'Загрузка…',
        modelValue: ['alice'],
        removeLabel: 'Убрать {name}',
      }),
    });
    await wrapper.find('input').trigger('focus');

    expect(wrapper.find('.app-combo-box__status').text()).toBe('Загрузка…');
    expect(wrapper.find('.app-combo-box__chip-remove').attributes('aria-label')).toBe(
      'Убрать Alice',
    );
  });

  // ── Selection: mouse ───────────────────────────────────────────────────

  it('clicking an unselected option emits update:modelValue with it appended', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ modelValue: ['alice'] }) });
    await wrapper.find('input').trigger('focus');

    await wrapper.findAll('[role="option"]')[1]!.trigger('click'); // Bob
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['alice', 'bob']);
  });

  it('clicking an already-selected option removes it (toggle off)', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ modelValue: ['alice', 'bob'] }) });
    await wrapper.find('input').trigger('focus');

    await wrapper.findAll('[role="option"]')[0]!.trigger('click'); // Alice
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['bob']);
  });

  it('clicking a disabled option does nothing', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    await wrapper.find('input').trigger('focus');

    await wrapper.findAll('[role="option"]')[2]!.trigger('click'); // Carol, disabled
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('mousedown on an option is prevented, so the input never loses focus to it', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    await wrapper.find('input').trigger('focus');

    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    wrapper.findAll('[role="option"]')[0]!.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('clicking a chip remove button removes just that id', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ modelValue: ['alice', 'bob'] }) });
    await wrapper.find('.app-combo-box__chip-remove').trigger('click');
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['bob']);
  });

  it('does not remove a chip when disabled', async () => {
    const wrapper = mount(AppComboBox, {
      props: baseProps({ modelValue: ['alice'], disabled: true }),
    });
    await wrapper.find('.app-combo-box__chip-remove').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  // ── Selection & navigation: keyboard ──────────────────────────────────

  it('typing emits update:searchTerm with the raw input value', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    await wrapper.find('input').setValue('ali');
    expect(wrapper.emitted('update:searchTerm')![0]![0]).toBe('ali');
  });

  it('ArrowDown opens the list and activates the first option; aria-activedescendant tracks it', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' });

    const active = wrapper.find('.app-combo-box__option--active');
    expect(active.exists()).toBe(true);
    expect(wrapper.find('input').attributes('aria-activedescendant')).toBe(active.attributes('id'));
  });

  it('ArrowDown/ArrowUp move the active option and clamp at the edges', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown' }); // open, index 0
    await input.trigger('keydown', { key: 'ArrowDown' }); // index 1
    expect(wrapper.findAll('[role="option"]')[1]!.classes()).toContain(
      'app-combo-box__option--active',
    );

    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'ArrowDown' }); // clamp at last (index 2)
    expect(wrapper.findAll('[role="option"]')[2]!.classes()).toContain(
      'app-combo-box__option--active',
    );

    await input.trigger('keydown', { key: 'ArrowUp' });
    expect(wrapper.findAll('[role="option"]')[1]!.classes()).toContain(
      'app-combo-box__option--active',
    );
  });

  it('Home/End jump the active option to the first/last item', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown' });

    await input.trigger('keydown', { key: 'End' });
    expect(wrapper.findAll('[role="option"]')[2]!.classes()).toContain(
      'app-combo-box__option--active',
    );

    await input.trigger('keydown', { key: 'Home' });
    expect(wrapper.findAll('[role="option"]')[0]!.classes()).toContain(
      'app-combo-box__option--active',
    );
  });

  it('Enter toggles the active option into modelValue', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown' }); // activates Alice (index 0)
    await input.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['alice']);
  });

  it('Enter on the active option does nothing when it is disabled', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'End' }); // Carol, disabled
    await input.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('Escape closes an open listbox', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps() });
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);

    await input.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  it('Backspace on an empty input removes the last selected chip', async () => {
    const wrapper = mount(AppComboBox, {
      props: baseProps({ modelValue: ['alice', 'bob'], searchTerm: '' }),
    });
    await wrapper.find('input').trigger('keydown', { key: 'Backspace' });
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['alice']);
  });

  it('Backspace does not remove a chip when the input has text', async () => {
    const wrapper = mount(AppComboBox, {
      props: baseProps({ modelValue: ['alice'], searchTerm: 'al' }),
    });
    await wrapper.find('input').trigger('keydown', { key: 'Backspace' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  // ── Disabled ────────────────────────────────────────────────────────────

  it('disables the input and blocks focus-to-open when `disabled`', async () => {
    const wrapper = mount(AppComboBox, { props: baseProps({ disabled: true }) });
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();

    await wrapper.find('input').trigger('focus');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  // ── AppField contract ────────────────────────────────────────────────────

  it('forwards parent $attrs (id, aria-describedby, aria-invalid, aria-required) onto the input', () => {
    const wrapper = mount(AppComboBox, {
      attrs: {
        id: 'instructors-1',
        'aria-describedby': 'instructors-1-desc',
        'aria-invalid': 'true',
        'aria-required': 'true',
      },
      props: baseProps(),
    });
    const input = wrapper.find('input');
    expect(input.attributes('id')).toBe('instructors-1');
    expect(input.attributes('aria-describedby')).toBe('instructors-1-desc');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-required')).toBe('true');
  });
});
