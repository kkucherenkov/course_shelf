<script setup lang="ts">
  import { computed } from 'vue';

  type Variant = 'sign-in' | 'sign-up' | 'forgot';

  const props = withDefaults(
    defineProps<{
      variant?: Variant;
      title?: string;
    }>(),
    { variant: 'sign-in', title: undefined },
  );

  interface Fact {
    icon: string;
    heading: string;
    body: string;
  }

  interface MarketingContent {
    title: string;
    facts: Fact[];
  }

  const CONTENT: Record<Variant, MarketingContent> = {
    'sign-in': {
      title: 'Pick up exactly where you left off.',
      facts: [
        {
          icon: 'library',
          heading: 'Your shelf, anywhere',
          body: 'Continue from any browser, phone, or living-room TV — progress syncs over your own server.',
        },
        {
          icon: 'cloud-down',
          heading: 'Watch offline',
          body: 'Pin courses to your phone before a flight; finish them on the train.',
        },
        {
          icon: 'lock',
          heading: 'Your data stays here',
          body: 'Self-hosted by design. No telemetry, no third-party sign-ins by default.',
        },
      ],
    },
    'sign-up': {
      title: 'Start with the courses you already have. Add the rest later.',
      facts: [
        {
          icon: 'folder',
          heading: 'Bring your own folder',
          body: 'Point CourseShelf at a directory of MP4s and PDFs — it organises the rest.',
        },
        {
          icon: 'users',
          heading: 'Invite your team',
          body: 'One library, many seats. Permissions per library, not per course.',
        },
        {
          icon: 'check',
          heading: 'Free for self-hosters',
          body: 'No license tiers, no seat fees. Pay if you use the hosted version.',
        },
      ],
    },
    forgot: {
      title: 'Reset is a single email away.',
      facts: [
        {
          icon: 'lock',
          heading: 'Recovery, not lockout',
          body: 'A reset link is emailed to the address on file. Links expire after 60 minutes.',
        },
        {
          icon: 'users',
          heading: 'Or ask an admin',
          body: 'On a team server, your admin can issue a reset from the Users console.',
        },
      ],
    },
  };

  const content = computed<MarketingContent>(() => CONTENT[props.variant]);
  const displayTitle = computed(() => props.title ?? content.value.title);
</script>

<template>
  <aside class="auth-marketing" aria-label="CourseShelf features">
    <div class="auth-marketing__header">
      <div class="auth-marketing__eyebrow">COURSESHELF · v0.1</div>
      <p class="auth-marketing__title">{{ displayTitle }}</p>
    </div>
    <ul class="auth-marketing__facts" role="list">
      <li v-for="fact in content.facts" :key="fact.heading" class="auth-marketing__fact">
        <div class="auth-marketing__fact-icon" aria-hidden="true">
          <svg
            v-if="fact.icon === 'library'"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <svg
            v-else-if="fact.icon === 'cloud-down'"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="8 17 12 21 16 17" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
          </svg>
          <svg
            v-else-if="fact.icon === 'lock'"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <svg
            v-else-if="fact.icon === 'folder'"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <svg
            v-else-if="fact.icon === 'users'"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <svg
            v-else-if="fact.icon === 'check'"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div class="auth-marketing__fact-body">
          <strong class="auth-marketing__fact-heading">{{ fact.heading }}</strong>
          <p class="auth-marketing__fact-text">{{ fact.body }}</p>
        </div>
      </li>
    </ul>
  </aside>
</template>

<style lang="scss" scoped>
  .auth-marketing {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-10) var(--space-12);
    background: var(--brand-accent);
    color: var(--brand-accent-fg);
    height: 100%;

    &__eyebrow {
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      letter-spacing: var(--tracking-widest);
      opacity: 0.65;
      margin-bottom: var(--space-4);
    }

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--fw-bold);
      line-height: var(--leading-snug);
      letter-spacing: var(--tracking-tight);
    }

    &__facts {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    &__fact {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
    }

    &__fact-icon {
      $icon-size: 28px; // marketing fact icon — component-specific size
      display: flex;
      align-items: center;
      justify-content: center;
      width: $icon-size;
      height: $icon-size;
      border-radius: var(--radius-md);
      background: oklch(from var(--brand-accent-fg) l c h / 15%);
      flex-shrink: 0;
    }

    &__fact-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    &__fact-heading {
      font-size: var(--text-sm);
      font-weight: var(--fw-semibold);
    }

    &__fact-text {
      margin: 0;
      font-size: var(--text-sm);
      opacity: 0.8;
      line-height: var(--leading-snug);
    }
  }
</style>
