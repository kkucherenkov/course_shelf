/**
 * Spec for AdminTranscriptionCard component.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { TranscriptionDto } from '@app/api-client-ts';
import AdminTranscriptionCard from '../AdminTranscriptionCard.vue';

// ── @app/ui stubs — keeps the test independent of the Nuxt UI build context ──
vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'variant', 'loading'],
    emits: ['click'],
    template: '<button class="app-button" @click="$emit(\'click\', $event)">{{ label }}</button>',
  },
  AppCheckbox: {
    name: 'AppCheckbox',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template:
      '<label class="app-checkbox"><button type="button" class="app-checkbox__box" @click="$emit(\'update:modelValue\', !modelValue)" />{{ label }}</label>',
  },
  AppProgressLinear: {
    name: 'AppProgressLinear',
    props: ['value', 'label'],
    template: '<div class="app-progress-linear" />',
  },
}));

const baseProps = {
  transcription: null as TranscriptionDto | null,
  title: 'Transcription',
  idleBody: 'Run whisper across every lesson.',
  forceLabel: 'Re-transcribe everything',
  startCta: 'Start transcription',
  cancelCta: 'Cancel',
  labelRunning: 'Running',
  labelSucceeded: 'Succeeded',
  labelFailed: 'Failed',
  labelCancelled: 'Cancelled',
  statSkipped: 'Skipped',
  statTranscribed: 'Transcribed',
  statFailed: 'Failed',
  statTotal: 'Total',
  errorsHeading: 'Errors',
};

function makeTranscription(overrides: Partial<TranscriptionDto>): TranscriptionDto {
  return {
    id: 'tr-1',
    libraryId: 'lib-1',
    status: 'running',
    force: false,
    startedAt: new Date(Date.now() - 60_000).toISOString(),
    lessonsTotal: 10,
    lessonsSkipped: 2,
    lessonsTranscribed: 3,
    lessonsFailed: 1,
    errors: [],
    ...overrides,
  };
}

describe('AdminTranscriptionCard', () => {
  it('idle (never run): shows the force checkbox and Start CTA, no Cancel', () => {
    const wrapper = mount(AdminTranscriptionCard, { props: baseProps });
    expect(wrapper.text()).toContain(baseProps.startCta);
    expect(wrapper.text()).toContain(baseProps.forceLabel);
    expect(wrapper.text()).not.toContain(baseProps.cancelCta);
    expect(wrapper.find('.adm-transcription-card__stats').exists()).toBe(false);
  });

  it('emits start with force=true when the checkbox is checked before clicking Start', async () => {
    const wrapper = mount(AdminTranscriptionCard, { props: baseProps });
    await wrapper.find('.app-checkbox__box').trigger('click');
    await wrapper.find('.app-button').trigger('click');
    expect(wrapper.emitted('start')).toEqual([[true]]);
  });

  it('emits start with force=false when the checkbox is left unchecked', async () => {
    const wrapper = mount(AdminTranscriptionCard, { props: baseProps });
    await wrapper.find('.app-button').trigger('click');
    expect(wrapper.emitted('start')).toEqual([[false]]);
  });

  it('running: shows Cancel and counters, no Start/checkbox', async () => {
    const wrapper = mount(AdminTranscriptionCard, {
      props: { ...baseProps, transcription: makeTranscription({ status: 'running' }) },
    });
    expect(wrapper.text()).toContain(baseProps.cancelCta);
    expect(wrapper.text()).not.toContain(baseProps.startCta);
    expect(wrapper.find('.adm-transcription-card__stats').exists()).toBe(true);
  });

  it('emits cancel when the Cancel button is clicked', async () => {
    const wrapper = mount(AdminTranscriptionCard, {
      props: { ...baseProps, transcription: makeTranscription({ status: 'running' }) },
    });
    await wrapper.find('.app-button').trigger('click');
    expect(wrapper.emitted('cancel')).toEqual([[]]);
  });

  it('succeeded: shows counters and Start CTA again (idle after a terminal run)', () => {
    const wrapper = mount(AdminTranscriptionCard, {
      props: {
        ...baseProps,
        transcription: makeTranscription({ status: 'succeeded', lessonsFailed: 0 }),
      },
    });
    expect(wrapper.text()).toContain(baseProps.startCta);
    expect(wrapper.text()).toContain(baseProps.labelSucceeded);
    expect(wrapper.find('.adm-transcription-card__stats').exists()).toBe(true);
  });

  it('shows counters against the total', () => {
    const wrapper = mount(AdminTranscriptionCard, {
      props: {
        ...baseProps,
        transcription: makeTranscription({
          lessonsSkipped: 4,
          lessonsTranscribed: 5,
          lessonsFailed: 1,
          lessonsTotal: 20,
        }),
      },
    });
    const nums = wrapper.findAll('.adm-transcription-card__stat-num').map((n) => n.text());
    expect(nums).toEqual(['4', '5', '1', '20']);
  });

  it('renders one row per TranscriptionErrorDto', () => {
    const wrapper = mount(AdminTranscriptionCard, {
      props: {
        ...baseProps,
        transcription: makeTranscription({
          status: 'failed',
          errors: [
            { lessonId: 'lesson-1', message: 'whisper crashed', code: 'whisper-failed' },
            { lessonId: 'lesson-2', message: 'audio extraction failed' },
          ],
        }),
      },
    });
    const rows = wrapper.findAll('.adm-transcription-card__error-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.text()).toContain('lesson-1');
    expect(rows[0]?.text()).toContain('whisper crashed');
    expect(rows[1]?.text()).toContain('audio extraction failed');
  });

  it('hides the errors section when there are no errors', () => {
    const wrapper = mount(AdminTranscriptionCard, {
      props: { ...baseProps, transcription: makeTranscription({ errors: [] }) },
    });
    expect(wrapper.find('.adm-transcription-card__errors').exists()).toBe(false);
  });
});
