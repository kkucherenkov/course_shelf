<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

  import IconCS from '../IconCS/IconCS.vue';

  export type NoteSyncState = 'syncing' | 'saved' | 'failed' | 'offline';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      mode?: 'edit' | 'view';
      syncState?: NoteSyncState;
      /** Last successful save timestamp — drives the "Ns ago" label. */
      savedAt?: Date | number;
      /** Debounce window for the `save` event, in milliseconds. */
      debounceMs?: number;
      /** Visible while editing. */
      placeholder?: string;
    }>(),
    {
      mode: 'edit',
      syncState: 'saved',
      savedAt: undefined,
      debounceMs: 600,
      placeholder: 'Write a note in Markdown — # heading, **bold**, *italic*, - list',
    },
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:mode': [mode: 'edit' | 'view'];
    save: [value: string];
    retry: [];
  }>();

  const textareaRef = ref<HTMLTextAreaElement | null>(null);
  const tickRef = ref(0);
  let debounceHandle: ReturnType<typeof setTimeout> | null = null;
  let tickHandle: ReturnType<typeof setInterval> | null = null;

  watch(
    () => props.modelValue,
    () => {
      if (debounceHandle !== null) clearTimeout(debounceHandle);
      debounceHandle = setTimeout(() => {
        emit('save', props.modelValue);
        debounceHandle = null;
      }, props.debounceMs);
    },
  );

  watch(
    () => props.syncState,
    (state) => {
      if (state === 'saved' && tickHandle === null) {
        tickHandle = setInterval(() => {
          tickRef.value += 1;
        }, 1000);
      } else if (state !== 'saved' && tickHandle !== null) {
        clearInterval(tickHandle);
        tickHandle = null;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (debounceHandle !== null) clearTimeout(debounceHandle);
    if (tickHandle !== null) clearInterval(tickHandle);
  });

  function toggleMode(): void {
    emit('update:mode', props.mode === 'edit' ? 'view' : 'edit');
  }

  function applyWrap(marker: string): void {
    const ta = textareaRef.value;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = props.modelValue.slice(0, start);
    const sel = props.modelValue.slice(start, end);
    const after = props.modelValue.slice(end);
    const next = `${before}${marker}${sel}${marker}${after}`;
    emit('update:modelValue', next);
    void nextTick(() => {
      ta.focus();
      ta.setSelectionRange(start + marker.length, end + marker.length);
    });
  }

  function applyLinePrefix(prefix: string): void {
    const ta = textareaRef.value;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = props.modelValue.lastIndexOf('\n', start - 1) + 1;
    const before = props.modelValue.slice(0, lineStart);
    const after = props.modelValue.slice(lineStart);
    const next = `${before}${prefix}${after}`;
    emit('update:modelValue', next);
    void nextTick(() => {
      ta.focus();
      const newPos = start + prefix.length;
      ta.setSelectionRange(newPos, newPos);
    });
  }

  function applyLink(): void {
    const ta = textareaRef.value;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = props.modelValue.slice(start, end) || 'link';
    const before = props.modelValue.slice(0, start);
    const after = props.modelValue.slice(end);
    const wrapped = `[${sel}](url)`;
    const next = `${before}${wrapped}${after}`;
    emit('update:modelValue', next);
    void nextTick(() => {
      ta.focus();
      const urlStart = start + wrapped.indexOf('(') + 1;
      const urlEnd = urlStart + 'url'.length;
      ta.setSelectionRange(urlStart, urlEnd);
    });
  }

  function onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    emit('update:modelValue', value);
  }

  const rendered = computed(() => renderMarkdown(props.modelValue));

  function escapeHtml(s: string): string {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function safeUrl(raw: string): string {
    const trimmed = raw.trim();
    if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
    return '#';
  }

  function renderInline(line: string): string {
    let out = escapeHtml(line);
    out = out.replaceAll(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label: string, url: string) =>
        `<a href="${escapeHtml(safeUrl(url))}" rel="noopener noreferrer">${label}</a>`,
    );
    out = out.replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replaceAll(/(?<![*])\*([^*\n]+)\*(?![*])/g, '<em>$1</em>');
    return out;
  }

  function renderMarkdown(input: string): string {
    if (input.trim().length === 0) return '';
    const blocks = input.split(/\n{2,}/);
    const parts = blocks.map((block) => {
      const lines = block.split('\n');
      const heading = /^(#{1,3})\s+(.+)$/.exec(lines[0] ?? '');
      const headingMarks = heading?.[1];
      const headingText = heading?.[2];
      if (headingMarks && headingText !== undefined && lines.length === 1) {
        const level = headingMarks.length;
        return `<h${String(level)}>${renderInline(headingText)}</h${String(level)}>`;
      }
      if (lines.every((l) => l.startsWith('- '))) {
        const items = lines.map((l) => `<li>${renderInline(l.slice(2))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      const inner = lines.map((l) => renderInline(l)).join('<br />');
      return `<p>${inner}</p>`;
    });
    return parts.join('');
  }

  const syncLabel = computed(() => {
    void tickRef.value;
    if (props.syncState === 'syncing') return 'Syncing…';
    if (props.syncState === 'failed') return 'Failed — retrying';
    if (props.syncState === 'offline') return 'Offline — queued';
    if (!props.savedAt) return 'Saved';
    return `Saved · ${formatAgo(props.savedAt)}`;
  });

  function formatAgo(at: Date | number): string {
    const ms = typeof at === 'number' ? Date.now() - at : Date.now() - at.getTime();
    const seconds = Math.max(0, Math.floor(ms / 1000));
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${String(seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${String(minutes)}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${String(hours)}h ago`;
    const days = Math.floor(hours / 24);
    return `${String(days)}d ago`;
  }

  const syncIcon = computed(() => {
    if (props.syncState === 'syncing') return 'cloud';
    if (props.syncState === 'failed') return 'alert';
    if (props.syncState === 'offline') return 'cloud-down';
    return 'check';
  });
</script>

<template>
  <div class="app-note-editor" :data-mode="mode">
    <div class="app-note-editor__toolbar" role="toolbar" aria-label="Note formatting">
      <button
        type="button"
        class="app-note-editor__tool"
        aria-label="Bold"
        :disabled="mode === 'view'"
        @click="applyWrap('**')"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        class="app-note-editor__tool"
        aria-label="Italic"
        :disabled="mode === 'view'"
        @click="applyWrap('*')"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        class="app-note-editor__tool"
        aria-label="Heading"
        :disabled="mode === 'view'"
        @click="applyLinePrefix('# ')"
      >
        H
      </button>
      <button
        type="button"
        class="app-note-editor__tool"
        aria-label="List"
        :disabled="mode === 'view'"
        @click="applyLinePrefix('- ')"
      >
        <IconCS name="list" :size="14" />
      </button>
      <button
        type="button"
        class="app-note-editor__tool"
        aria-label="Link"
        :disabled="mode === 'view'"
        @click="applyLink"
      >
        <IconCS name="copy" :size="14" />
      </button>
      <span class="app-note-editor__spacer" />
      <button
        type="button"
        class="app-note-editor__toggle"
        :aria-pressed="mode === 'view' ? 'true' : 'false'"
        @click="toggleMode"
      >
        {{ mode === 'edit' ? 'Preview' : 'Edit' }}
      </button>
    </div>

    <textarea
      v-if="mode === 'edit'"
      ref="textareaRef"
      class="app-note-editor__body app-note-editor__body--edit"
      :value="modelValue"
      :placeholder="placeholder"
      aria-label="Note text"
      spellcheck="true"
      @input="onInput"
    />
    <!--
      v-html is required to render the markdown preview. Input is sanitised by
      `renderMarkdown` (HTML-escapes raw input via `escapeHtml`, then re-emits
      a fixed allowlist of tags: h1/h2/h3, ul/li, p, br, strong, em, a). Link
      URLs are routed through `safeUrl`, which only allows http(s)/mailto and
      replaces anything else with `#`.
    -->
    <!-- eslint-disable vue/no-v-html -->
    <div v-else class="app-note-editor__body app-note-editor__body--view" v-html="rendered" />
    <!-- eslint-enable vue/no-v-html -->

    <div class="app-note-editor__sync" role="status" aria-live="polite">
      <IconCS
        :name="syncIcon"
        :size="11"
        :class="`app-note-editor__sync-icon app-note-editor__sync-icon--${syncState}`"
      />
      <span>{{ syncLabel }}</span>
      <button
        v-if="syncState === 'failed'"
        type="button"
        class="app-note-editor__retry"
        @click="emit('retry')"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  // Bundle .note-editor parity. Token aliases (bundle → shipped):
  //   --surface     → --surface-surface
  //   --surface-2   → --surface-raised
  //   --border      → --border-default
  //   --text        → --text-fg
  //   --text-muted  → --text-secondary
  //   --success     → --status-success-fg
  //   --error       → --status-error-fg
  //   --warning     → --status-warning-fg
  //   --d-fast      → --dur-fast
  .app-note-editor {
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;

    &__toolbar {
      display: flex;
      gap: var(--space-1);
      align-items: center;
      padding: 6px;
      border-bottom: 1px solid var(--border-default);
      transition: opacity var(--dur-fast);
    }

    &[data-mode='view'] &__toolbar {
      opacity: 0.4;
      pointer-events: none;
    }

    &__tool {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      display: grid;
      place-items: center;
      color: var(--text-secondary);
      background: transparent;
      border: 0;
      cursor: pointer;
      transition: background var(--dur-fast);

      &:hover:not(:disabled) {
        background: var(--surface-raised);
        color: var(--text-fg);
      }

      &:disabled {
        cursor: default;
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__spacer {
      flex: 1;
    }

    &__toggle {
      padding: 0 10px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: transparent;
      border: 0;
      color: var(--text-fg);
      font-size: var(--text-sm);
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__body {
      padding: var(--space-3);
      min-height: 120px;
      font-size: var(--text-sm);
      line-height: 20px;
      color: var(--text-fg);

      &--edit {
        border: 0;
        outline: none;
        resize: vertical;
        font-family: inherit;
        background: transparent;
        width: 100%;

        &::placeholder {
          color: var(--text-tertiary);
        }
      }

      &--view {
        :deep(h1),
        :deep(h2),
        :deep(h3) {
          font-weight: 600;
          margin: 0 0 var(--space-2);
        }

        :deep(h1) {
          font-size: var(--text-xl);
        }

        :deep(h2) {
          font-size: var(--text-lg);
        }

        :deep(h3) {
          font-size: var(--text-md);
        }

        :deep(p) {
          margin: 0 0 var(--space-2);
        }

        :deep(ul) {
          margin: 0 0 var(--space-2);
          padding-left: var(--space-4);
        }

        :deep(a) {
          color: var(--text-link);
        }
      }
    }

    &__sync {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-top: 1px solid var(--border-default);
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    &__sync-icon {
      &--saved {
        color: var(--status-success-fg);
      }

      &--syncing {
        color: var(--brand-accent);
      }

      &--failed {
        color: var(--status-error-fg);
      }

      &--offline {
        color: var(--status-warning-fg);
      }
    }

    &__retry {
      margin-left: auto;
      padding: 0 var(--space-2);
      height: 22px;
      border-radius: var(--radius-sm);
      background: transparent;
      border: 0;
      color: var(--brand-accent);
      cursor: pointer;
      font-size: var(--text-xs);
      font-weight: 500;

      &:hover {
        background: var(--brand-accent-soft);
      }
    }
  }
</style>
