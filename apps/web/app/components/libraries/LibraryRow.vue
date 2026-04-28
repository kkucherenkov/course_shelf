<script setup lang="ts">
  import { computed, toRef, watch } from 'vue';
  import { AppButton, AppChip, IconCS } from '@app/ui';
  import type { LibraryDto } from '@app/api-client-ts';

  import { useLatestScan } from '~/composables/useLibraries';

  const props = defineProps<{ library: LibraryDto }>();

  const emit = defineEmits<{ scanFinished: [] }>();

  const { t } = useI18n();
  const libraryId = toRef(props.library, 'id');
  const { data: scan, status, triggerScan } = useLatestScan(libraryId);

  // Detect scan completion to bubble up to the parent (so it can refresh course count etc.)
  watch(
    () => scan.value?.status,
    (now, prev) => {
      if (prev === 'running' && now && now !== 'running') {
        emit('scanFinished');
      }
    },
  );

  const isScanning = computed(() => scan.value?.status === 'running');

  type ChipVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';

  const statusChip = computed<{ label: string; variant: ChipVariant } | null>(() => {
    const s = scan.value?.status;
    if (s === 'running') return { label: t('pages.libraries.statusRunning'), variant: 'info' };
    if (s === 'succeeded')
      return { label: t('pages.libraries.statusSucceeded'), variant: 'success' };
    if (s === 'failed') return { label: t('pages.libraries.statusFailed'), variant: 'error' };
    if (s === 'cancelled')
      return { label: t('pages.libraries.statusCancelled'), variant: 'warning' };
    return null;
  });

  const lastScanLabel = computed(() => {
    const s = scan.value;
    if (!s) return t('pages.libraries.noScansYet');
    if (s.status === 'running') {
      return t('pages.libraries.scanInFlight', {
        files: String(s.filesScanned),
      });
    }
    return t('pages.libraries.scanSummary', {
      added: String(s.filesAdded),
      updated: String(s.filesUpdated),
      courses: String(s.coursesDiscovered),
    });
  });

  async function onRescan(): Promise<void> {
    try {
      await triggerScan();
    } catch {
      // Error surfaced via the composable's `error` ref; ignore here.
    }
  }
</script>

<template>
  <article class="library-row" data-testid="library-row">
    <div class="library-row__info">
      <div class="library-row__name-row">
        <h3 class="library-row__name">{{ library.name }}</h3>
        <AppChip
          v-if="statusChip"
          :variant="statusChip.variant"
          :label="statusChip.label"
          class="library-row__chip"
        />
      </div>
      <p class="library-row__path">
        <IconCS name="folder" :size="14" class="library-row__path-icon" />
        <code>{{ library.rootPath }}</code>
      </p>
      <p class="library-row__meta">{{ lastScanLabel }}</p>
    </div>

    <div class="library-row__actions">
      <AppButton
        variant="secondary"
        size="sm"
        icon-leading="refresh"
        :label="
          isScanning ? t('pages.libraries.scanningButton') : t('pages.libraries.rescanButton')
        "
        :loading="isScanning || status === 'pending'"
        :disabled="isScanning"
        @click="onRescan"
      />
    </div>
  </article>
</template>

<style scoped lang="scss">
  .library-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);

    &__info {
      flex: 1 1 auto;
      min-width: 0;
    }

    &__name-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    &__name {
      margin: 0;
      font-size: var(--text-md);
      font-weight: 500;
      color: var(--text-fg);
    }

    &__chip {
      flex-shrink: 0;
    }

    &__path {
      margin: 0 0 var(--space-1);
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--text-fg-muted);

      code {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
      }
    }

    &__path-icon {
      flex-shrink: 0;
      color: var(--text-fg-muted);
    }

    &__meta {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-fg-muted);
    }

    &__actions {
      flex-shrink: 0;
    }
  }
</style>
