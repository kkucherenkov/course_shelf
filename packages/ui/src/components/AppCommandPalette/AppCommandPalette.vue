<script setup lang="ts">
  import { computed, ref, watch, nextTick } from 'vue';

  import AppDialog from '../AppDialog/AppDialog.vue';
  import IconCS, { type IconName } from '../IconCS/IconCS.vue';

  export interface Command {
    id: string;
    label: string;
    description?: string;
    icon?: IconName;
    group?: string;
  }

  const props = withDefaults(
    defineProps<{
      open: boolean;
      commands: Command[];
      placeholder?: string;
      title?: string;
    }>(),
    { placeholder: 'Type a command…', title: 'Command palette' },
  );

  const emit = defineEmits<{
    'update:open': [value: boolean];
    select: [command: Command];
  }>();

  const query = ref('');
  const activeIndex = ref(0);
  const inputRef = ref<HTMLInputElement | null>(null);

  // Simple substring match — case-insensitive. Replace with a fuzzy lib if needed.
  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return props.commands;
    return props.commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false),
    );
  });

  // Reset query + selection when re-opened.
  watch(
    () => props.open,
    async (next) => {
      if (next) {
        query.value = '';
        activeIndex.value = 0;
        await nextTick();
        inputRef.value?.focus();
      }
    },
  );

  // Clamp activeIndex when the filtered list shrinks.
  watch(filtered, () => {
    if (activeIndex.value >= filtered.value.length) {
      activeIndex.value = Math.max(0, filtered.value.length - 1);
    }
  });

  function onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1);

        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        activeIndex.value = Math.max(activeIndex.value - 1, 0);

        break;
      }
      case 'Enter': {
        event.preventDefault();
        const selected = filtered.value[activeIndex.value];
        if (selected) {
          emit('select', selected);
          emit('update:open', false);
        }

        break;
      }
      // No default
    }
  }

  function onItemClick(command: Command, index: number) {
    activeIndex.value = index;
    emit('select', command);
    emit('update:open', false);
  }

  // Track which group breaks happen; group headers render inside the list.
  const grouped = computed(() => {
    const groups = new Map<string | undefined, Command[]>();
    for (const c of filtered.value) {
      const key = c.group;
      if (!groups.has(key)) groups.set(key, []);
      // groups.has(key) is guaranteed by the set above; get() is always non-null here.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      groups.get(key)!.push(c);
    }
    return groups;
  });
</script>

<template>
  <AppDialog
    :open="open"
    size="sm"
    :title="title"
    dismissible
    @update:open="emit('update:open', $event)"
  >
    <div class="app-command-palette" @keydown="onKeydown">
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        :placeholder="placeholder"
        class="app-command-palette__input"
        role="combobox"
        :aria-expanded="filtered.length > 0"
        aria-controls="cmdk-list"
        aria-autocomplete="list"
      />
      <ul id="cmdk-list" role="listbox" class="app-command-palette__list">
        <template v-for="[group, items] in grouped" :key="group ?? '__nogroup'">
          <li v-if="group" class="app-command-palette__group" role="presentation">
            {{ group }}
          </li>
          <li
            v-for="command in items"
            :key="command.id"
            role="option"
            :aria-selected="filtered.indexOf(command) === activeIndex"
            :class="[
              'app-command-palette__item',
              { 'app-command-palette__item--active': filtered.indexOf(command) === activeIndex },
            ]"
            @click="onItemClick(command, filtered.indexOf(command))"
            @mouseenter="activeIndex = filtered.indexOf(command)"
          >
            <IconCS
              v-if="command.icon"
              :name="command.icon"
              :size="16"
              class="app-command-palette__icon"
            />
            <span class="app-command-palette__label">{{ command.label }}</span>
            <span v-if="command.description" class="app-command-palette__description">{{
              command.description
            }}</span>
          </li>
        </template>
        <li v-if="filtered.length === 0" class="app-command-palette__empty" role="presentation">
          No commands match.
        </li>
      </ul>
    </div>
  </AppDialog>
</template>

<style scoped lang="scss">
  .app-command-palette {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__input {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: var(--surface-page);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      color: var(--text-fg);

      &:focus {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 360px;
      overflow-y: auto;
    }

    &__group {
      padding: var(--space-2) var(--space-3) var(--space-1);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &__item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      color: var(--text-fg);

      &--active {
        background: var(--brand-accent-soft);
      }
    }

    &__icon {
      flex-shrink: 0;
      color: var(--text-secondary);
    }

    &__label {
      flex: 1 1 auto;
      font-size: var(--text-sm);
    }

    &__description {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    &__empty {
      padding: var(--space-3);
      text-align: center;
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }
  }
</style>
