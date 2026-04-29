<script setup lang="ts">
  import type { AdminLibraryListItem } from '@app/api-client-ts';
  import AdminCopyablePath from './AdminCopyablePath.vue';

  interface Props {
    library: AdminLibraryListItem;
    // Pre-translated strings
    courseCountLabel: string;
    lastScanNeverLabel: string;
    lastScanLabel: string;
    scanCtaLabel: string;
    moreCtaLabel: string;
    copyPathAriaLabel: string;
    // Status labels for the pill
    labelRunning: string;
    labelSucceeded: string;
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

  function formatRelative(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return `${String(diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${String(diffMin)}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${String(diffH)}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${String(diffD)}d ago`;
  }

  function lastScanText(): string {
    const scan = props.library.lastScan;
    if (!scan) return props.lastScanNeverLabel;
    return props.lastScanLabel.replace('{time}', formatRelative(scan.startedAt));
  }

  function statusLabel(
    status: 'running' | 'succeeded' | 'failed' | 'cancelled' | null | undefined,
  ): string {
    if (!status) return '';
    const map: Record<string, string> = {
      running: props.labelRunning,
      succeeded: props.labelSucceeded,
      failed: props.labelFailed,
      cancelled: props.labelCancelled,
    };
    return map[status] ?? status;
  }

  function onScanClick(e: Event): void {
    e.stopPropagation();
    emit('scan');
  }
</script>

<template>
  <div
    class="adm-lib-row"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <!-- Icon -->
    <div class="adm-lib-row__icon" aria-hidden="true">
      <span class="i-heroicons-building-library" />
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

    <!-- Course count (lg) -->
    <div class="adm-lib-row__courses">
      <span class="adm-lib-row__courses-num">{{ props.library.coursesCount }}</span>
      {{ ' courses' }}
    </div>

    <!-- Status pill (md+) -->
    <span
      v-if="props.library.lastScan"
      class="adm-lib-row__status-pill"
      :data-status="props.library.lastScan.status"
    >
      <span class="adm-lib-row__status-dot" aria-hidden="true" />
      {{ statusLabel(props.library.lastScan.status) }}
    </span>
    <span v-else class="adm-lib-row__status-pill adm-lib-row__status-pill--none" />

    <!-- Actions -->
    <div class="adm-lib-row__actions" @click.stop @keydown.stop>
      <!-- xs: more-only -->
      <button
        type="button"
        class="adm-lib-row__btn adm-lib-row__btn--icon adm-lib-row__btn--xs"
        :aria-label="props.moreCtaLabel"
      >
        <span class="i-heroicons-ellipsis-horizontal" aria-hidden="true" />
      </button>
      <!-- md+: scan + more -->
      <button type="button" class="adm-lib-row__btn adm-lib-row__btn--md-up" @click="onScanClick">
        <span class="i-heroicons-arrow-path" aria-hidden="true" />
        {{ props.scanCtaLabel }}
      </button>
      <button
        type="button"
        class="adm-lib-row__btn adm-lib-row__btn--icon adm-lib-row__btn--md-up"
        :aria-label="props.moreCtaLabel"
      >
        <span class="i-heroicons-ellipsis-horizontal" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $icon-size: 28px;
  $icon-inner-font: 14px;
  $dot-size: 6px;
  $dur-dot: var(--dur-slower, 1600ms);
  $btn-icon-size: 28px;

  .adm-lib-row {
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

    @media (min-width: 768px) {
      // md: icon + name + path + status + actions
      grid-template-columns: #{$icon-size} 1.4fr 1.6fr 0.9fr auto;
    }

    @media (min-width: 1024px) {
      // lg: icon + name + path + courses + status + actions
      grid-template-columns: #{$icon-size} 1.4fr 2fr 0.9fr 0.6fr auto;
    }

    &:hover {
      border-color: var(--border-strong);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: 2px;
    }

    // ── Icon ──────────────────────────────────────────────────────────────────
    &__icon {
      width: $icon-size;
      height: $icon-size;
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      display: grid;
      place-items: center;
      color: var(--text-muted);
      font-size: $icon-inner-font;
      flex-shrink: 0;
    }

    // ── Name column ───────────────────────────────────────────────────────────
    &__name-col {
      min-width: 0;
    }

    &__name {
      font-weight: 500;
      color: var(--text-loud);
      font-size: var(--text-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__sub {
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
      display: flex;
      gap: var(--space-2);
    }

    &__sub--xs {
      @media (min-width: 768px) {
        display: none;
      }
    }

    &__sub--md-up {
      display: none;

      @media (min-width: 768px) {
        display: flex;
      }
    }

    &__sep {
      color: var(--text-subtle);
    }

    // ── Copyable path ────────────────────────────────────────────────────────
    &__path {
      display: none;

      @media (min-width: 768px) {
        display: inline-flex;
        min-width: 0;
        max-width: 100%;
      }
    }

    // ── Courses count (lg) ───────────────────────────────────────────────────
    &__courses {
      display: none;
      font-size: var(--text-xs);
      color: var(--text-muted);

      @media (min-width: 1024px) {
        display: block;
      }
    }

    &__courses-num {
      color: var(--text-loud);
      font-family: var(--font-mono);
    }

    // ── Status pill (md+) ────────────────────────────────────────────────────
    &__status-pill {
      display: none;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: 500;

      @media (min-width: 768px) {
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

      &[data-status='failed'] {
        background: var(--status-error-soft);
        color: var(--status-error-fg);

        .adm-lib-row__status-dot {
          background: var(--status-error-fg);
        }
      }

      &[data-status='cancelled'] {
        background: var(--surface-raised);
        color: var(--text-muted);

        .adm-lib-row__status-dot {
          background: var(--text-muted);
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
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
        color: var(--text-loud);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &--icon {
        padding: var(--space-1);
        width: $btn-icon-size;
        height: $btn-icon-size;
        justify-content: center;
      }

      &--xs {
        @media (min-width: 768px) {
          display: none;
        }
      }

      &--md-up {
        display: none;

        @media (min-width: 768px) {
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
