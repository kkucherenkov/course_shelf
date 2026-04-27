import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import AppTab from '../AppTab/AppTab.vue';
import AppTabs from './AppTabs.vue';

// Helper: a simple wrapper that wires up AppTabs + multiple AppTab children.
// We read state by inspecting the reactive ref on wrapper.vm rather than
// calling findComponent(AppTabs) — generic SFCs are not compatible with the
// FindComponentSelector overload in vue-test-utils' type system.
function makeWrapper(initialValue: string) {
  return defineComponent({
    components: { AppTabs, AppTab },
    setup() {
      const active = ref(initialValue);
      return { active };
    },
    template: `
      <AppTabs v-model="active" label="Test tabs">
        <AppTab value="a" label="Tab A" />
        <AppTab value="b" label="Tab B" />
        <AppTab value="c" label="Tab C" />
      </AppTabs>
    `,
  });
}

describe('AppTabs + AppTab', () => {
  // --- ARIA structure ---

  it('renders a [role="tablist"] element', () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true);
  });

  it('sets aria-label on the tablist when label is provided', () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe('Test tabs');
  });

  it('renders tab buttons with role="tab"', () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(3);
  });

  it('sets aria-selected="true" on the active tab', () => {
    const W = makeWrapper('b');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs[0]!.attributes('aria-selected')).toBe('false');
    expect(tabs[1]!.attributes('aria-selected')).toBe('true');
    expect(tabs[2]!.attributes('aria-selected')).toBe('false');
  });

  it('sets tabindex=0 on the selected tab, -1 on others', () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs[0]!.attributes('tabindex')).toBe('0');
    expect(tabs[1]!.attributes('tabindex')).toBe('-1');
    expect(tabs[2]!.attributes('tabindex')).toBe('-1');
  });

  // --- click selection ---

  it('updates modelValue when a tab is clicked', async () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[2]!.trigger('click');
    expect((wrapper.vm as { active: string }).active).toBe('c');
  });

  it('applies app-tab--selected class on the active tab', () => {
    const W = makeWrapper('b');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('.app-tab');
    expect(tabs[0]!.classes()).not.toContain('app-tab--selected');
    expect(tabs[1]!.classes()).toContain('app-tab--selected');
  });

  // --- keyboard: arrow-right ---

  it('shifts selection to the right tab on ArrowRight key', async () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    // ArrowRight on the first tab — should advance to second
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' });
    expect((wrapper.vm as { active: string }).active).toBe('b');
  });

  // --- keyboard: Enter / Space ---

  it('activates tab on Enter key', async () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[1]!.trigger('keydown', { key: 'Enter' });
    expect((wrapper.vm as { active: string }).active).toBe('b');
  });

  it('activates tab on Space key', async () => {
    const W = makeWrapper('a');
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[2]!.trigger('keydown', { key: ' ' });
    expect((wrapper.vm as { active: string }).active).toBe('c');
  });

  // --- AppTab outside AppTabs throws ---

  it('throws when AppTab is used outside AppTabs', () => {
    expect(() => mount(AppTab, { props: { value: 'x' } })).toThrow(
      'AppTab must be used inside AppTabs',
    );
  });

  // --- numeric value type ---

  it('works with numeric tab values', async () => {
    const W = defineComponent({
      components: { AppTabs, AppTab },
      setup() {
        const active = ref<number>(1);
        return { active };
      },
      template: `
        <AppTabs v-model="active">
          <AppTab :value="1" label="One" />
          <AppTab :value="2" label="Two" />
        </AppTabs>
      `,
    });
    const wrapper = mount(W);
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs[0]!.attributes('aria-selected')).toBe('true');
    await tabs[1]!.trigger('click');
    expect((wrapper.vm as { active: number }).active).toBe(2);
  });
});
