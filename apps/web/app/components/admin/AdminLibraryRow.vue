<script setup lang="ts">
  import { computed } from 'vue';
  import { AppIconButton, IconCS } from '@app/ui';
  import type { AdminLibraryListItem } from '@app/api-client-ts';
  import { scanPillStatus, type ScanPillStatus } from '~/utils/scan-status';
  import AdminCopyablePath from './AdminCopyablePath.vue';

  interface Props {
    library: AdminLibraryListItem;
    // Pre-translated strings
    courseCountLabel: string;
    lastScanNeverLabel: string;
    scanCtaLabel: string;
    moreCtaLabel: string;
    copyPathAriaLabel: string;
    // Status labels for the pill
    labelRunning: string;
    labelSucceeded: string;
    /**
     * A `succeeded` scan whose `errorsCount > 0` gets this label instead of
     * `labelSucceeded` — same rule `AdminScansTable` applies to the same
     * payload. Reading `status` alone here is what made this row say
     * "Успешно" while the dashboard said "Завершён с ошибками" for the exact
     * same scan (audit run22 finding 4/#798).
     */
    labelSucceededWithErrors: string;
    labelPartial: string;
    labelFailed: string;
    labelCancelled: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    /** Emitted when the row is clicked (navigate to detail page). */
    click: [];
    /** Emitted when the Scan button is clicked. */
    scan: [];
  }>();

  const { t } = useI18n();

  function formatRelative(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return t('ui.noteEditor.agoSeconds', diffSec, { named: { n: diffSec } });
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t('ui.noteEditor.agoMinutes', diffMin, { named: { n: diffMin } });
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return t('ui.noteEditor.agoHours', diffH, { named: { n: diffH } });
    const diffD = Math.floor(diffH / 24);
    return t('ui.noteEditor.agoDays', diffD, { named: { n: diffD } });
  }

  // Interpolate `{time}` in the same `t()` call that resolves the key,
  // rather than pre-translating in the parent and `.replace()`-ing here: a
  // key translated with no params has vue-i18n substitute `{time}` with
  // nothing (not leave the literal placeholder), so the parent's
  // `t('pages.admin.libraries.lastScan')` already produced "Последнее
  // сканирование " with the placeholder gone — this `.replace()` then had
  // nothing left to find (audit run22 finding 7/#802: the date silently
  // disappeared here, while the dashboard's separately-computed value for
  // the same scan showed "8 дн назад").
  function lastScanText(): string {
    const scan = props.library.lastScan;
    if (!scan) return props.lastScanNeverLabel;
    return t('pages.admin.libraries.lastScan', { time: formatRelative(scan.startedAt) });
  }

  const pillStatus = computed<ScanPillStatus | null>(() => {
    const scan = props.library.lastScan;
    return scan ? scanPillStatus(scan.status, scan.errorsCount) : null;
  });

  function statusLabel(status: ScanPillStatus | null): string {
    if (!status) return '';
    const map: Record<ScanPillStatus, string> = {
      running: props.labelRunning,
      succeeded: props.labelSucceeded,
      'succeeded-with-errors': props.labelSucceededWithErrors,
      partial: props.labelPartial,
      failed: props.labelFailed,
      cancelled: props.labelCancelled,
    };
    return map[status];
  }

  function openAriaLabel(): string {
    return t('pages.admin.libraries.openAriaLabel', { name: props.library.name });
  }
</script>

