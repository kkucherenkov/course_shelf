import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import AppRadio from './AppRadio.vue';
import AppRadioGroup from '../AppRadioGroup/AppRadioGroup.vue';

/**
 * Helper: mount a full group with three options.
 * Returns the wrapper (root = AppRadioGroup) and a reactive `selected` ref.
 */
function mountGroup(initialValue = 'a') {
  const selected = ref(initialValue);

  const wrapper = mount(
    defineComponent({
      components: { AppRadioGroup, AppRadio },
      setup() {
        return { selected };
      },
      template: `
        <AppRadioGroup v-model="selected" name="fruit" label="Pick a fruit">
          <AppRadio value="a" label="Apple" />
          <AppRadio value="b" label="Banana" />
          <AppRadio value="c" label="Cherry" />
        </AppRadioGroup>
      `,
    }),
  );

  return { wrapper, selected };
}

describe('AppRadio', () => {
  it('throws when used outside AppRadioGroup', () => {
    expect(() => mount(AppRadio, { props: { value: 'x' } })).toThrow(
      '[AppRadio] must be used inside <AppRadioGroup>.',
    );
  });
});

describe('AppRadioGroup + AppRadio integration', () => {
  it('renders role="radiogroup" with aria-label', () => {
    const { wrapper } = mountGroup();
    expect(wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe('Pick a fruit');
  });

  it('renders role="radio" buttons for each option', () => {
    const { wrapper } = mountGroup();
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(3);
  });

  it('marks the current selection as aria-checked="true"', () => {
    const { wrapper } = mountGroup('b');
    const radios = wrapper.findAll('[role="radio"]');

    expect(radios[0]!.attributes('aria-checked')).toBe('false');

    expect(radios[1]!.attributes('aria-checked')).toBe('true');

    expect(radios[2]!.attributes('aria-checked')).toBe('false');
  });

  it('only the checked radio has tabindex="0"; others are -1', () => {
    const { wrapper } = mountGroup('a');
    const radios = wrapper.findAll('[role="radio"]');

    expect(radios[0]!.attributes('tabindex')).toBe('0');

    expect(radios[1]!.attributes('tabindex')).toBe('-1');

    expect(radios[2]!.attributes('tabindex')).toBe('-1');
  });

  it('clicking a radio updates the group modelValue', async () => {
    const { wrapper, selected } = mountGroup('a');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[1]!.trigger('click');
    expect(selected.value).toBe('b');
  });

  it('clicking an already-selected radio does not change value', async () => {
    const { wrapper, selected } = mountGroup('a');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[0]!.trigger('click');
    // Value should remain 'a' — no change expected.
    expect(selected.value).toBe('a');
  });

  it('renders the dot only on the checked radio', () => {
    const { wrapper } = mountGroup('b');
    const labels = wrapper.findAll('.app-radio');

    expect(labels[0]!.find('.app-radio__dot').exists()).toBe(false);

    expect(labels[1]!.find('.app-radio__dot').exists()).toBe(true);

    expect(labels[2]!.find('.app-radio__dot').exists()).toBe(false);
  });

  it('Space keydown selects the focused radio', async () => {
    const { wrapper, selected } = mountGroup('a');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[1]!.trigger('keydown', { key: ' ' });
    expect(selected.value).toBe('b');
  });

  it('Enter keydown selects the focused radio', async () => {
    const { wrapper, selected } = mountGroup('a');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[2]!.trigger('keydown', { key: 'Enter' });
    expect(selected.value).toBe('c');
  });

  it('ArrowDown moves to the next radio and selects it', async () => {
    const { wrapper, selected } = mountGroup('a');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[0]!.trigger('keydown', { key: 'ArrowDown' });
    expect(selected.value).toBe('b');
  });

  it('ArrowRight moves to the next radio and selects it', async () => {
    const { wrapper, selected } = mountGroup('b');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[1]!.trigger('keydown', { key: 'ArrowRight' });
    expect(selected.value).toBe('c');
  });

  it('ArrowUp moves to the previous radio and selects it', async () => {
    const { wrapper, selected } = mountGroup('b');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[1]!.trigger('keydown', { key: 'ArrowUp' });
    expect(selected.value).toBe('a');
  });

  it('ArrowLeft moves to the previous radio and selects it', async () => {
    const { wrapper, selected } = mountGroup('c');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[2]!.trigger('keydown', { key: 'ArrowLeft' });
    expect(selected.value).toBe('b');
  });

  it('ArrowDown wraps around from last to first', async () => {
    const { wrapper, selected } = mountGroup('c');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[2]!.trigger('keydown', { key: 'ArrowDown' });
    expect(selected.value).toBe('a');
  });

  it('ArrowUp wraps around from first to last', async () => {
    const { wrapper, selected } = mountGroup('a');
    const radios = wrapper.findAll('[role="radio"]');

    await radios[0]!.trigger('keydown', { key: 'ArrowUp' });
    expect(selected.value).toBe('c');
  });

  it('does not select when individual radio is disabled', async () => {
    const selected = ref('a');

    const wrapper = mount(
      defineComponent({
        components: { AppRadioGroup, AppRadio },
        setup() {
          return { selected };
        },
        template: `
          <AppRadioGroup v-model="selected" name="fruit">
            <AppRadio value="a" label="Apple" />
            <AppRadio value="b" label="Banana" :disabled="true" />
          </AppRadioGroup>
        `,
      }),
    );

    const radios = wrapper.findAll('[role="radio"]');

    await radios[1]!.trigger('click');
    expect(selected.value).toBe('a');
  });

  it('does not select when group is disabled', async () => {
    const selected = ref('a');

    const wrapper = mount(
      defineComponent({
        components: { AppRadioGroup, AppRadio },
        setup() {
          return { selected };
        },
        template: `
          <AppRadioGroup v-model="selected" name="fruit" :disabled="true">
            <AppRadio value="a" label="Apple" />
            <AppRadio value="b" label="Banana" />
          </AppRadioGroup>
        `,
      }),
    );

    const radios = wrapper.findAll('[role="radio"]');

    await radios[1]!.trigger('click');
    expect(selected.value).toBe('a');
  });

  it('applies --disabled modifier when group is disabled', () => {
    const wrapper = mount(
      defineComponent({
        components: { AppRadioGroup, AppRadio },
        template: `
          <AppRadioGroup model-value="a" name="test" :disabled="true">
            <AppRadio value="a" label="A" />
          </AppRadioGroup>
        `,
      }),
    );
    expect(wrapper.find('.app-radio--disabled').exists()).toBe(true);
  });
});
