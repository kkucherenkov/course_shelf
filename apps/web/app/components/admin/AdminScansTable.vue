<script setup lang="ts">
  import { AppSkeleton, IconCS } from '@app/ui';
  import type { AdminScanListItem, ScanStatus } from '@app/api-client-ts';

  interface Props {
    items: AdminScanListItem[];
    loading: boolean;
    // Column-header strings (all pre-translated by consumer)
    colStatus: string;
    colStarted: string;
    colDuration: string;
    colFiles: string;
    colAdded: string;
    colErrors: string;
    // Status label strings (pre-translated)
    labelRunning: string;
    labelSucceeded: string;
    labelPartial: string;
    labelFailed: string;
    labelCancelled: string;
    // Optional: show library column (dashboard) vs hide (detail page)
    showLibrary?: boolean;
    colLibrary?: string;
    // scanId of the one row that has real per-file error detail behind it
    // (only the library's latest scan does — there is no per-scan detail
    // endpoint for the rest of the history, only `errorsCount`). Turns that
    // one row's errorsCount cell into a button; every other row stays a
    // static number, unchanged (#620).
    expandableScanId?: string | null;
    // scanId whose detail is currently open, for `aria-expanded`.
    expandedScanId?: string | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    showLibrary: false,
    colLibrary: '',
    expandableScanId: null,
    expandedScanId: null,
  });

  const emit = defineEmits<{
    'toggle-errors': [scanId: string];
  }>();

  const { t } = useI18n();

  function statusLabel(status: ScanStatus): string {
    const map: Record<ScanStatus, string> = {
      running: props.labelRunning,
      succeeded: props.labelSucceeded,
      partial: props.labelPartial,
      failed: props.labelFailed,
      cancelled: props.labelCancelled,
    };
    return map[status];
  }

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

  function formatDuration(startedAt: string, finishedAt: string | null): string {
    if (!finishedAt) return '—';
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${String(h)}h`);
    if (m > 0) parts.push(`${m.toString().padStart(h > 0 ? 2 : 1, '0')}m`);
    if (s > 0 || parts.length === 0) parts.push(`${String(s)}s`);
    return parts.join(' ');
  }
</script>

<template>
  <!-- Skeleton -->
  <div v-if="props.loading" class="adm-scans-tbl__skeleton-wrap">
    <div v-for="i in 3" :key="i" class="adm-scans-tbl__skel-row">
      <AppSkeleton width="24px" height="24px" radius="pill" />
      <AppSkeleton class="adm-scans-tbl__skel--flex" height="var(--text-xs)" />
      <AppSkeleton width="80px" height="18px" radius="pill" />
    </div>
  </div>

  <!-- Table -->
  <div v-else class="adm-scans-tbl__wrap">
    <table class="adm-scans-tbl" role="table">
      <thead>
        <tr>
          <th v-if="props.showLibrary">{{ props.colLibrary }}</th>
          <th>{{ props.colStatus }}</th>
          <th class="adm-scans-tbl__col--md-up">{{ props.colStarted }}</th>
          <th>{{ props.colDuration }}</th>
          <th class="adm-scans-tbl__col--lg">{{ props.colFiles }}</th>
          <th class="adm-scans-tbl__col--lg">{{ props.colAdded }}</th>
          <th class="adm-scans-tbl__col--lg">{{ props.colErrors }}</th>
          <th
            class="adm-scans-tbl__col--md-combined"
            :aria-label="`${props.colFiles} / ${props.colAdded}`"
          />
          <th :aria-label="t('admin.scansTable.expandColumnLabel')" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in props.items" :key="row.scanId" tabindex="0" class="adm-scans-tbl__row">
          <!-- Library name (dashboard only) -->
          <td v-if="props.showLibrary">
            <div class="adm-scans-tbl__lib-name">{{ row.libraryName }}</div>
            <div class="adm-scans-tbl__lib-sub adm-scans-tbl__col--xs-only">
              {{ formatRelative(row.startedAt) }}
            </div>
          </td>
          <!-- Status pill -->
          <td>
            <span class="adm-scans-tbl__status-pill" :data-status="row.status">
              <span class="adm-scans-tbl__status-dot" aria-hidden="true" />
              {{ statusLabel(row.status) }}
            </span>
          </td>
          <!-- Started (md+) -->
          <td class="adm-scans-tbl__col--md-up adm-scans-tbl__mute">
            {{ formatRelative(row.startedAt) }}
          </td>
          <!-- Duration -->
          <td class="adm-scans-tbl__num-cell">
            {{ formatDuration(row.startedAt, row.finishedAt) }}
          </td>
          <!-- Files (lg) -->
          <td class="adm-scans-tbl__col--lg adm-scans-tbl__num-cell">
            {{ row.filesScanned.toLocaleString() }}
          </td>
          <!-- Added (lg) -->
          <td class="adm-scans-tbl__col--lg adm-scans-tbl__num-cell adm-scans-tbl__added">
            +{{ row.coursesAdded }}
          </td>
          <!-- Errors (lg) -->
          <td
            class="adm-scans-tbl__col--lg adm-scans-tbl__num-cell"
            :class="{ 'adm-scans-tbl__errors--nonzero': row.errorsCount > 0 }"
          >
            <button
              v-if="row.errorsCount > 0 && row.scanId === props.expandableScanId"
              type="button"
              class="adm-scans-tbl__errors-btn"
              :aria-expanded="row.scanId === props.expandedScanId"
              :aria-label="`${props.colErrors}: ${row.errorsCount}`"
              @click="emit('toggle-errors', row.scanId)"
            >
              {{ row.errorsCount }}
            </button>
            <template v-else>{{ row.errorsCount }}</template>
          </td>
          <!-- Files+Added combined (md) -->
          <td class="adm-scans-tbl__col--md-combined adm-scans-tbl__num-cell">
            {{ row.filesScanned.toLocaleString() }}
            <span class="adm-scans-tbl__added">+{{ row.coursesAdded }}</span>
          </td>
          <!-- Chevron -->
          <td class="adm-scans-tbl__chevron-cell">
            <IconCS name="chevron-right" :size="14" class="adm-scans-tbl__chevron" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
  $dot-size: 6px;
  $chevron-size: 14px;
  $dur-dot: var(--dur-slower, 1600ms);

  .adm-scans-tbl {
    &__skeleton-wrap {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: var(--space-4);
    }

    &__skel-row {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-2) 0;
      align-items: center;

      & + & {
        border-top: 1px solid var(--border-default);
      }
    }

    &__skel--flex {
      flex: 1;
    }

    &__wrap {
      overflow-x: auto;
    }
  }

  .adm-scans-tbl {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;

    thead th {
      text-align: left;
      font-size: var(--text-xs);
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: var(--space-3);
      background: var(--surface-raised);
      border-bottom: 1px solid var(--border-default);
      white-space: nowrap;
    }

    tbody td {
      padding: var(--space-3);
      border-bottom: 1px solid var(--border-default);
      font-size: var(--text-sm);
      color: var(--text-fg);
      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: 0;
    }

    &__row {
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-within {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    &__lib-name {
      font-weight: var(--fw-medium);
      color: var(--text-loud);
    }

    &__lib-sub {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-top: var(--space-1);
    }

    &__mute {
      color: var(--text-secondary);
    }

    &__num-cell {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--text-loud);

      // Combined with &__num-cell rather than standing alone: a bare
      // `.adm-scans-tbl__errors--nonzero` (one class) loses the cascade to
      // the SCSS-nested `tbody td` rule above, which compiles to
      // `.adm-scans-tbl tbody td` (one class + two type selectors) — a
      // higher specificity than a single class. A nonzero error count
      // painted in the same colour as zero, right next to a green
      // "Succeeded" badge (tuxedo 250). Two classes on the same cell beats
      // it outright, which is also the correct BEM shape: a modifier is
      // always scoped to the block/element it modifies, never bare.
      &.adm-scans-tbl__errors--nonzero {
        color: var(--status-error-fg);
      }
    }

    &__added {
      color: var(--status-success-fg);
    }

    &__errors-btn {
      font: inherit;
      font-family: var(--font-mono);
      color: inherit;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      text-decoration: underline;
      text-decoration-style: dotted;
      text-underline-offset: 2px;

      &:hover {
        color: var(--status-error-fg);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }
    }

    &__chevron-cell {
      text-align: right;
    }

    &__chevron {
      width: $chevron-size;
      height: $chevron-size;
      color: var(--text-secondary);
    }

    // ── Status pill ────────────────────────────────────────────────────────────
    &__status-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);

      &[data-status='running'] {
        background: var(--status-info-soft);
        color: var(--status-info-fg);

        .adm-scans-tbl__status-dot {
          background: var(--status-info-fg);
          animation: adm-scans-dot-pulse $dur-dot ease-in-out infinite;
        }
      }

      &[data-status='succeeded'] {
        background: var(--status-success-soft);
        color: var(--status-success-fg);

        .adm-scans-tbl__status-dot {
          background: var(--status-success-fg);
        }
      }

      &[data-status='failed'] {
        background: var(--status-error-soft);
        color: var(--status-error-fg);

        .adm-scans-tbl__status-dot {
          background: var(--status-error-fg);
        }
      }

      &[data-status='cancelled'] {
        background: var(--surface-raised);
        color: var(--text-secondary);

        .adm-scans-tbl__status-dot {
          background: var(--text-secondary);
        }
      }
    }

    &__status-dot {
      width: $dot-size;
      height: $dot-size;
      border-radius: 50%;
      flex-shrink: 0;
    }

    // ── Responsive column visibility ─────────────────────────────────────────
    &__col--lg {
      @media (width <= 1023px) {
        display: none;
      }
    }

    &__col--md-up {
      @media (width <= 767px) {
        display: none;
      }
    }

    &__col--md-combined {
      @media (width <= 767px) {
        display: none;
      }

      @media (width >= 1024px) {
        display: none;
      }
    }

    &__col--xs-only {
      @media (width >= 768px) {
        display: none;
      }
    }
  }

  @keyframes adm-scans-dot-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>
