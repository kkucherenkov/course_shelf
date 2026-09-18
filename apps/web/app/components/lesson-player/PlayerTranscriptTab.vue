<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { TranscriptCue } from '~/composables/useTranscriptCues';
  import { formatCueTime } from '~/utils/format-time';

  const props = defineProps<{
    cues: TranscriptCue[];
    /** Index (into `cues`) of the cue under the playhead, `-1` when none. */
    activeIndex: number;
    /** Shown when the lesson has no transcript at all. */
    emptyLabel: string;
    /** Shown when the filter matches none of the cues. */
    noMatchLabel: string;
    /** Placeholder and accessible label for the filter input. */
    filterPlaceholder: string;
  }>();

  const emit = defineEmits<{
    seek: [time: number];
  }>();

  const query = ref('');

  const filteredCues = computed(() => {
    const needle = query.value.trim().toLowerCase();
    if (!needle) return props.cues.map((cue, index) => ({ cue, index }));
    return props.cues
      .map((cue, index) => ({ cue, index }))
      .filter(({ cue }) => cue.text.toLowerCase().includes(needle));
  });

  // Keep the active row in view as playback advances — on a lesson with 80+
  // cues the highlighted row drifts off-screen within seconds otherwise.
  const containerRef = ref<HTMLElement | null>(null);
  const rowRefs = new Map<number, HTMLElement>();

  function setRowRef(index: number, el: Element | null): void {
    if (el instanceof HTMLElement) {
      rowRefs.set(index, el);
    } else {
      rowRefs.delete(index);
    }
  }

  function prefersReducedMotion(): boolean {
    return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // A reader who scrolled the panel themselves is looking for something —
  // the next playhead advance must not yank them back to the active row.
  const userScrolled = ref(false);

  function onUserScroll(): void {
    userScrolled.value = true;
  }

  onMounted(() => {
    containerRef.value?.addEventListener('wheel', onUserScroll, { passive: true });
    containerRef.value?.addEventListener('touchmove', onUserScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    containerRef.value?.removeEventListener('wheel', onUserScroll);
    containerRef.value?.removeEventListener('touchmove', onUserScroll);
  });

  watch(
    () => props.activeIndex,
    (index) => {
      if (userScrolled.value || index < 0) return;
      rowRefs.get(index)?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'nearest',
      });
    },
  );
</script>

<template>
  <div ref="containerRef" class="player-transcript-tab">
    <!-- The panel is no longer gated on the lesson having cues — it moved out
         of the sidebar into the player column and hiding it left "this lesson
         has no transcript" reachable from nowhere. Without this branch the
         filter's own `noMatchLabel` answered instead, telling a reader their
         search found nothing when they had not searched. -->
    <div v-if="props.cues.length === 0" class="player-transcript-tab__empty">
      {{ props.emptyLabel }}
    </div>
    <template v-else>
      <input
        v-model="query"
        type="search"
        class="player-transcript-tab__filter"
        :placeholder="props.filterPlaceholder"
        :aria-label="props.filterPlaceholder"
      />
      <div v-if="filteredCues.length === 0" class="player-transcript-tab__no-match">
        {{ props.noMatchLabel }}
      </div>
      <ul v-else class="player-transcript-tab__list">
        <li v-for="item in filteredCues" :key="item.index" class="player-transcript-tab__item">
          <button
            :ref="(el) => setRowRef(item.index, el as Element | null)"
            type="button"
            class="player-transcript-tab__row"
            :class="{ 'player-transcript-tab__row--active': item.index === props.activeIndex }"
            :aria-current="item.index === props.activeIndex ? 'true' : undefined"
            @click="emit('seek', item.cue.start)"
          >
            <span class="player-transcript-tab__time">{{ formatCueTime(item.cue.start) }}</span>
            <span class="player-transcript-tab__text">{{ item.cue.text }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped lang="scss">
  .player-transcript-tab {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__no-match {
      font-size: var(--text-base);
      color: var(--text-secondary);
      padding: var(--space-4) 0;
      text-align: center;
    }

    &__filter {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
      background: var(--surface-surface);
      color: var(--text-fg);
      font-size: var(--text-sm);

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__item {
      display: block;
    }

    &__row {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background var(--dur-fast);

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &--active {
        background: var(--surface-raised);

        .player-transcript-tab__text {
          color: var(--brand-accent);
        }
      }
    }

    &__time {
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    &__text {
      flex: 1 1 auto;
      font-size: var(--text-base);
      color: var(--text-fg);
    }
  }
</style>
