import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppScanProgress from './AppScanProgress.vue';

const i18nProps = {
  scanningLabel: 'Scanning',
  successLabel: 'Scan complete',
  failedLabel: 'Scan failed',
  cancelLabel: 'Cancel',
  errorsLabel: '2 errors',
  statScannedLabel: 'Scanned',
  statAddedLabel: 'Added',
  statUpdatedLabel: 'Updated',
  statErrorsLabel: 'Errors',
};

const baseRunning = {
  status: 'running' as const,
  courseName: 'Computer Science',
  percent: 59,
  elapsedTime: '00:04:18',
  scanned: 1247,
  added: 38,
  updated: 7,
  errors: 2,
  currentFile: '/srv/courses/cs/distributed-systems/04-consensus/12-quorum-reads.mp4',
  ...i18nProps,
};

const baseRunningNoErrors = {
  ...baseRunning,
  errors: 0,
  errorsLabel: '0 errors',
};

const baseSuccess = {
  ...i18nProps,
  status: 'success' as const,
  courseName: 'Computer Science',
  percent: 100,
  elapsedTime: '00:08:42',
  scanned: 2104,
  added: 45,
  updated: 12,
  errors: 0,
  errorsLabel: '0 errors',
};

const baseSuccessWithErrors = {
  ...baseSuccess,
  errors: 3,
  errorsLabel: '3 errors',
};

const baseFailed = {
  ...i18nProps,
  status: 'failed' as const,
  courseName: 'Computer Science',
  percent: 37,
  elapsedTime: '00:03:11',
  scanned: 780,
  added: 20,
  updated: 4,
  errors: 5,
  errorsLabel: '5 errors',
};

// ---- Snapshot tests ----

describe('AppScanProgress snapshots', () => {
  it('Running (with current file, errors=2)', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('RunningNoErrors (with current file, errors=0)', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunningNoErrors });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Success (errors=0)', () => {
    const wrapper = mount(AppScanProgress, { props: baseSuccess });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('SuccessWithErrors (errors=3)', () => {
    const wrapper = mount(AppScanProgress, { props: baseSuccessWithErrors });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Failed (errors=5)', () => {
    const wrapper = mount(AppScanProgress, { props: baseFailed });
    expect(wrapper.html()).toMatchSnapshot();
  });
});

// ---- Event tests ----

describe('AppScanProgress events', () => {
  it('emits cancel once when cancel button is clicked', async () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    const btn = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
    expect(btn).toBeDefined();
    await btn!.trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('emits errors-clicked once when errors button is clicked', async () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    const btn = wrapper.findAll('button').find((b) => b.text() === '2 errors');
    expect(btn).toBeDefined();
    await btn!.trigger('click');
    expect(wrapper.emitted('errors-clicked')).toHaveLength(1);
  });
});

// ---- Conditional rendering ----

describe('AppScanProgress conditional rendering', () => {
  it('cancel button is NOT rendered when status !== running', () => {
    const successWrapper = mount(AppScanProgress, { props: baseSuccess });
    const cancelBtnSuccess = successWrapper.findAll('button').find((b) => b.text() === 'Cancel');
    expect(cancelBtnSuccess).toBeUndefined();

    const failedWrapper = mount(AppScanProgress, { props: baseFailed });
    const cancelBtnFailed = failedWrapper.findAll('button').find((b) => b.text() === 'Cancel');
    expect(cancelBtnFailed).toBeUndefined();
  });

  it('errors button is NOT rendered when errors === 0', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunningNoErrors });
    const errorsBtns = wrapper
      .findAll('button')
      .filter((b) => b.classes('app-scan-progress__btn--errors'));
    expect(errorsBtns).toHaveLength(0);
  });

  it('current-file line is shown when status=running and currentFile is set', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    const el = wrapper.find('.app-scan-progress__current-file');
    expect(el.exists()).toBe(true);
    expect(el.text()).toBe(baseRunning.currentFile);
    expect(el.attributes('title')).toBe(baseRunning.currentFile);
  });

  it('current-file line is NOT shown when status=success', () => {
    const wrapper = mount(AppScanProgress, { props: baseSuccess });
    expect(wrapper.find('.app-scan-progress__current-file').exists()).toBe(false);
  });

  it('current-file line is NOT shown when status=failed', () => {
    const wrapper = mount(AppScanProgress, { props: baseFailed });
    expect(wrapper.find('.app-scan-progress__current-file').exists()).toBe(false);
  });

  it('current-file line is NOT shown when status=running but currentFile is not set', () => {
    const wrapper = mount(AppScanProgress, {
      props: { ...baseRunningNoErrors, currentFile: undefined },
    });
    expect(wrapper.find('.app-scan-progress__current-file').exists()).toBe(false);
  });
});

