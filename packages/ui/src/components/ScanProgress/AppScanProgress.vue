<script setup lang="ts">
  import { computed } from 'vue';

  export type ScanStatus = 'running' | 'success' | 'failed';

  const props = defineProps<{
    /** Current scan status — drives dot colour, header word and bar colour. */
    status: ScanStatus;
    /** Course name shown after the status word in the header. */
    courseName: string;
    /** 0–100; shown as `{n}%` in mono next to elapsed time. */
    percent: number;
    /** Pre-formatted elapsed time string, e.g. `'00:04:18'`. */
    elapsedTime: string;
    /** Total files scanned. */
    scanned: number;
    /** Files added to the library. */
    added: number;
    /** Files updated in the library. */
    updated: number;
    /** Files that produced errors. */
    errors: number;
    /** Absolute path of the file currently being scanned. Only shown when status === 'running'. */
    currentFile?: string;

    // i18n strings — consumer provides translated copies
    /** e.g. "Scanning" */
    scanningLabel: string;
    /** e.g. "Scan complete" */
    successLabel: string;
    /** e.g. "Scan failed" */
    failedLabel: string;
    /** e.g. "Cancel" */
    cancelLabel: string;
    /** e.g. "2 errors" — count already interpolated by consumer */
    errorsLabel: string;
    /** e.g. "Scanned" */
    statScannedLabel: string;
    /** e.g. "Added" */
    statAddedLabel: string;
    /** e.g. "Updated" */
    statUpdatedLabel: string;
    /** e.g. "Errors" */
    statErrorsLabel: string;
  }>();

  const emit = defineEmits<{
    cancel: [];
    'errors-clicked': [];
  }>();

  const statusWord = computed(() => {
    if (props.status === 'running') return props.scanningLabel;
    if (props.status === 'success') return props.successLabel;
    return props.failedLabel;
  });

  const clampedPercent = computed(() => Math.max(0, Math.min(100, Math.round(props.percent))));

  const showCurrentFile = computed(() => props.status === 'running' && Boolean(props.currentFile));

  const showCancelButton = computed(() => props.status === 'running');
  const showErrorsButton = computed(() => props.errors > 0);
</script>

<template>
  <div
    class="app-scan-progress"
    :class="`app-scan-progress--${status}`"
    role="region"
    :aria-label="statusWord"
  >
    <!-- Header row -->
    <div class="app-scan-progress__header">
      <span
        class="app-scan-progress__dot"
        :class="`app-scan-progress__dot--${status}`"
        aria-hidden="true"
      />

      <span class="app-scan-progress__title">
        {{ statusWord }}&nbsp;&middot;&nbsp;{{ courseName }}
      </span>

      <span class="app-scan-progress__spacer" aria-hidden="true" />

      <span class="app-scan-progress__meta">
        {{ clampedPercent }}%&nbsp;&middot;&nbsp;{{ elapsedTime }}
      </span>

      <button
        v-if="showCancelButton"
        type="button"
        class="app-scan-progress__btn app-scan-progress__btn--ghost"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>

      <button
        v-if="showErrorsButton"
        type="button"
        class="app-scan-progress__btn app-scan-progress__btn--errors"
        @click="emit('errors-clicked')"
      >
        {{ errorsLabel }}
      </button>
    </div>

    <!-- Progress bar -->
    <div
      class="app-scan-progress__bar"
      role="progressbar"
      :aria-valuenow="clampedPercent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="app-scan-progress__bar-fill"
        :class="{ 'app-scan-progress__bar-fill--failed': status === 'failed' }"
        :style="{ width: `${status === 'failed' ? 100 : clampedPercent}%` }"
      />
    </div>

    <!-- Stats row -->
    <div class="app-scan-progress__stats">
      <div class="app-scan-progress__stat">
        <span class="app-scan-progress__stat-num">{{ scanned }}</span>
        <span class="app-scan-progress__stat-label">{{ statScannedLabel }}</span>
      </div>
      <div class="app-scan-progress__stat">
        <span class="app-scan-progress__stat-num">{{ added }}</span>
        <span class="app-scan-progress__stat-label">{{ statAddedLabel }}</span>
      </div>
      <div class="app-scan-progress__stat">
        <span class="app-scan-progress__stat-num">{{ updated }}</span>
        <span class="app-scan-progress__stat-label">{{ statUpdatedLabel }}</span>
      </div>
      <div class="app-scan-progress__stat">
        <span
          class="app-scan-progress__stat-num"
          :class="{ 'app-scan-progress__stat-num--error': errors > 0 }"
          >{{ errors }}</span
        >
        <span class="app-scan-progress__stat-label">{{ statErrorsLabel }}</span>
      </div>
    </div>

    <!-- Current file -->
    <div v-if="showCurrentFile" class="app-scan-progress__current-file" :title="currentFile">
      {{ currentFile }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $dot-size: 8px;
  $bar-height: 4px;

  .app-scan-progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);

    // ---- Header ----
    &__header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }

    &__dot {
      flex-shrink: 0;
      width: $dot-size;
      height: $dot-size;
      border-radius: 50%;

      &--running {
        background: var(--status-info-fg);
        animation: app-scan-progress-pulse 2s ease-in-out infinite;

        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      }

      &--success {
        background: var(--status-success-fg);
      }

      &--failed {
        background: var(--status-error-fg);
      }
    }

    &__title {
      font-size: var(--text-sm);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    &__spacer {
      flex: 1 1 0;
    }

    &__meta {
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    &__btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      transition:
        background var(--dur-fast),
        border-color var(--dur-fast);

      &--ghost {
        color: var(--text-secondary);
        border-color: var(--border-default);

        &:hover {
          background: var(--surface-overlay);
        }

        &:focus-visible {
          outline: 2px solid var(--brand-accent);
          outline-offset: 2px;
        }
      }

      &--errors {
        color: var(--status-error-fg);
        border-color: var(--border-default);

        &:hover {
          background: var(--surface-overlay);
        }

        &:focus-visible {
          outline: 2px solid var(--status-error-fg);
          outline-offset: 2px;
        }
      }
    }

    // ---- Progress bar ----
    &__bar {
      height: $bar-height;
      border-radius: var(--radius-pill);
      background: var(--surface-overlay);
      overflow: hidden;
    }

    &__bar-fill {
      height: 100%;
      border-radius: var(--radius-pill);
      background: var(--brand-accent);
      transition: width var(--dur-slow) var(--ease-out);

      &--failed {
        background: var(--status-error-fg);
      }
    }

    // ---- Stats grid ----
    &__stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-2);

      @media (max-width: 359px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    &__stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: var(--space-2);
      background: var(--surface-overlay);
      border-radius: var(--radius-sm);
    }

    &__stat-num {
      font-family: var(--font-mono);
      font-size: var(--text-base);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      font-variant-numeric: tabular-nums;

      &--error {
        color: var(--status-error-fg);
      }
    }

    &__stat-label {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    // ---- Current file ----
    &__current-file {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }

  @keyframes app-scan-progress-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.35;
    }
  }
</style>
