<template>
  <div class="auth-brand">
    <div class="auth-brand__mark" aria-hidden="true">CS</div>
    <div class="auth-brand__name">CourseShelf</div>
  </div>
</template>

<style lang="scss" scoped>
  $mark-size: 36px; // brand logo square — not a layout space token

  .auth-brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);

    &__mark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: $mark-size;
      height: $mark-size;
      border-radius: var(--radius-md);
      background: var(--brand-accent);
      color: var(--brand-accent-fg);
      font-size: var(--text-sm);
      font-weight: var(--fw-bold);
      letter-spacing: var(--tracking-wide);
      flex-shrink: 0;
    }

    &__name {
      font-size: var(--text-lg);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      letter-spacing: var(--tracking-tight);
    }
  }
</style>
