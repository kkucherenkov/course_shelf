<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { AppButton, AppCheckbox, AppProgressLinear } from '@app/ui';
  import type { TranscriptionDto, TranscriptionStatus } from '@app/api-client-ts';

  interface Props {
    transcription: TranscriptionDto | null;
    starting?: boolean;
    cancelling?: boolean;
    // Copy (all pre-translated by the consumer)
    title: string;
    idleBody: string;
    forceLabel: string;
    startCta: string;
    cancelCta: string;
    labelRunning: string;
    labelSucceeded: string;
    labelFailed: string;
    labelCancelled: string;
    statSkipped: string;
    statTranscribed: string;
    statFailed: string;
    statTotal: string;
    errorsHeading: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    starting: false,
    cancelling: false,
  });

  const emit = defineEmits<{
    start: [force: boolean];
    cancel: [];
  }>();

  const force = ref(false);

  const isRunning = computed(() => props.transcription?.status === 'running');

  const percent = computed(() => {
    const run = props.transcription;
    if (!run || run.lessonsTotal === 0) return 0;
    const processed = run.lessonsSkipped + run.lessonsTranscribed + run.lessonsFailed;
    return Math.round((processed / run.lessonsTotal) * 100);
  });

  function statusLabel(status: TranscriptionStatus): string {
    const map: Record<TranscriptionStatus, string> = {
      running: props.labelRunning,
      succeeded: props.labelSucceeded,
      failed: props.labelFailed,
      cancelled: props.labelCancelled,
    };
    return map[status];
  }

  function onStart(): void {
    emit('start', force.value);
  }

  function onCancel(): void {
    emit('cancel');
  }
</script>

<template>
  <div class="adm-transcription-card">
    <div class="adm-transcription-card__header">
      <h3 class="adm-transcription-card__title">{{ props.title }}</h3>
      <span
        v-if="props.transcription"
        class="adm-transcription-card__status-pill"
        :data-status="props.transcription.status"
      >
        <span class="adm-transcription-card__status-dot" aria-hidden="true" />
        {{ statusLabel(props.transcription.status) }}
      </span>
    </div>

    <!-- Running: progress bar + cancel -->
    <template v-if="isRunning">
      <AppProgressLinear
        class="adm-transcription-card__bar"
        :value="percent"
        :label="props.labelRunning"
      />
      <div class="adm-transcription-card__actions">
        <AppButton
          variant="ghost"
          :label="props.cancelCta"
          :loading="props.cancelling"
          @click="onCancel"
        />
      </div>
    </template>

    <!-- Idle (never run, or finished): force checkbox + start -->
    <template v-else>
      <p v-if="!props.transcription" class="adm-transcription-card__body">
        {{ props.idleBody }}
      </p>
      <div class="adm-transcription-card__actions">
        <AppCheckbox v-model="force" :label="props.forceLabel" />
        <AppButton :label="props.startCta" :loading="props.starting" @click="onStart" />
      </div>
    </template>

    <!-- Counters -->
    <div v-if="props.transcription" class="adm-transcription-card__stats">
      <div class="adm-transcription-card__stat">
        <span class="adm-transcription-card__stat-num">
          {{ props.transcription.lessonsSkipped }}
        </span>
        <span class="adm-transcription-card__stat-label">{{ props.statSkipped }}</span>
      </div>
      <div class="adm-transcription-card__stat">
        <span class="adm-transcription-card__stat-num">
          {{ props.transcription.lessonsTranscribed }}
        </span>
        <span class="adm-transcription-card__stat-label">{{ props.statTranscribed }}</span>
      </div>
      <div class="adm-transcription-card__stat">
        <span
          class="adm-transcription-card__stat-num"
          :class="{
            'adm-transcription-card__stat-num--error': props.transcription.lessonsFailed > 0,
          }"
        >
          {{ props.transcription.lessonsFailed }}
        </span>
        <span class="adm-transcription-card__stat-label">{{ props.statFailed }}</span>
      </div>
      <div class="adm-transcription-card__stat">
        <span class="adm-transcription-card__stat-num">
          {{ props.transcription.lessonsTotal }}
        </span>
        <span class="adm-transcription-card__stat-label">{{ props.statTotal }}</span>
      </div>
    </div>

    <!-- Errors -->
    <div
      v-if="props.transcription && props.transcription.errors.length > 0"
      class="adm-transcription-card__errors"
    >
      <h4 class="adm-transcription-card__errors-heading">{{ props.errorsHeading }}</h4>
      <ul class="adm-transcription-card__errors-list">
        <li
          v-for="err in props.transcription.errors"
          :key="err.lessonId"
          class="adm-transcription-card__error-row"
        >
          <span class="adm-transcription-card__error-lesson">{{ err.lessonId }}</span>
          <span class="adm-transcription-card__error-message">{{ err.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $dot-size: 6px;

  .adm-transcription-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }

    &__title {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-loud);
    }

    &__body {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    &__bar {
      margin: var(--space-1) 0;
    }

    &__actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    // ── Status pill ────────────────────────────────────────────────────────
    &__status-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: 500;

      &[data-status='running'] {
        background: var(--status-info-soft);
        color: var(--status-info-fg);

        .adm-transcription-card__status-dot {
          background: var(--status-info-fg);
        }
      }

      &[data-status='succeeded'] {
        background: var(--status-success-soft);
        color: var(--status-success-fg);

        .adm-transcription-card__status-dot {
          background: var(--status-success-fg);
        }
      }

      &[data-status='failed'] {
        background: var(--status-error-soft);
        color: var(--status-error-fg);

        .adm-transcription-card__status-dot {
          background: var(--status-error-fg);
        }
      }

      &[data-status='cancelled'] {
        background: var(--surface-raised);
        color: var(--text-muted);

        .adm-transcription-card__status-dot {
          background: var(--text-muted);
        }
      }
    }

    &__status-dot {
      width: $dot-size;
      height: $dot-size;
      border-radius: 50%;
      flex-shrink: 0;
    }

    // ── Stats ──────────────────────────────────────────────────────────────
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
      font-weight: 600;
      color: var(--text-fg);
      font-variant-numeric: tabular-nums;

      &--error {
        color: var(--status-error-fg);
      }
    }

    &__stat-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    // ── Errors ─────────────────────────────────────────────────────────────
    &__errors {
      border-top: 1px solid var(--border-default);
      padding-top: var(--space-3);
    }

    &__errors-heading {
      margin: 0 0 var(--space-2);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    &__errors-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    &__error-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--space-2);
      background: var(--status-error-soft);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
    }

    &__error-lesson {
      font-family: var(--font-mono);
      color: var(--text-muted);
    }

    &__error-message {
      color: var(--status-error-fg);
    }
  }
</style>
