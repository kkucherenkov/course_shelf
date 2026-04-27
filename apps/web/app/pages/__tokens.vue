<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { useColorMode } from '#imports';
  import { designTokens } from '~/design-tokens.generated';

  const colorMode = useColorMode();

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function readVar(name: string): string {
    if (!import.meta.client) return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ---------------------------------------------------------------------------
  // Color token items
  // ---------------------------------------------------------------------------
  interface ColorItem {
    cssVar: string;
    label: string;
  }

  function buildColorItems(group: string, keys: string[]): ColorItem[] {
    return keys.map((key) => {
      // camelCase → kebab-case: accentHover → accent-hover
      const kebab = key.replaceAll(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
      return { cssVar: `--${group}-${kebab}`, label: key };
    });
  }

  const colorGroups: { id: string; label: string; items: ColorItem[] }[] = [
    {
      id: 'brand',
      label: 'Brand',
      items: buildColorItems('brand', Object.keys(designTokens.color.brand.light)),
    },
    {
      id: 'surface',
      label: 'Surface',
      items: buildColorItems('surface', Object.keys(designTokens.color.surface.light)),
    },
    {
      id: 'border',
      label: 'Border',
      items: buildColorItems('border', Object.keys(designTokens.color.border.light)),
    },
    {
      id: 'text',
      label: 'Text',
      items: buildColorItems('text', Object.keys(designTokens.color.text.light)),
    },
    {
      id: 'status',
      label: 'Status',
      items: buildColorItems('status', Object.keys(designTokens.color.status.light)),
    },
  ];

  // ---------------------------------------------------------------------------
  // Spacing items
  // ---------------------------------------------------------------------------
  interface SpacingItem {
    cssVar: string;
    label: string;
    staticValue: string;
  }

  const spacingItems: SpacingItem[] = Object.entries(designTokens.spacing).map(([key, val]) => ({
    cssVar: `--space-${key}`,
    label: `--space-${key}`,
    staticValue: val,
  }));

  // ---------------------------------------------------------------------------
  // Radius items
  // ---------------------------------------------------------------------------
  interface RadiusItem {
    cssVar: string;
    label: string;
    staticValue: string;
  }

  const radiusItems: RadiusItem[] = Object.entries(designTokens.radius).map(([key, val]) => ({
    cssVar: `--radius-${key}`,
    label: `--radius-${key}`,
    staticValue: val,
  }));

  // ---------------------------------------------------------------------------
  // Typography role items
  // ---------------------------------------------------------------------------
  interface TypoItem {
    role: string;
    cssPrefix: string;
    staticSize: string;
  }

  const typoItems: TypoItem[] = Object.entries(designTokens.typography.role).map(([role]) => {
    // CSS variable prefix is --role-{role}- (h1 → h-1 in CSS)
    const cssRole = role.replace(/^h(\d)$/, 'h-$1');
    const prefix = `--role-${cssRole}`;
    const sizeKey = designTokens.typography.role[role as keyof typeof designTokens.typography.role]
      .size as keyof typeof designTokens.typography.size;
    return {
      role,
      cssPrefix: prefix,
      staticSize: designTokens.typography.size[sizeKey],
    };
  });

  // ---------------------------------------------------------------------------
  // Motion / opacity / z-index raw values
  // ---------------------------------------------------------------------------
  interface RawEntry {
    name: string;
    value: string;
  }

  const durationEntries: RawEntry[] = Object.entries(designTokens.motion.duration).map(
    ([k, v]) => ({ name: `--dur-${k}`, value: v }),
  );
  const easingEntries: RawEntry[] = Object.entries(designTokens.motion.easing).map(([k, v]) => ({
    name: `--ease-${k}`,
    value: v,
  }));
  const liftEntries: RawEntry[] = Object.entries(designTokens.motion.lift).map(([k, v]) => ({
    name: `--lift-${k}`,
    value: v,
  }));
  const opacityEntries: RawEntry[] = Object.entries(designTokens.opacity).map(([k, v]) => ({
    name: `--opacity-${k.replaceAll(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)}`,
    value: String(v),
  }));

  // ---------------------------------------------------------------------------
  // Computed live CSS values for colors (re-read when theme changes)
  // ---------------------------------------------------------------------------
  const allColorCssVars = colorGroups.flatMap((g) => g.items.map((i) => i.cssVar));
  const computedColors = ref<Record<string, string>>({});

  function refreshColors(): void {
    const next: Record<string, string> = {};
    for (const v of allColorCssVars) {
      next[v] = readVar(v);
    }
    computedColors.value = next;
  }

  onMounted(refreshColors);
  watch(() => colorMode.value, refreshColors);
</script>

<template>
  <div class="page-tokens">
    <!-- --------------------------------------------------------- Header -->
    <header class="page-tokens__header">
      <div class="page-tokens__header-text">
        <h1 class="page-tokens__title">Foundations</h1>
        <p class="page-tokens__subtitle">
          Visual inventory of every design token. Toggle the theme to see light / dark variants.
        </p>
      </div>
      <UColorModeButton class="page-tokens__toggle" />
    </header>

    <!-- --------------------------------------------------------- Colors -->
    <section data-token-category="color" class="page-tokens__section">
      <h2 class="page-tokens__section-title">Color</h2>
      <div v-for="group in colorGroups" :key="group.id" class="page-tokens__color-group">
        <h3 class="page-tokens__color-group-title">
          {{ group.label }}
        </h3>
        <div class="page-tokens__grid page-tokens__grid--color">
          <div v-for="item in group.items" :key="item.cssVar" class="page-tokens__swatch">
            <div
              class="page-tokens__swatch-chip"
              :style="{ background: `var(${item.cssVar})` }"
              :aria-label="item.label"
            />
            <span class="page-tokens__swatch-var">{{ item.cssVar }}</span>
            <span class="page-tokens__swatch-value">{{ computedColors[item.cssVar] || '…' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- --------------------------------------------------------- Spacing -->
    <section data-token-category="spacing" class="page-tokens__section">
      <h2 class="page-tokens__section-title">Spacing</h2>
      <div class="page-tokens__grid page-tokens__grid--list">
        <div v-for="item in spacingItems" :key="item.cssVar" class="page-tokens__spacing-row">
          <div class="page-tokens__spacing-bar" :style="{ width: `var(${item.cssVar})` }" />
          <span class="page-tokens__swatch-var">{{ item.label }}</span>
          <span class="page-tokens__swatch-value">{{ item.staticValue }}</span>
        </div>
      </div>
    </section>

    <!-- --------------------------------------------------------- Radius -->
    <section data-token-category="radius" class="page-tokens__section">
      <h2 class="page-tokens__section-title">Radius</h2>
      <div class="page-tokens__grid page-tokens__grid--color">
        <div v-for="item in radiusItems" :key="item.cssVar" class="page-tokens__swatch">
          <div class="page-tokens__radius-chip" :style="{ borderRadius: `var(${item.cssVar})` }" />
          <span class="page-tokens__swatch-var">{{ item.cssVar }}</span>
          <span class="page-tokens__swatch-value">{{ item.staticValue }}</span>
        </div>
      </div>
    </section>

    <!-- --------------------------------------------------------- Typography -->
    <section data-token-category="typography" class="page-tokens__section">
      <h2 class="page-tokens__section-title">Typography</h2>
      <div class="page-tokens__grid page-tokens__grid--list">
        <div v-for="item in typoItems" :key="item.role" class="page-tokens__typo-row">
          <div
            class="page-tokens__typo-specimen"
            :style="{
              fontSize: `var(${item.cssPrefix}-font-size)`,
              fontWeight: `var(${item.cssPrefix}-font-weight)`,
              letterSpacing: `var(${item.cssPrefix}-letter-spacing)`,
              lineHeight: `var(${item.cssPrefix}-line-height)`,
            }"
          >
            The quick brown fox jumps over the lazy dog
          </div>
          <div class="page-tokens__typo-meta">
            <span class="page-tokens__swatch-var">{{ item.role }}</span>
            <span class="page-tokens__swatch-value">{{ item.staticSize }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- --------------------------------------------------------- Motion / Raw -->
    <section data-token-category="motion" class="page-tokens__section">
      <h2 class="page-tokens__section-title">Motion &amp; Raw Values</h2>

      <h3 class="page-tokens__color-group-title">Duration</h3>
      <dl class="page-tokens__dl">
        <template v-for="entry in durationEntries" :key="entry.name">
          <dt class="page-tokens__dt">
            {{ entry.name }}
          </dt>
          <dd class="page-tokens__dd">
            {{ entry.value }}
          </dd>
        </template>
      </dl>

      <h3 class="page-tokens__color-group-title">Easing</h3>
      <dl class="page-tokens__dl">
        <template v-for="entry in easingEntries" :key="entry.name">
          <dt class="page-tokens__dt">
            {{ entry.name }}
          </dt>
          <dd class="page-tokens__dd">
            {{ entry.value }}
          </dd>
        </template>
      </dl>

      <h3 class="page-tokens__color-group-title">Lift</h3>
      <dl class="page-tokens__dl">
        <template v-for="entry in liftEntries" :key="entry.name">
          <dt class="page-tokens__dt">
            {{ entry.name }}
          </dt>
          <dd class="page-tokens__dd">
            {{ entry.value }}
          </dd>
        </template>
      </dl>

      <h3 class="page-tokens__color-group-title">Opacity</h3>
      <dl class="page-tokens__dl">
        <template v-for="entry in opacityEntries" :key="entry.name">
          <dt class="page-tokens__dt">
            {{ entry.name }}
          </dt>
          <dd class="page-tokens__dd">
            {{ entry.value }}
          </dd>
        </template>
      </dl>
    </section>
  </div>
</template>

<style lang="scss" scoped>
  .page-tokens {
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-7) var(--space-6);
    color: var(--text-fg);

    &__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-5);
      margin-bottom: var(--space-7);
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--border-default);
    }

    &__header-text {
      flex: 1;
    }

    &__title {
      font-size: var(--role-h-1-font-size);
      font-weight: var(--role-h-1-font-weight);
      letter-spacing: var(--role-h-1-letter-spacing);
      line-height: var(--role-h-1-line-height);
      margin: 0 0 var(--space-2);
      color: var(--text-loud);
    }

    &__subtitle {
      font-size: var(--role-body-font-size);
      color: var(--text-secondary);
      margin: 0;
    }

    &__toggle {
      flex-shrink: 0;
      margin-top: var(--space-1);
    }

    &__section {
      margin-bottom: var(--space-7);
    }

    &__section-title {
      font-size: var(--role-h-2-font-size);
      font-weight: var(--role-h-2-font-weight);
      letter-spacing: var(--role-h-2-letter-spacing);
      line-height: var(--role-h-2-line-height);
      margin: 0 0 var(--space-5);
      color: var(--text-loud);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-default);
    }

    &__color-group {
      margin-bottom: var(--space-6);
    }

    &__color-group-title {
      font-size: var(--role-h-4-font-size);
      font-weight: var(--role-h-4-font-weight);
      color: var(--text-secondary);
      margin: 0 0 var(--space-4);
    }

    &__grid {
      &--color {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
      }

      &--list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
    }

    &__swatch {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      width: 120px;
    }

    &__swatch-chip {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
      flex-shrink: 0;
    }

    &__swatch-var {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      word-break: break-all;
    }

    &__swatch-value {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      word-break: break-all;
    }

    &__spacing-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      min-height: 28px;
    }

    &__spacing-bar {
      height: 12px;
      background: var(--brand-accent);
      border-radius: var(--radius-sm);
      min-width: 1px;
      flex-shrink: 0;
    }

    &__radius-chip {
      width: 48px;
      height: 48px;
      background: var(--brand-accent-soft);
      border: 2px solid var(--brand-accent);
    }

    &__typo-row {
      padding: var(--space-4);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-surface);
    }

    &__typo-specimen {
      color: var(--text-loud);
      margin-bottom: var(--space-2);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    &__typo-meta {
      display: flex;
      gap: var(--space-3);
      align-items: baseline;
    }

    &__dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--space-2) var(--space-5);
      margin: 0 0 var(--space-5);
    }

    &__dt {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__dd {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
