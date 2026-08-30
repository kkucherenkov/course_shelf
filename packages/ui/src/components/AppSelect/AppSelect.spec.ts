import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref, type PropType } from 'vue';

import AppField from '../AppField/AppField.vue';

import AppSelect, { type AppSelectOption } from './AppSelect.vue';

// AppSelect is built on a native <select> so there are no Nuxt UI internals
// to stub — happy-dom provides HTMLSelectElement out of the box.

const FRUITS: readonly AppSelectOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry', disabled: true },
] as const;

const SIZES = ['sm', 'md', 'lg'] as const;

describe('AppSelect', () => {
  it('renders a native select with all options', () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: null, options: FRUITS },
    });
    const options = wrapper.findAll('option');
    // No placeholder → exactly one option per item.
    expect(options).toHaveLength(FRUITS.length);
    expect(options.map((o) => o.attributes('value'))).toEqual(['apple', 'banana', 'cherry']);
  });

  it('shows the placeholder option when modelValue is null and placeholder is set', () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: null,
        options: FRUITS,
        placeholder: 'Pick a fruit',
      },
    });
    const placeholder = wrapper.find('option[hidden]');
    expect(placeholder.exists()).toBe(true);
    expect(placeholder.text()).toBe('Pick a fruit');
    // The placeholder option must be disabled so the user can't "re-select" it.
    expect(placeholder.attributes('disabled')).toBeDefined();
  });

  it('omits the placeholder option entirely when no placeholder prop is passed', () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: null, options: FRUITS },
    });
    expect(wrapper.find('option[hidden]').exists()).toBe(false);
  });

  it('reflects modelValue in the underlying <select>', () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: 'banana', options: FRUITS },
    });
    const select = wrapper.find('select').element as HTMLSelectElement;
    expect(select.value).toBe('banana');
  });

  it('emits update:modelValue with the new id when the selection changes', async () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: 'apple', options: FRUITS },
    });
    const select = wrapper.find('select');
    await select.setValue('banana');
    const events = wrapper.emitted('update:modelValue');
    expect(events).toHaveLength(1);
    expect(events?.[0]?.[0]).toBe('banana');
  });

  it('emits for a real option whose id is "" when no placeholder is configured', async () => {
    // Regression: apps/web's browse filters use '' as the "no filter" /
    // "all libraries" option id, with no `placeholder` prop. The sentinel
    // guard must not swallow that legitimate selection.
    const options = [{ id: '', label: 'All libraries' }, ...FRUITS];
    const wrapper = mount(AppSelect, {
      props: { modelValue: 'apple', options },
    });
    const select = wrapper.find('select');
    await select.setValue('');
    const events = wrapper.emitted('update:modelValue');
    expect(events).toHaveLength(1);
    expect(events?.[0]?.[0]).toBe('');
  });

  it('does not emit when the change event reports the placeholder sentinel', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: null,
        options: FRUITS,
        placeholder: 'Pick…',
      },
    });
    // happy-dom will allow setting `select.value = ''` but nothing real
    // happened; emulate a change carrying the placeholder sentinel.
    const select = wrapper.find('select');
    (select.element as HTMLSelectElement).value = '';
    await select.trigger('change');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('marks disabled options with the disabled attribute', () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: null, options: FRUITS },
    });
    // Cherry is disabled in the fixture.
    const cherry = wrapper.findAll('option').find((o) => o.attributes('value') === 'cherry');
    expect(cherry?.attributes('disabled')).toBeDefined();
  });

  it('blocks interaction when disabled=true', async () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: 'apple', options: FRUITS, disabled: true },
    });
    const select = wrapper.find('select');
    expect(select.attributes('disabled')).toBeDefined();
    expect(select.attributes('aria-disabled')).toBe('true');

    // Even if a change event somehow reached the control, the handler should
    // refuse to emit.
    (select.element as HTMLSelectElement).value = 'banana';
    await select.trigger('change');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    expect(wrapper.find('.app-select--disabled').exists()).toBe(true);
  });

  it.each(SIZES)('applies the size=%s modifier class', (size) => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: null, options: FRUITS, size },
    });
    expect(wrapper.find(`.app-select--${size}`).exists()).toBe(true);
  });

  it('defaults to size=md', () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: null, options: FRUITS },
    });
    expect(wrapper.find('.app-select--md').exists()).toBe(true);
  });

  it('forwards parent $attrs (id, aria-describedby, aria-invalid, aria-required) onto the <select>', () => {
    const wrapper = mount(AppSelect, {
      attrs: {
        id: 'fruit-1',
        'aria-describedby': 'fruit-1-desc',
        'aria-invalid': 'true',
        'aria-required': 'true',
      },
      props: { modelValue: null, options: FRUITS },
    });
    const select = wrapper.find('select');
    expect(select.attributes('id')).toBe('fruit-1');
    expect(select.attributes('aria-describedby')).toBe('fruit-1-desc');
    expect(select.attributes('aria-invalid')).toBe('true');
    expect(select.attributes('aria-required')).toBe('true');
  });

  it('composes cleanly inside AppField — slot attrs land on the <select>', async () => {
    const Harness = defineComponent({
      props: { options: { type: Array as PropType<readonly AppSelectOption[]>, required: true } },
      setup(innerProps) {
        const value = ref<string | null>(null);
        return () =>
          h(
            AppField,
            { label: 'Fruit', error: 'Required' },
            {
              default: (slotProps: Record<string, unknown>) =>
                h(AppSelect, {
                  ...slotProps,
                  modelValue: value.value,
                  options: innerProps.options,
                  placeholder: 'Pick…',
                  'onUpdate:modelValue': (next: string) => {
                    value.value = next;
                  },
                }),
            },
          );
      },
    });

    const wrapper = mount(Harness, { props: { options: FRUITS } });
    const select = wrapper.find('select');
    // aria-invalid is set because AppField.error is truthy.
    expect(select.attributes('aria-invalid')).toBe('true');
    // aria-describedby points at the error node.
    const errorId = wrapper.find('.app-field__error').attributes('id');
    expect(errorId).toBeTruthy();
    expect(select.attributes('aria-describedby')).toBe(errorId);

    // Changing the select value bubbles via v-model into the parent ref.
    await select.setValue('apple');
    expect(wrapper.vm.$refs).toBeDefined();
    expect((select.element as HTMLSelectElement).value).toBe('apple');
  });
});
