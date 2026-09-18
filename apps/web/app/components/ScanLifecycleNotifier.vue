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
   * When a scan finishes a `useToast().add()` summary is pushed, but only for
   * a card the panel isn't already showing (i.e. one pushed out past
   * `MAX_VISIBLE` by more concurrent scans) — a card the panel renders
   * already tells the same story inline, and toasting it too just doubles
   * the same notification in the same corner (#667).
   */

  import { computed, onMounted, onUnmounted, watch } from 'vue';
  import { navigateTo, useI18n, useToast } from '#imports';
  import { AppScanProgress } from '@app/ui';
  import type { ScanStatus } from '@app/ui';
  import { useScanLifecycleStore } from '~/stores/scanLifecycle';
  import type { ActiveScan } from '~/stores/scanLifecycle';
  import {
    subscribeElapsedClock,
    unsubscribeElapsedClock,
    formatElapsed,
    elapsedClockNow,
  } from '~/composables/useElapsedTime';

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

  // ── Elapsed time ─────────────────────────────────────────────────────────
  // Shared with `useScanProgress` so two on-screen elapsed-time displays for
  // the same scan never drift apart (#603).

  onMounted(() => {
    subscribeElapsedClock();
  });
  onUnmounted(() => {
    unsubscribeElapsedClock();
  });

  // ── Status mapping ────────────────────────────────────────────────────────

  function toScanStatus(card: ActiveScan): ScanStatus {
    if (!card.finished) return 'running';
    if (card.finished.status === 'failed') return 'failed';
    if (card.finished.status === 'partial') return 'partial';
    return 'success';
  }

  // E32-F01-S02: a scoped rescan names the course, not the library, so the
  // notifier reads "rescanning <course>" rather than implying a full scan.
  function displayName(card: ActiveScan): string {
    return card.scopeCourseName ?? card.libraryName;
  }

  // The notifier only carries `errorsCount` from the Centrifugo event, not
  // the per-file `ScanError[]` detail — that lives on `ScanDto`, fetched by
  // the admin library page. So "errors" here means "go look", not "show
  // inline": send the admin to the page that already renders the real list.
  function onErrorsClicked(card: ActiveScan): void {
    void navigateTo(`/admin/libraries/${card.libraryId}`);
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

        // Already on screen in the panel — toasting it too would just repeat
        // the same summary in the same bottom-right corner (#667).
        if (visibleCards.value.some((visible) => visible.scanId === card.scanId)) continue;

        if (card.finished.status === 'failed') {
          toast.add({
            title: t('notifiers.scan.toastFailedTitle', { name: displayName(card) }),
            // 3-arg form so vue-i18n picks up the real plural index — a
            // 2-arg `{ errors: n }` call has no `named.n`/`named.count` for
            // it to read and always rendered the first plural form (#621).
            description: t('notifiers.scan.toastFailedSummary', card.errorsCount, {
              named: { n: card.errorsCount },
            }),
            color: 'error',
          });
        } else {
          // Two independently-pluralized messages, not one string with two
          // counts baked in — same split as `statLibrariesMeta*` (#621).
          // "Files", not "lessons": the wire only carries `filesAdded`, no
          // lesson count (TODO(E13)); this labels what's actually counted
          // instead of leaving the mismatch as an open TODO.
          const coursesLabel = t('notifiers.scan.toastDoneSummaryCourses', card.coursesDiscovered, {
            named: { n: card.coursesDiscovered },
          });
          const filesLabel = t('notifiers.scan.toastDoneSummaryFiles', card.filesAdded, {
            named: { n: card.filesAdded },
          });
          toast.add({
            title: t('notifiers.scan.toastDoneTitle', { name: displayName(card) }),
            description: `${coursesLabel} · ${filesLabel}`,
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
          :course-name="displayName(card)"
          :elapsed-time="formatElapsed(card.startedAt, elapsedClockNow)"
          :scanned="card.filesScanned"
          :added="card.filesAdded"
          :updated="card.filesUpdated"
          :errors="card.errorsCount"
          :scanning-label="t('notifiers.scan.statusScanning')"
          :success-label="t('notifiers.scan.statusComplete')"
          :partial-label="t('notifiers.scan.statusPartial')"
          :failed-label="t('notifiers.scan.statusFailed')"
          :errors-label="
            t('notifiers.scan.errorsButton', card.errorsCount, { named: { n: card.errorsCount } })
          "
          :stat-scanned-label="t('notifiers.scan.statScanned')"
          :stat-added-label="t('notifiers.scan.statAdded')"
          :stat-updated-label="t('notifiers.scan.statUpdated')"
          :stat-errors-label="t('notifiers.scan.statErrors')"
          @errors-clicked="onErrorsClicked(card)"
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
      line-height: var(--leading-none);
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

  // Below 600px `AppNavigationShell` switches to a fixed bottom-tab bar
  // (`--space-8` tall, see its own `&__bottom-tabs`) docked at `bottom: 0`.
  // The panel outranks it on `z-index` (`--z-toast` > `--z-sticky`), so
  // without this it draws over the bar instead of beside it, leaving the
  // active scan's nav unreachable until the card is dismissed (#667).
  @media (width < 600px) {
    .scan-lifecycle-notifier {
      bottom: calc(var(--space-8) + var(--space-4));
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
