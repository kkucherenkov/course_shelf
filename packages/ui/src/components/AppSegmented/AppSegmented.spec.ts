import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import AppSegmentedItem from '../AppSegmentedItem/AppSegmentedItem.vue';
import AppSegmented from './AppSegmented.vue';

// We read state by inspecting wrapper.vm (reactive ref) rather than
// findComponent(AppSegmented) — generic SFCs are not compatible with the
// FindComponentSelector type in vue-test-utils.
function makeWrapper(initialValue: string) {
  return defineComponent({
    components: { AppSegmented, AppSegmentedItem },
    setup() {
      const active = ref(initialValue);
      return { active };
    },
    template: `
      <AppSegmented v-model="active" label="View mode">
        <AppSegmentedItem value="list" label="List" />
        <AppSegmentedItem value="grid" label="Grid" />
        <AppSegmentedItem value="compact" label="Compact" />
      </AppSegmented>
    `,
  });
}

describe('AppSegmented + AppSegmentedItem', () => {
  // --- ARIA structure ---

  it('renders a [role="radiogroup"] element', () => {
    const W = makeWrapper('list');
    const wrapper = mount(W);
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true);
  });

  it('sets aria-label on the radiogroup when label is provided', () => {
    const W = makeWrapper('list');
    const wrapper = mount(W);
    expect(wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe('View mode');
  });

  it('renders items with role="radio"', () => {
    const W = makeWrapper('list');
    const wrapper = mount(W);
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(3);
  });

  it('sets aria-checked="true" on the selected item', () => {
    const W = makeWrapper('grid');
    const wrapper = mount(W);
    const items = wrapper.findAll('[role="radio"]');
    expect(items[0]!.attributes('aria-checked')).toBe('false');
    expect(items[1]!.attributes('aria-checked')).toBe('true');
    expect(items[2]!.attributes('aria-checked')).toBe('false');
  });

  it('sets aria-checked="false" on all other items', () => {
    const W = makeWrapper('list');
    const wrapper = mount(W);
    const items = wrapper.findAll('[role="radio"]');
    expect(items[1]!.attributes('aria-checked')).toBe('false');
    expect(items[2]!.attributes('aria-checked')).toBe('false');
  });

  // --- click selection ---

  it('updates modelValue when an item is clicked', async () => {
    const W = makeWrapper('list');
    const wrapper = mount(W);
    const items = wrapper.findAll('[role="radio"]');
    await items[1]!.trigger('click');
    expect((wrapper.vm as { active: string }).active).toBe('grid');
  });

  it('applies app-segmented-item--selected class on the selected item', () => {
    const W = makeWrapper('compact');
    const wrapper = mount(W);
    const items = wrapper.findAll('.app-segmented-item');
    expect(items[0]!.classes()).not.toContain('app-segmented-item--selected');
    expect(items[1]!.classes()).not.toContain('app-segmented-item--selected');
    expect(items[2]!.classes()).toContain('app-segmented-item--selected');
  });

  it('clicking the already-selected item keeps it selected', async () => {
    const W = makeWrapper('list');
    const wrapper = mount(W);
    const items = wrapper.findAll('[role="radio"]');
    await items[0]!.trigger('click');
    expect((wrapper.vm as { active: string }).active).toBe('list');
    expect(items[0]!.attributes('aria-checked')).toBe('true');
  });

  // --- AppSegmentedItem outside AppSegmented throws ---

  it('throws when AppSegmentedItem is used outside AppSegmented', () => {
    expect(() => mount(AppSegmentedItem, { props: { value: 'x' } })).toThrow(
      'AppSegmentedItem must be used inside AppSegmented',
    );
  });

  // --- numeric values ---

  it('works with numeric values', async () => {
    const W = defineComponent({
      components: { AppSegmented, AppSegmentedItem },
      setup() {
        const active = ref<number>(1);
        return { active };
      },
      template: `
        <AppSegmented v-model="active">
          <AppSegmentedItem :value="1" label="One" />
          <AppSegmentedItem :value="2" label="Two" />
        </AppSegmented>
      `,
    });
    const wrapper = mount(W);
    const items = wrapper.findAll('[role="radio"]');
    expect(items[0]!.attributes('aria-checked')).toBe('true');
    await items[1]!.trigger('click');
    expect((wrapper.vm as { active: number }).active).toBe(2);
  });
});
