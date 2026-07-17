<script setup lang="ts">
  /**
   * Floating notifier panel that renders in-flight and recently-finished
   * scan cards in the bottom-right corner of the viewport.
   *
   * Cards use `<AppScanProgress>` from `@app/ui`. The component owns its own
   * fixed positioning — the consumer only needs to mount it anywhere in the DOM.
   *
   * Each card has a close button (enabled only on finished scans — active scans
   * cannot be dismissed by the user).
   *
   * When a scan finishes a `useToast().add()` summary is pushed so the user
   * gets a notification even if the panel is hidden.
   */

  import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
  import { useI18n, useToast } from '#imports';
  import { AppScanProgress } from '@app/ui';
  import type { ScanStatus } from '@app/ui';
  import { useScanLifecycleStore } from '~/stores/scanLifecycle';
  import type { ActiveScan } from '~/stores/scanLifecycle';

  const MAX_VISIBLE = 3;

  const { t } = useI18n();
  const toast = useToast();
  const store = useScanLifecycleStore();

  // ── Visible cards: max 3, active first, then recentlyFinished ─────────────

  const visibleCards = computed<ActiveScan[]>(() => {
    const combined = [...store.active, ...store.recentlyFinished];
    // De-duplicate by scanId (finished scans might briefly appear in both).
    const seen = new Set<string>();
    const deduped: ActiveScan[] = [];
    for (const card of combined) {
      if (!seen.has(card.scanId)) {
        seen.add(card.scanId);
        deduped.push(card);
      }
    }
    return deduped.slice(0, MAX_VISIBLE);
  });

  const hasCards = computed(() => visibleCards.value.length > 0);

  // ── Elapsed time ticker ───────────────────────────────────────────────────

  const now = ref(Date.now());
  let ticker: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    ticker = setInterval(() => {
      now.value = Date.now();
    }, 1000);
  });

  onUnmounted(() => {
    if (ticker !== null) clearInterval(ticker);
  });

  function formatElapsed(startedAt: string): string {
    const ms = Math.max(0, now.value - new Date(startedAt).getTime());
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ── Status mapping ────────────────────────────────────────────────────────

  function toScanStatus(card: ActiveScan): ScanStatus {
    if (!card.finished) return 'running';
    return card.finished.status === 'failed' ? 'failed' : 'success';
  }

  // ── Toast on finish ───────────────────────────────────────────────────────

  // Track which scanIds we've already toasted to avoid duplicates.
  const _toasted = new Set<string>();

  watch(
    () => store.active,
    (cards) => {
      for (const card of cards) {
        if (!card.finished) continue;
        if (_toasted.has(card.scanId)) continue;
        _toasted.add(card.scanId);

        if (card.finished.status === 'failed') {
          toast.add({
            title: t('notifiers.scan.toastFailedTitle', { name: card.libraryName }),
            description: t('notifiers.scan.toastFailedSummary', {
              errors: card.errorsCount,
            }),
            color: 'error',
          });
        } else {
          toast.add({
            title: t('notifiers.scan.toastDoneTitle', { name: card.libraryName }),
            description: t('notifiers.scan.toastDoneSummary', {
              courses: card.coursesDiscovered,
              // TODO(E13): backend doesn't expose total lesson count in scan events yet
              lessons: card.filesAdded,
            }),
            color: 'success',
          });
        }
      }
    },
    { deep: true },
  );
</script>

<template>
  <Transition name="scan-notifier-panel">
    <div v-if="hasCards" class="scan-lifecycle-notifier" role="region" aria-live="polite">
      <div
        v-for="card in visibleCards"
        :key="card.scanId"
        class="scan-lifecycle-notifier__card-wrapper"
      >
        <!-- Dismiss button (only for finished cards) -->
        <button
          v-if="card.finished"
          type="button"
          class="scan-lifecycle-notifier__close"
          :aria-label="t('notifiers.scan.dismissAria')"
          @click="store.dismiss(card.scanId)"
        >
          <span aria-hidden="true">&times;</span>
        </button>

        <AppScanProgress
          :status="toScanStatus(card)"
          :course-name="card.libraryName"
          :percent="0"
          :elapsed-time="formatElapsed(card.startedAt)"
          :scanned="card.filesScanned"
          :added="card.filesAdded"
          :updated="0"
          :errors="card.errorsCount"
          :scanning-label="t('notifiers.scan.statusScanning')"
          :success-label="
            card.finished?.status === 'partial'
              ? t('notifiers.scan.statusPartial')
              : t('notifiers.scan.statusComplete')
          "
          :failed-label="t('notifiers.scan.statusFailed')"
          :cancel-label="t('notifiers.scan.cancel')"
          :errors-label="
            t('notifiers.scan.errorsButton', card.errorsCount, { named: { n: card.errorsCount } })
          "
          :stat-scanned-label="t('notifiers.scan.statScanned')"
          :stat-added-label="t('notifiers.scan.statAdded')"
          :stat-updated-label="t('notifiers.scan.statUpdated')"
          :stat-errors-label="t('notifiers.scan.statErrors')"
        />
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
  $notifier-width: 380px;
  $close-btn-size: 20px;

  .scan-lifecycle-notifier {
    position: fixed;
    bottom: var(--space-4);
    right: var(--space-4);
    z-index: var(--z-toast);
    display: flex;
    flex-direction: column-reverse;
    gap: var(--space-2);
    width: $notifier-width;
    max-width: calc(100vw - 2 * var(--space-4));
    pointer-events: none; // let clicks pass through the container

    &__card-wrapper {
      position: relative;
      pointer-events: auto; // re-enable on each card
    }

    &__close {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      z-index: var(--z-raised);
      display: flex;
      align-items: center;
      justify-content: center;
      width: $close-btn-size;
      height: $close-btn-size;
      border: none;
      background: var(--surface-overlay);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: var(--text-base);
      line-height: 1;
      cursor: pointer;
      transition: background var(--dur-fast);

      &:hover {
        background: var(--border-default);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }
  }

  // ── Panel enter/leave transitions ─────────────────────────────────────────
  .scan-notifier-panel {
    &-enter-active,
    &-leave-active {
      transition: opacity var(--dur-base);
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;
    }
  }
</style>
