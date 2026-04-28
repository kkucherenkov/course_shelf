<script setup lang="ts">
  import { computed } from 'vue';

  export interface StepDef {
    id: string;
    label: string;
  }

  const props = defineProps<{
    steps: StepDef[];
    current: string;
  }>();

  const currentIndex = computed(() => props.steps.findIndex((s) => s.id === props.current));

  function stateOf(index: number): 'done' | 'current' | 'upcoming' {
    if (index < currentIndex.value) return 'done';
    if (index === currentIndex.value) return 'current';
    return 'upcoming';
  }
</script>

<template>
  <nav class="auth-stepper" aria-label="Progress">
    <ol class="auth-stepper__list" role="list">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        :class="['auth-stepper__step', `auth-stepper__step--${stateOf(index)}`]"
        :aria-current="stateOf(index) === 'current' ? 'step' : undefined"
      >
        <span class="auth-stepper__num" aria-hidden="true">
          <svg
            v-if="stateOf(index) === 'done'"
            viewBox="0 0 16 16"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 8.5 6 11.5 13 4.5" />
          </svg>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="auth-stepper__label">{{ step.label }}</span>
        <span v-if="index < steps.length - 1" class="auth-stepper__connector" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>

<style lang="scss" scoped>
  .auth-stepper {
    margin-bottom: var(--space-8);

    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 0;
    }

    &__step {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      position: relative;
    }

    &__num {
      $num-size: 24px; // stepper step indicator circle

      display: flex;
      align-items: center;
      justify-content: center;
      width: $num-size;
      height: $num-size;
      border-radius: 50%;
      font-size: var(--text-xs);
      font-weight: var(--fw-semibold);
      flex-shrink: 0;
      border: 2px solid transparent;
      transition:
        background var(--dur-fast) var(--ease-default),
        border-color var(--dur-fast) var(--ease-default),
        color var(--dur-fast) var(--ease-default);
    }

    &__step--done &__num {
      background: var(--brand-accent);
      color: var(--brand-accent-fg);
      border-color: var(--brand-accent);
    }

    &__step--current &__num {
      background: var(--brand-accent);
      color: var(--brand-accent-fg);
      border-color: var(--brand-accent);
    }

    &__step--upcoming &__num {
      background: var(--surface-overlay);
      color: var(--text-fg-muted);
      border-color: var(--border-default);
    }

    &__label {
      font-size: var(--text-sm);
      white-space: nowrap;
    }

    &__step--done &__label {
      color: var(--text-fg-muted);
    }

    &__step--current &__label {
      color: var(--text-fg);
      font-weight: var(--fw-medium);
    }

    &__step--upcoming &__label {
      color: var(--text-fg-subtle);
    }

    &__connector {
      display: block;
      width: var(--space-6);
      height: 1px;
      background: var(--border-default);
      margin: 0 var(--space-2);
    }
  }
</style>
