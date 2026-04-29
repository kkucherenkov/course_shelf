import type { Meta, StoryObj } from '@storybook/vue3';

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

const meta: Meta<typeof AppScanProgress> = {
  title: 'Domain/ScanProgress/AppScanProgress',
  component: AppScanProgress,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['running', 'success', 'failed'],
    },
    percent: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    onCancel: { action: 'cancel' },
    'onErrors-clicked': { action: 'errors-clicked' },
  },
  args: {
    status: 'running',
    courseName: 'Computer Science',
    percent: 59,
    elapsedTime: '00:04:18',
    scanned: 1247,
    added: 38,
    updated: 7,
    errors: 2,
    currentFile: '/srv/courses/cs/distributed-systems/04-consensus/12-quorum-reads.mp4',
    ...i18nProps,
  },
  render: (args) => ({
    components: { AppScanProgress },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 640px; padding: var(--space-4);"><AppScanProgress v-bind="args" /></div>`,
  }),
};

export default meta;

type Story = StoryObj<typeof AppScanProgress>;

/** Running scan with current file path and 2 errors. */
export const Running: Story = {};

/** Running scan with current file path and no errors — only Cancel button is shown. */
export const RunningNoErrors: Story = {
  args: {
    errors: 0,
    errorsLabel: '0 errors',
  },
};

/** Completed scan, no errors. */
export const Success: Story = {
  args: {
    status: 'success',
    percent: 100,
    elapsedTime: '00:08:42',
    scanned: 2104,
    added: 45,
    updated: 12,
    errors: 0,
    errorsLabel: '0 errors',
    currentFile: undefined,
  },
};

/** Completed scan with 3 errors — errors button shown after completion. */
export const SuccessWithErrors: Story = {
  args: {
    status: 'success',
    percent: 100,
    elapsedTime: '00:08:42',
    scanned: 2104,
    added: 45,
    updated: 12,
    errors: 3,
    errorsLabel: '3 errors',
    currentFile: undefined,
  },
};

/** Failed scan with 5 errors — bar coloured in error accent. */
export const Failed: Story = {
  args: {
    status: 'failed',
    percent: 37,
    elapsedTime: '00:03:11',
    scanned: 780,
    added: 20,
    updated: 4,
    errors: 5,
    errorsLabel: '5 errors',
    currentFile: undefined,
  },
};

/** All three states side by side for quick visual comparison. */
export const AllStates: Story = {
  render: () => ({
    components: { AppScanProgress },
    setup() {
      const running = {
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
        errorsLabel: '2 errors',
      };

      const success = {
        status: 'success' as const,
        courseName: 'Computer Science',
        percent: 100,
        elapsedTime: '00:08:42',
        scanned: 2104,
        added: 45,
        updated: 12,
        errors: 0,
        ...i18nProps,
        errorsLabel: '0 errors',
      };

      const failed = {
        status: 'failed' as const,
        courseName: 'Computer Science',
        percent: 37,
        elapsedTime: '00:03:11',
        scanned: 780,
        added: 20,
        updated: 4,
        errors: 5,
        ...i18nProps,
        errorsLabel: '5 errors',
      };

      return { running, success, failed };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 640px; padding: var(--space-4);">
        <AppScanProgress v-bind="running" />
        <AppScanProgress v-bind="success" />
        <AppScanProgress v-bind="failed" />
      </div>
    `,
  }),
};