<template>
  <div class="adm-lib-row" data-testid="library-row">
    <!-- Row-wide hit target — a real, focusable `<button>` rather than
         `role="button"` on this whole `<div>` (tuxedo 251): the row
         also contains AdminCopyablePath's own button, the Scan button and
         two `AppIconButton`s, and nesting real interactive controls inside
         an interactive-role ancestor is exactly axe's `nested-interactive`
         (native focus/AT semantics for a button-in-a-button are undefined,
         `@click.stop` only stops the JS event, not the ARIA nesting). This
         button is a sibling, absolutely covering the row; the truly
         interactive descendants get `position: relative` so they still
         paint — and receive clicks — above it. -->
    <button
      type="button"
      class="adm-lib-row__hit"
      :aria-label="openAriaLabel()"
      @click="emit('click')"
    />

    <!-- Icon -->
    <div class="adm-lib-row__icon" aria-hidden="true">
      <IconCS name="library" :size="14" />
    </div>

    <!-- Name + sub-line -->
    <div class="adm-lib-row__name-col">
      <div class="adm-lib-row__name">{{ props.library.name }}</div>
      <div class="adm-lib-row__sub adm-lib-row__sub--xs">
        <span>{{ props.courseCountLabel }}</span>
        <span class="adm-lib-row__sep">·</span>
        <span>{{ lastScanText() }}</span>
      </div>
      <div class="adm-lib-row__sub adm-lib-row__sub--md-up">
        <span>{{ lastScanText() }}</span>
      </div>
    </div>

    <!-- Copyable path (md+) -->
    <AdminCopyablePath
      class="adm-lib-row__path"
      :path="props.library.rootPath"
      :ariaLabel="props.copyPathAriaLabel"
    />

    <!-- Course count (lg) — reuses `courseCountLabel` verbatim (already
         correctly pluralised/translated, and already rendered plain, not
         mono, two lines up in the xs sub-line of this same component) rather
         than the bare `{{ ' courses' }}` literal that used to sit here
         untranslated on every locale but English (audit run22 finding
         8/#802). -->
    <div class="adm-lib-row__courses">
      {{ props.courseCountLabel }}
    </div>

    <!-- Status pill (md+) -->
    <span v-if="pillStatus" class="adm-lib-row__status-pill" :data-status="pillStatus">
      <span class="adm-lib-row__status-dot" aria-hidden="true" />
      {{ statusLabel(pillStatus) }}
    </span>
    <span v-else class="adm-lib-row__status-pill adm-lib-row__status-pill--none" />

    <!-- Actions — true siblings of `__hit` above, not nested inside it, so
         no `@click.stop` is needed to keep their clicks from also opening
         the library (sibling clicks never bubble to `__hit`). -->
    <div class="adm-lib-row__actions">
      <!-- xs: more-only -->
      <AppIconButton
        name="more-h"
        variant="ghost"
        size="sm"
        class="adm-lib-row__action--xs"
        :ariaLabel="props.moreCtaLabel"
      />
      <!-- md+: scan + more -->
      <button type="button" class="adm-lib-row__btn adm-lib-row__btn--md-up" @click="emit('scan')">
        <IconCS name="refresh" :size="16" />
        {{ props.scanCtaLabel }}
      </button>
      <AppIconButton
        name="more-h"
        variant="ghost"
        size="sm"
        class="adm-lib-row__action--md-up"
        :ariaLabel="props.moreCtaLabel"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $icon-size: 28px;
  $dot-size: 6px;
  $dur-dot: var(--dur-slower, 1600ms);

  .adm-lib-row {
    position: relative; // containing block for &__hit below
    display: grid;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    background: var(--surface-surface);
    margin-bottom: var(--space-2);
    cursor: pointer;

    // xs: icon + name + actions
    grid-template-columns: #{$icon-size} 1fr auto;

    @media (width >= 768px) {
      // md: icon + name + path + status + actions
      grid-template-columns: #{$icon-size} 1.4fr 1.6fr 0.9fr auto;
    }

    @media (width >= 1024px) {
      // lg: icon + name + path + courses + status + actions
      grid-template-columns: #{$icon-size} 1.4fr 2fr 0.9fr 0.6fr auto;
    }

    &:hover {
      border-color: var(--border-strong);
    }

    // ── Row-wide hit target ─────────────────────────────────────────────────
    &__hit {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      background: none;
      border: none;
      cursor: pointer;
      // Out-of-flow (absolute), so it never takes a grid track — an outline
      // here matches the row's own bounds exactly, same as the old
      // `role="button"` div's focus ring did.

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    // ── Icon ──────────────────────────────────────────────────────────────────
    &__icon {
      width: $icon-size;
      height: $icon-size;
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      display: grid;
      place-items: center;
      color: var(--text-secondary);
      font-size: var(--text-md); // #700: was a raw 14px SCSS var, invisible to the literal gate
      flex-shrink: 0;
    }

    // ── Name column ───────────────────────────────────────────────────────────
    &__name-col {
      min-width: 0;
    }

    &__name {
      font-weight: var(--fw-medium);
      color: var(--text-loud);
      font-size: var(--text-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__sub {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-top: var(--space-1);
      display: flex;
      gap: var(--space-2);
    }

    &__sub--xs {
      @media (width >= 768px) {
        display: none;
      }
    }

    &__sub--md-up {
      display: none;

      @media (width >= 768px) {
        display: flex;
      }
    }

    &__sep {
      color: var(--text-tertiary);
    }

    // ── Copyable path ────────────────────────────────────────────────────────
    &__path {
      display: none;
      // Positioned (any value) so it paints, and stays clickable, above the
      // absolutely-positioned &__hit rather than being covered by it —
      // stacking among positioned siblings with no z-index follows DOM
      // order, and &__path/&__actions both come after &__hit.
      position: relative;

      @media (width >= 768px) {
        display: inline-flex;
        min-width: 0;
        max-width: 100%;
      }
    }

    // ── Courses count (lg) ───────────────────────────────────────────────────
    &__courses {
      display: none;
      font-size: var(--text-xs);
      color: var(--text-secondary);

      @media (width >= 1024px) {
        display: block;
      }
    }

    // ── Status pill (md+) ────────────────────────────────────────────────────
    &__status-pill {
      display: none;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);

      @media (width >= 768px) {
        display: inline-flex;
      }

      &[data-status='running'] {
        background: var(--status-info-soft);
        color: var(--status-info-fg);

        .adm-lib-row__status-dot {
          background: var(--status-info-fg);
          animation: adm-lib-dot-pulse $dur-dot ease-in-out infinite;
        }
      }

      &[data-status='succeeded'] {
        background: var(--status-success-soft);
        color: var(--status-success-fg);

        .adm-lib-row__status-dot {
          background: var(--status-success-fg);
        }
      }

      &[data-status='succeeded-with-errors'] {
        background: var(--status-warning-soft);
        color: var(--status-warning-fg);

        .adm-lib-row__status-dot {
          background: var(--status-warning-fg);
        }
      }

      &[data-status='failed'] {
        background: var(--status-error-soft);
        color: var(--status-error-fg);

        .adm-lib-row__status-dot {
          background: var(--status-error-fg);
        }
      }

      &[data-status='cancelled'] {
        background: var(--surface-raised);
        color: var(--text-secondary);

        .adm-lib-row__status-dot {
          background: var(--text-secondary);
        }
      }

      &--none {
        // placeholder for grid alignment when no scan exists
        background: none;
      }
    }

    &__status-dot {
      width: $dot-size;
      height: $dot-size;
      border-radius: 50%;
      flex-shrink: 0;
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    &__actions {
      display: flex;
      gap: var(--space-1);
      position: relative; // see &__path — stays above &__hit
    }

    &__btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: none;
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      color: var(--text-secondary);
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
        color: var(--text-loud);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &--xs {
        @media (width >= 768px) {
          display: none;
        }
      }

      &--md-up {
        display: none;

        @media (width >= 768px) {
          display: inline-flex;
        }
      }
    }

    &__action {
      &--xs {
        @media (width >= 768px) {
          display: none;
        }
      }

      &--md-up {
        display: none;

        @media (width >= 768px) {
          display: inline-flex;
        }
      }
    }
  }

  @keyframes adm-lib-dot-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>