// ---- Status-driven styles / structure ----

describe('AppScanProgress status classes', () => {
  it('applies --running modifier to root when status=running', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    expect(wrapper.find('.app-scan-progress--running').exists()).toBe(true);
  });

  it('applies --success modifier to root when status=success', () => {
    const wrapper = mount(AppScanProgress, { props: baseSuccess });
    expect(wrapper.find('.app-scan-progress--success').exists()).toBe(true);
  });

  it('applies --failed modifier to root when status=failed', () => {
    const wrapper = mount(AppScanProgress, { props: baseFailed });
    expect(wrapper.find('.app-scan-progress--failed').exists()).toBe(true);
  });

  it('errors stat number has error colour class when errors > 0', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    const statNums = wrapper.findAll('.app-scan-progress__stat-num');
    // Last stat num is the errors one
    const errorsNum = statNums.at(-1);
    expect(errorsNum?.classes()).toContain('app-scan-progress__stat-num--error');
  });

  it('errors stat number has no error colour class when errors === 0', () => {
    const wrapper = mount(AppScanProgress, { props: baseSuccess });
    const statNums = wrapper.findAll('.app-scan-progress__stat-num');
    const errorsNum = statNums.at(-1);
    expect(errorsNum?.classes()).not.toContain('app-scan-progress__stat-num--error');
  });

  it('bar-fill has --failed modifier when status=failed', () => {
    const wrapper = mount(AppScanProgress, { props: baseFailed });
    expect(wrapper.find('.app-scan-progress__bar-fill--failed').exists()).toBe(true);
  });

  it('bar-fill has no --failed modifier when status=running', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    expect(wrapper.find('.app-scan-progress__bar-fill--failed').exists()).toBe(false);
  });

  it('header shows the scanning label when status=running', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    expect(wrapper.find('.app-scan-progress__title').text()).toContain('Scanning');
  });

  it('header shows the success label when status=success', () => {
    const wrapper = mount(AppScanProgress, { props: baseSuccess });
    expect(wrapper.find('.app-scan-progress__title').text()).toContain('Scan complete');
  });

  it('header shows the failed label when status=failed', () => {
    const wrapper = mount(AppScanProgress, { props: baseFailed });
    expect(wrapper.find('.app-scan-progress__title').text()).toContain('Scan failed');
  });

  it('meta shows percent and elapsed time', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    const meta = wrapper.find('.app-scan-progress__meta').text();
    expect(meta).toContain('59%');
    expect(meta).toContain('00:04:18');
  });

  it('four stat tiles are always rendered', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    expect(wrapper.findAll('.app-scan-progress__stat')).toHaveLength(4);
  });

  it('progress bar fills to percent value on running', () => {
    const wrapper = mount(AppScanProgress, { props: baseRunning });
    expect(wrapper.find('.app-scan-progress__bar-fill').attributes('style')).toContain('59%');
  });

  it('progress bar fills to 100% on failed (full-error fill)', () => {
    const wrapper = mount(AppScanProgress, { props: baseFailed });
    expect(wrapper.find('.app-scan-progress__bar-fill').attributes('style')).toContain('100%');
  });
});
