<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue';
  import { useColorMode } from '#imports';
  import { designTokens } from '~/design-tokens.generated';

  import AppButton from '@app/ui/components/AppButton/AppButton.vue';
  import AppIconButton from '@app/ui/components/AppIconButton/AppIconButton.vue';
  import AppTextField from '@app/ui/components/AppTextField/AppTextField.vue';
  import AppPasswordField from '@app/ui/components/AppPasswordField/AppPasswordField.vue';
  import AppNumberField from '@app/ui/components/AppNumberField/AppNumberField.vue';
  import AppSearchField from '@app/ui/components/AppSearchField/AppSearchField.vue';
  import AppSelect from '@app/ui/components/AppSelect/AppSelect.vue';
  import AppTextarea from '@app/ui/components/AppTextarea/AppTextarea.vue';
  import AppSwitch from '@app/ui/components/AppSwitch/AppSwitch.vue';
  import AppCheckbox from '@app/ui/components/AppCheckbox/AppCheckbox.vue';
  import AppRadio from '@app/ui/components/AppRadio/AppRadio.vue';
  import AppRadioGroup from '@app/ui/components/AppRadioGroup/AppRadioGroup.vue';
  import AppCard from '@app/ui/components/AppCard/AppCard.vue';
  import AppRow from '@app/ui/components/AppRow/AppRow.vue';
  import AppTabs from '@app/ui/components/AppTabs/AppTabs.vue';
  import AppTab from '@app/ui/components/AppTab/AppTab.vue';
  import AppSegmented from '@app/ui/components/AppSegmented/AppSegmented.vue';
  import AppSegmentedItem from '@app/ui/components/AppSegmentedItem/AppSegmentedItem.vue';
  import AppBanner from '@app/ui/components/AppBanner/AppBanner.vue';
  import AppToast from '@app/ui/components/AppToast/AppToast.vue';
  import AppAlert from '@app/ui/components/AppAlert/AppAlert.vue';
  import AppDialog from '@app/ui/components/AppDialog/AppDialog.vue';
  import AppCommandPalette from '@app/ui/components/AppCommandPalette/AppCommandPalette.vue';
  import type { Command } from '@app/ui/components/AppCommandPalette/AppCommandPalette.vue';
  import AppProgressLinear from '@app/ui/components/AppProgressLinear/AppProgressLinear.vue';
  import AppProgressCircle from '@app/ui/components/AppProgressCircle/AppProgressCircle.vue';
  import AppProgressBadge from '@app/ui/components/AppProgressBadge/AppProgressBadge.vue';
  import AppSpinner from '@app/ui/components/AppSpinner/AppSpinner.vue';
  import AppEmptyState from '@app/ui/components/AppEmptyState/AppEmptyState.vue';
  import AppErrorState from '@app/ui/components/AppErrorState/AppErrorState.vue';
  import AppNoPermission from '@app/ui/components/AppNoPermission/AppNoPermission.vue';
  import AppSkeleton from '@app/ui/components/AppSkeleton/AppSkeleton.vue';
  import AppAvatar from '@app/ui/components/AppAvatar/AppAvatar.vue';
  import AppChip from '@app/ui/components/AppChip/AppChip.vue';
  import IconCS from '@app/ui/components/IconCS/IconCS.vue';

  definePageMeta({ layout: 'default' });

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
  // Typography
  // ---------------------------------------------------------------------------
  interface TypoItem {
    role: string;
    cssPrefix: string;
    staticSize: string;
  }

  const typoItems: TypoItem[] = Object.entries(designTokens.typography.role).map(([role]) => {
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
  // Motion
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
  // Buttons
  // ---------------------------------------------------------------------------
  const btnLoading = ref(false);

  function triggerLoading(): void {
    btnLoading.value = true;
    setTimeout(() => {
      btnLoading.value = false;
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // Inputs
  // ---------------------------------------------------------------------------
  const inputText = ref('Distributed Systems');
  const inputSearch = ref('');
  const inputNum = ref<number | null>(1.25);
  const inputSelect = ref<string | null>('recently-watched');
  const inputSwitch1 = ref(true);
  const inputSwitch2 = ref(false);
  const inputCheckbox = ref(true);
  const inputRadio = ref('comfortable');
  const inputTextarea = ref('');
  const inputPassword = ref('mySecret');
  const inputPasswordWithMeter = ref('securePass1!');
  const inputEmpty = ref('');
  const inputError = ref('not-an-email');
  const inputDisabled = ref('locked@example.com');

  const selectOptions = [
    { id: 'recently-watched', label: 'Recently watched' },
    { id: 'newest', label: 'Newest' },
    { id: 'alphabetical', label: 'Alphabetical' },
    { id: 'duration', label: 'Duration' },
  ];

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  const activeTab = ref('sections');
  const activeSeg = ref('grid');

  // ---------------------------------------------------------------------------
  // Overlays
  // ---------------------------------------------------------------------------
  const dialogOpen = ref(false);
  const paletteOpen = ref(false);

  const paletteCommands: Command[] = [
    { id: 'course-1', label: 'Distributed Systems Foundations', icon: 'folder', group: 'Courses' },
    { id: 'course-2', label: 'Modern PostgreSQL', icon: 'folder', group: 'Courses' },
    { id: 'settings-theme', label: 'Switch theme', icon: 'settings', group: 'Settings' },
    { id: 'settings-profile', label: 'Edit profile', icon: 'settings', group: 'Settings' },
  ];

  // ---------------------------------------------------------------------------
  // Chips
  // ---------------------------------------------------------------------------
  const activeChips = ref(['In progress', 'Computer Science', '<10h']);

  function removeChip(chip: string): void {
    activeChips.value = activeChips.value.filter((c) => c !== chip);
  }

  // ---------------------------------------------------------------------------
  // TOC sections
  // ---------------------------------------------------------------------------
  const sections = [
    ['color', 'Color'],
    ['type', 'Typography'],
    ['space', 'Spacing'],
    ['radius', 'Radius'],
    ['motion', 'Motion'],
    ['buttons', 'Buttons'],
    ['inputs', 'Inputs'],
    ['cards', 'Cards'],
    ['rows', 'Rows'],
    ['tabs', 'Tabs & Segmented'],
    ['feedback', 'Feedback'],
    ['overlays', 'Overlays'],
    ['progress', 'Progress'],
    ['empty', 'Empty States'],
    ['skeletons', 'Skeleton'],
    ['avatar', 'Avatar'],
    ['chips', 'Chips'],
  ] as const;
</script>

<template>
  <div class="page-foundations">
    <!-- --------------------------------------------------------- Header -->
    <header class="page-foundations__header">
      <div class="page-foundations__header-text">
        <div class="page-foundations__header-mono">CS-FOUNDATIONS · v0.1</div>
        <h1 class="page-foundations__title">Foundations</h1>
        <p class="page-foundations__subtitle">
          The CourseShelf design system. Every primitive in every state, dark and light. All values
          flow from <code>tokens.json</code>.
        </p>
      </div>
      <UColorModeButton class="page-foundations__toggle" />
    </header>

    <!-- --------------------------------------------------------- TOC Nav -->
    <nav class="page-foundations__toc" aria-label="Sections">
      <a
        v-for="([id, label], i) in sections"
        :key="id"
        :href="`#${id}`"
        class="page-foundations__toc-link"
      >
        <span class="page-foundations__toc-num">{{ String(i + 1).padStart(2, '0') }}</span>
        {{ label }}
      </a>
    </nav>

    <main class="page-foundations__main">
      <!-- ======================================================= 01. COLOR -->
      <section id="color" data-token-category="color" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Color</h2>
        <p class="page-foundations__section-sub">
          A near-black surface stack with warm-paper light counterpart. Single confident accent:
          amber. Teal &amp; indigo support secondary affordances. Each semantic color paired with
          shape/icon — never color alone.
        </p>
        <div v-for="group in colorGroups" :key="group.id" class="page-foundations__color-group">
          <h3 class="page-foundations__color-group-title">{{ group.label }}</h3>
          <div class="page-foundations__grid page-foundations__grid--color">
            <div v-for="item in group.items" :key="item.cssVar" class="page-foundations__swatch">
              <div
                class="page-foundations__swatch-chip"
                :style="{ background: `var(${item.cssVar})` }"
                :aria-label="item.label"
              />
              <span class="page-foundations__swatch-var">{{ item.cssVar }}</span>
              <span class="page-foundations__swatch-value">{{
                computedColors[item.cssVar] || '…'
              }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ======================================================= 02. TYPOGRAPHY -->
      <section id="type" data-token-category="typography" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Typography</h2>
        <p class="page-foundations__section-sub">
          IBM Plex Sans for the UI; IBM Plex Mono for numerals, timestamps, paths. Tabular nums in
          any progress or table context.
        </p>
        <div class="page-foundations__grid page-foundations__grid--list">
          <div v-for="item in typoItems" :key="item.role" class="page-foundations__typo-row">
            <div
              class="page-foundations__typo-specimen"
              :style="{
                fontSize: `var(${item.cssPrefix}-font-size)`,
                fontWeight: `var(${item.cssPrefix}-font-weight)`,
                letterSpacing: `var(${item.cssPrefix}-letter-spacing)`,
                lineHeight: `var(${item.cssPrefix}-line-height)`,
              }"
            >
              The quick brown fox jumps over the lazy dog
            </div>
            <div class="page-foundations__typo-meta">
              <span class="page-foundations__swatch-var">{{ item.role }}</span>
              <span class="page-foundations__swatch-value">{{ item.staticSize }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ======================================================= 03. SPACING -->
      <section id="space" data-token-category="spacing" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Spacing</h2>
        <p class="page-foundations__section-sub">
          4px base scale. Use 1–4 for component internals; 5–7 for component-to-component; 8–9 for
          section-to-section.
        </p>
        <div class="page-foundations__grid page-foundations__grid--list">
          <div
            v-for="item in spacingItems"
            :key="item.cssVar"
            class="page-foundations__spacing-row"
          >
            <div class="page-foundations__spacing-bar" :style="{ width: `var(${item.cssVar})` }" />
            <span class="page-foundations__swatch-var">{{ item.label }}</span>
            <span class="page-foundations__swatch-value">{{ item.staticValue }}</span>
          </div>
        </div>
      </section>

      <!-- ======================================================= 04. RADIUS -->
      <section id="radius" data-token-category="radius" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Radius</h2>
        <p class="page-foundations__section-sub">
          Three radii: sm for inline elements, md for cards &amp; rows, lg for modals &amp; large
          surfaces. Pill for chips &amp; switches.
        </p>
        <div class="page-foundations__grid page-foundations__grid--color">
          <div v-for="item in radiusItems" :key="item.cssVar" class="page-foundations__swatch">
            <div
              class="page-foundations__radius-chip"
              :style="{ borderRadius: `var(${item.cssVar})` }"
            />
            <span class="page-foundations__swatch-var">{{ item.cssVar }}</span>
            <span class="page-foundations__swatch-value">{{ item.staticValue }}</span>
          </div>
        </div>
      </section>

      <!-- ======================================================= 05. MOTION -->
      <section id="motion" data-token-category="motion" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Motion &amp; Raw Values</h2>

        <h3 class="page-foundations__color-group-title">Duration</h3>
        <dl class="page-foundations__dl">
          <template v-for="entry in durationEntries" :key="entry.name">
            <dt class="page-foundations__dt">{{ entry.name }}</dt>
            <dd class="page-foundations__dd">{{ entry.value }}</dd>
          </template>
        </dl>

        <h3 class="page-foundations__color-group-title">Easing</h3>
        <dl class="page-foundations__dl">
          <template v-for="entry in easingEntries" :key="entry.name">
            <dt class="page-foundations__dt">{{ entry.name }}</dt>
            <dd class="page-foundations__dd">{{ entry.value }}</dd>
          </template>
        </dl>

        <h3 class="page-foundations__color-group-title">Lift</h3>
        <dl class="page-foundations__dl">
          <template v-for="entry in liftEntries" :key="entry.name">
            <dt class="page-foundations__dt">{{ entry.name }}</dt>
            <dd class="page-foundations__dd">{{ entry.value }}</dd>
          </template>
        </dl>

        <h3 class="page-foundations__color-group-title">Opacity</h3>
        <dl class="page-foundations__dl">
          <template v-for="entry in opacityEntries" :key="entry.name">
            <dt class="page-foundations__dt">{{ entry.name }}</dt>
            <dd class="page-foundations__dd">{{ entry.value }}</dd>
          </template>
        </dl>
      </section>

      <!-- ======================================================= 06. BUTTONS -->
      <section id="buttons" data-token-category="buttons" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Buttons</h2>
        <p class="page-foundations__section-sub">
          Primary, secondary, ghost, destructive — each in default, disabled, loading. Sizes sm / md
          / lg. With icon variants. Icon-only <code>AppIconButton</code>.
        </p>

        <!-- Variant × state matrix -->
        <div class="page-foundations__btn-grid">
          <template
            v-for="variant in ['primary', 'secondary', 'ghost', 'destructive'] as const"
            :key="variant"
          >
            <div class="page-foundations__btn-group">
              <span class="page-foundations__label-mono">{{ variant }}</span>
              <AppButton :variant="variant" label="Default" />
              <AppButton :variant="variant" label="Disabled" disabled />
              <AppButton :variant="variant" label="Loading…" loading />
            </div>
          </template>
        </div>

        <!-- Sizes -->
        <h3 class="page-foundations__color-group-title">Sizes</h3>
        <div class="page-foundations__row-flex">
          <AppButton variant="primary" size="sm" label="Small" />
          <AppButton variant="primary" size="md" label="Medium" />
          <AppButton variant="primary" size="lg" label="Large" />
        </div>

        <!-- With icons -->
        <h3 class="page-foundations__color-group-title">With icons</h3>
        <div class="page-foundations__row-flex">
          <AppButton variant="primary" icon-leading="play" label="Resume" />
          <AppButton variant="secondary" icon-leading="download" label="Download" />
          <AppButton variant="ghost" icon-trailing="arrow-right" label="Continue" />
          <AppButton variant="primary" size="sm" icon-leading="play" label="Resume" />
          <AppButton variant="primary" size="lg" icon-leading="play" label="Resume lesson 12" />
          <AppButton
            variant="primary"
            :block="false"
            label="Block"
            :loading="btnLoading"
            @click="triggerLoading"
          />
        </div>

        <!-- AppIconButton -->
        <h3 class="page-foundations__color-group-title">AppIconButton × variant × size</h3>
        <div class="page-foundations__row-flex">
          <template
            v-for="variant in ['primary', 'secondary', 'ghost', 'destructive'] as const"
            :key="variant"
          >
            <AppIconButton :variant="variant" name="bookmark" ariaLabel="Bookmark" size="sm" />
            <AppIconButton :variant="variant" name="bookmark" ariaLabel="Bookmark" size="md" />
            <AppIconButton :variant="variant" name="bookmark" ariaLabel="Bookmark" size="lg" />
          </template>
        </div>
      </section>

      <!-- ======================================================= 07. INPUTS -->
      <section id="inputs" data-token-category="inputs" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Inputs</h2>
        <p class="page-foundations__section-sub">
          Text, search, number, select, switch, checkbox, radio — empty / filled / focus / error /
          disabled.
        </p>
        <div class="page-foundations__inputs-grid">
          <AppTextField
            v-model="inputText"
            label="Display name"
            help="Shown to other users in your household."
          />
          <AppTextField v-model="inputEmpty" label="Empty" placeholder="email@example.com" />
          <AppTextField
            v-model="inputError"
            label="Error state"
            error="Enter a valid email address."
          />
          <AppTextField v-model="inputDisabled" label="Disabled" disabled />
          <AppSearchField
            v-model="inputSearch"
            label="Search"
            placeholder="Search courses, lessons…"
          />
          <AppNumberField v-model="inputNum" label="Default playback speed" :step="0.25" />
          <AppPasswordField
            v-model="inputPassword"
            label="Password"
            auto-complete="current-password"
          />
          <AppPasswordField
            v-model="inputPasswordWithMeter"
            label="New password (with meter)"
            auto-complete="new-password"
            with-meter
          />
          <div class="page-foundations__field-block">
            <span class="page-foundations__label-mono">AppSelect</span>
            <AppSelect
              v-model="inputSelect"
              :options="selectOptions"
              placeholder="Choose sort order…"
            />
          </div>
          <div class="page-foundations__field-block">
            <span class="page-foundations__label-mono">AppTextarea</span>
            <AppTextarea
              v-model="inputTextarea"
              placeholder="Per-lesson notes (Markdown supported)"
            />
          </div>
        </div>

        <!-- Switches / Checkboxes / Radios -->
        <h3 class="page-foundations__color-group-title">Switches · Checkboxes · Radios</h3>
        <div class="page-foundations__row-flex page-foundations__row-flex--wrap">
          <AppSwitch v-model="inputSwitch1" label="Autoplay next lesson" />
          <AppSwitch v-model="inputSwitch2" label="Skip intros" />
          <AppSwitch :model-value="false" label="Disabled switch" disabled />
          <AppCheckbox v-model="inputCheckbox" label="Mark as completed when 95% watched" />
          <AppCheckbox :model-value="false" label="Disabled checkbox" disabled />
          <AppCheckbox model-value indeterminate label="Indeterminate" />
        </div>

        <h3 class="page-foundations__color-group-title">Radio group</h3>
        <AppRadioGroup v-model="inputRadio" name="density" label="List density">
          <AppRadio value="comfortable" label="Comfortable" />
          <AppRadio value="compact" label="Compact" />
        </AppRadioGroup>
      </section>

      <!-- ======================================================= 08. CARDS -->
      <section id="cards" data-token-category="cards" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Cards</h2>
        <p class="page-foundations__section-sub">
          Base card, dashboard tile, hover state. Three radii: rows md, dashboard md, modals lg.
        </p>
        <div class="page-foundations__cards-grid">
          <AppCard title="Base card" description="Used for content blocks and panels." />
          <AppCard
            title="Card with hover"
            description="Hover me — border darkens, surface lifts a step."
            hoverable
          />
          <AppCard
            title="Large card · radius-lg"
            description="For hero or modal-like surfaces."
            size="lg"
          />
          <AppCard
            title="Interactive card"
            description="Focusable, clickable. Enter/Space activates."
            interactive
          />
          <AppCard>
            <template #default>
              <div class="page-foundations__card-stat">
                <span class="page-foundations__card-stat-cap">LIBRARIES</span>
                <span class="page-foundations__card-stat-num">14</span>
                <span class="page-foundations__card-stat-sub">+2 since last week</span>
              </div>
            </template>
          </AppCard>
          <AppCard>
            <template #default>
              <div class="page-foundations__card-stat">
                <span class="page-foundations__card-stat-cap">TOTAL SIZE</span>
                <span class="page-foundations__card-stat-num page-foundations__card-stat-num--mono">
                  2.4<span class="page-foundations__card-stat-unit"> TB</span>
                </span>
                <AppProgressLinear :value="62" label="62% storage used" />
              </div>
            </template>
          </AppCard>
        </div>
      </section>

      <!-- ======================================================= 09. ROWS -->
      <section id="rows" data-token-category="rows" class="page-foundations__section">
        <h2 class="page-foundations__section-title">List rows</h2>
        <p class="page-foundations__section-sub">
          Leading icon or avatar, title + sub, trailing meta. Selected and hover states. Compact
          density on mobile lists.
        </p>
        <div class="page-foundations__two-col">
          <div>
            <p class="page-foundations__label-mono">With leading icon</p>
            <div class="page-foundations__card-inset">
              <AppRow>
                <template #leading>
                  <IconCS name="check-circle" :size="18" />
                </template>
                <div class="page-foundations__row-title">Vector spaces &amp; bases</div>
                <div class="page-foundations__row-sub">Lesson 1 · 12 min</div>
                <template #trailing>12:04</template>
              </AppRow>
              <AppRow selected>
                <template #leading>
                  <IconCS name="play" :size="18" />
                </template>
                <div class="page-foundations__row-title">Linear maps &amp; matrices</div>
                <div class="page-foundations__row-sub">Lesson 2 · 18 min · current</div>
                <template #trailing>04:21 / 18:00</template>
              </AppRow>
              <AppRow>
                <template #leading>
                  <IconCS name="circle" :size="18" />
                </template>
                <div class="page-foundations__row-title">Eigenvalues &amp; eigenvectors</div>
                <div class="page-foundations__row-sub">Lesson 3 · 22 min</div>
                <template #trailing>22:00</template>
              </AppRow>
              <AppRow compact>
                <template #leading>
                  <IconCS name="lock" :size="18" />
                </template>
                <div class="page-foundations__row-title">Singular value decomposition</div>
                <div class="page-foundations__row-sub">Compact · admin-only</div>
                <template #trailing>25:00</template>
              </AppRow>
              <AppRow interactive>
                <template #leading>
                  <IconCS name="circle" :size="18" />
                </template>
                <div class="page-foundations__row-title">Interactive row</div>
                <div class="page-foundations__row-sub">Focusable button</div>
                <template #trailing>
                  <IconCS name="arrow-right" :size="14" />
                </template>
              </AppRow>
            </div>
          </div>
          <div>
            <p class="page-foundations__label-mono">With leading avatar</p>
            <div class="page-foundations__card-inset">
              <AppRow>
                <template #leading>
                  <AppAvatar name="Mira Khoury" role="admin" />
                </template>
                <div class="page-foundations__row-title">Mira Khoury</div>
                <div class="page-foundations__row-sub">Admin · last active 2 min ago</div>
                <template #trailing>
                  <AppIconButton name="more" variant="ghost" size="sm" ariaLabel="More" />
                </template>
              </AppRow>
              <AppRow>
                <template #leading>
                  <AppAvatar name="Elena Lin" />
                </template>
                <div class="page-foundations__row-title">Elena Lin</div>
                <div class="page-foundations__row-sub">User · last active 1 hour ago</div>
                <template #trailing>
                  <AppIconButton name="more" variant="ghost" size="sm" ariaLabel="More" />
                </template>
              </AppRow>
              <AppRow>
                <template #leading>
                  <AppAvatar name="Jordan Diaz" role="guest" />
                </template>
                <div class="page-foundations__row-title">Jordan Diaz</div>
                <div class="page-foundations__row-sub">Guest · 3 grants</div>
                <template #trailing>
                  <AppIconButton name="more" variant="ghost" size="sm" ariaLabel="More" />
                </template>
              </AppRow>
            </div>
          </div>
        </div>
      </section>

      <!-- ======================================================= 10. TABS & SEGMENTED -->
      <section id="tabs" data-token-category="tabs" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Tabs &amp; Segmented controls</h2>
        <p class="page-foundations__section-sub">
          Tabs for primary navigation within a screen; segmented for view-mode toggles.
        </p>
        <div class="page-foundations__tabs-demo">
          <AppTabs v-model="activeTab" label="Course navigation">
            <AppTab value="sections" label="Sections" />
            <AppTab value="notes" label="Notes" />
            <AppTab value="bookmarks" label="Bookmarks" />
            <AppTab value="materials" label="Materials" />
          </AppTabs>
          <p class="page-foundations__demo-note">
            Active tab: <code>{{ activeTab }}</code>
          </p>
        </div>

        <h3 class="page-foundations__color-group-title">Segmented control</h3>
        <div class="page-foundations__row-flex">
          <AppSegmented v-model="activeSeg" label="View mode">
            <AppSegmentedItem value="grid" label="Grid" />
            <AppSegmentedItem value="list" label="List" />
            <AppSegmentedItem value="compact" label="Compact" />
          </AppSegmented>
        </div>
        <p class="page-foundations__demo-note">
          Active segment: <code>{{ activeSeg }}</code>
        </p>
      </section>

      <!-- ======================================================= 11. FEEDBACK -->
      <section id="feedback" data-token-category="feedback" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Feedback</h2>
        <p class="page-foundations__section-sub">
          Banners (info/success/warning/error), toasts, inline alerts. Sync indicators are inline,
          never modal.
        </p>

        <h3 class="page-foundations__color-group-title">Banners</h3>
        <div class="page-foundations__feedback-list">
          <AppBanner
            variant="info"
            title="Self-registration is disabled"
            body="New users must be invited by an admin."
          />
          <AppBanner
            variant="success"
            title="Library scan complete"
            body="42 courses added · 3 updated · 0 errors."
          />
          <AppBanner
            variant="warning"
            title="Storage 88% full"
            body="Free up space or downloads will fail."
          />
          <AppBanner
            variant="error"
            title="Couldn't reach the server"
            body="Retrying in 5 seconds."
            dismissible
          />
        </div>

        <h3 class="page-foundations__color-group-title">Toasts</h3>
        <div class="page-foundations__row-flex page-foundations__row-flex--wrap">
          <AppToast variant="success" message="Bookmark saved at 04:21" />
          <AppToast variant="info" message="Synced to all devices" />
          <AppToast variant="error" message="Couldn't save note — retrying" dismissible />
        </div>

        <h3 class="page-foundations__color-group-title">Inline alerts</h3>
        <div class="page-foundations__row-flex page-foundations__row-flex--wrap">
          <AppAlert variant="info" message="Save pending…" />
          <AppAlert variant="success" message="Saved · 2s ago" />
          <AppAlert variant="warning" message="Outdated version" />
          <AppAlert variant="error" message="Failed to sync" />
        </div>
      </section>

      <!-- ======================================================= 12. OVERLAYS -->
      <section id="overlays" data-token-category="overlays" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Overlays</h2>
        <p class="page-foundations__section-sub">
          Dialogs (sm/md), command palette. Used sparingly — prefer inline.
        </p>
        <div class="page-foundations__row-flex">
          <AppButton variant="secondary" label="Open dialog" @click="dialogOpen = true" />
          <AppButton variant="secondary" label="Command palette" @click="paletteOpen = true" />
        </div>

        <AppDialog
          v-model:open="dialogOpen"
          title="Reset progress?"
          description="This sets every lesson in Distributed Systems Foundations back to not-started. Notes and bookmarks are kept."
        >
          <template #footer>
            <AppButton variant="ghost" label="Cancel" @click="dialogOpen = false" />
            <AppButton variant="destructive" label="Reset progress" @click="dialogOpen = false" />
          </template>
        </AppDialog>

        <AppCommandPalette
          v-model:open="paletteOpen"
          :commands="paletteCommands"
          placeholder="Search courses, lessons, settings…"
        />
      </section>

      <!-- ======================================================= 13. PROGRESS -->
      <section id="progress" data-token-category="progress" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Progress</h2>
        <p class="page-foundations__section-sub">
          Linear, circular, progress badge (ring/bar/pill), spinner. Always pair percentage with bar
          — color alone never carries the meaning.
        </p>

        <h3 class="page-foundations__color-group-title">AppProgressLinear — determinate</h3>
        <div class="page-foundations__progress-list">
          <AppProgressLinear :value="0" label="0% progress" />
          <AppProgressLinear :value="17" label="17% progress" />
          <AppProgressLinear :value="62" label="62% progress" />
          <AppProgressLinear :value="100" label="100% progress" />
          <AppProgressLinear :value="42" thin label="Thin, 42%" />
        </div>

        <h3 class="page-foundations__color-group-title">AppProgressLinear — indeterminate</h3>
        <div class="page-foundations__progress-list">
          <AppProgressLinear label="Loading…" />
        </div>

        <h3 class="page-foundations__color-group-title">AppProgressCircle</h3>
        <div class="page-foundations__row-flex">
          <div v-for="pct in [0, 25, 50, 75, 100]" :key="pct" class="page-foundations__circle-item">
            <AppProgressCircle :value="pct" :size="40" :label="`${pct}%`" />
            <span class="page-foundations__swatch-value">{{ pct }}%</span>
          </div>
        </div>

        <h3 class="page-foundations__color-group-title">AppProgressBadge — pill</h3>
        <div class="page-foundations__row-flex page-foundations__row-flex--wrap">
          <AppProgressBadge variant="pill" state="not-started" :completed="0" :total="10" />
          <AppProgressBadge variant="pill" state="in-progress" :completed="4" :total="10" />
          <AppProgressBadge variant="pill" state="completed" :completed="10" :total="10" />
          <AppProgressBadge variant="pill" state="locked" :completed="0" :total="10" />
        </div>

        <h3 class="page-foundations__color-group-title">AppProgressBadge — ring</h3>
        <div class="page-foundations__row-flex">
          <AppProgressBadge variant="ring" state="not-started" :completed="0" :total="10" />
          <AppProgressBadge variant="ring" state="in-progress" :completed="5" :total="10" />
          <AppProgressBadge variant="ring" state="completed" :completed="10" :total="10" />
          <AppProgressBadge variant="ring" state="locked" :completed="0" :total="10" />
        </div>

        <h3 class="page-foundations__color-group-title">AppProgressBadge — bar</h3>
        <div class="page-foundations__progress-list">
          <AppProgressBadge variant="bar" state="in-progress" :completed="3" :total="10" />
          <AppProgressBadge variant="bar" state="completed" :completed="10" :total="10" />
        </div>

        <h3 class="page-foundations__color-group-title">AppSpinner</h3>
        <div class="page-foundations__row-flex page-foundations__row-flex--accent">
          <AppSpinner size="sm" />
          <AppSpinner size="md" />
          <AppSpinner size="lg" />
        </div>
      </section>

      <!-- ======================================================= 14. EMPTY STATES -->
      <section id="empty" data-token-category="empty" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Empty States</h2>
        <p class="page-foundations__section-sub">
          Name the gap, propose an action. Always offer a way forward — never a dead end.
        </p>
        <div class="page-foundations__empty-grid">
          <AppCard>
            <template #default>
              <AppEmptyState
                icon="folder"
                title="No courses yet"
                body="Add a library and CourseShelf will scan it."
              >
                <template #action>
                  <AppButton variant="primary" size="sm" label="Add library" />
                </template>
              </AppEmptyState>
            </template>
          </AppCard>
          <AppCard>
            <template #default>
              <AppEmptyState
                icon="search"
                title='No results for "kafka stream"'
                body="Try a broader term, or remove the duration filter."
              >
                <template #action>
                  <AppButton variant="secondary" size="sm" label="Clear filters" />
                </template>
              </AppEmptyState>
            </template>
          </AppCard>
          <AppCard>
            <template #default>
              <AppErrorState
                icon="alert"
                title="Couldn't load lessons"
                body="The server returned an error. Your progress is safe."
              >
                <template #action>
                  <AppButton
                    variant="secondary"
                    size="sm"
                    icon-leading="refresh"
                    label="Try again"
                  />
                </template>
              </AppErrorState>
            </template>
          </AppCard>
          <AppCard>
            <template #default>
              <AppNoPermission
                icon="lock"
                title="No permission"
                body="Ask an admin to grant you access to this library."
              >
                <template #action>
                  <AppButton variant="secondary" size="sm" label="Contact admin" />
                </template>
              </AppNoPermission>
            </template>
          </AppCard>
        </div>
      </section>

      <!-- ======================================================= 15. SKELETON -->
      <section id="skeletons" data-token-category="skeletons" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Loading Skeleton</h2>
        <p class="page-foundations__section-sub">
          Subtle 1.4s pulse — never aggressive. Used for lists, cards, detail pages. Buttons spin
          instead. Radius: sm / md / pill. Shapes: text-line, rectangular, circular.
        </p>
        <div class="page-foundations__skeleton-grid">
          <!-- Course card skeleton -->
          <div>
            <p class="page-foundations__label-mono">Course card</p>
            <AppCard>
              <template #default>
                <div class="page-foundations__skel-card">
                  <AppSkeleton width="100%" height="80px" radius="sm" />
                  <div class="page-foundations__skel-body">
                    <AppSkeleton width="80%" height="14px" radius="sm" />
                    <AppSkeleton width="50%" height="10px" radius="sm" />
                    <AppSkeleton width="100%" height="4px" radius="sm" />
                  </div>
                </div>
              </template>
            </AppCard>
          </div>
          <!-- Lesson row skeleton -->
          <div>
            <p class="page-foundations__label-mono">Lesson rows</p>
            <AppCard>
              <template #default>
                <div v-for="i in 4" :key="i" class="page-foundations__skel-row">
                  <AppSkeleton width="20px" height="20px" radius="pill" />
                  <div class="page-foundations__skel-row-body">
                    <AppSkeleton :width="`${50 + i * 10}%`" height="12px" radius="sm" />
                    <AppSkeleton width="30%" height="10px" radius="sm" />
                  </div>
                  <AppSkeleton width="48px" height="12px" radius="sm" />
                </div>
              </template>
            </AppCard>
          </div>
          <!-- Detail page skeleton -->
          <div>
            <p class="page-foundations__label-mono">Detail page</p>
            <AppCard>
              <template #default>
                <div class="page-foundations__skel-detail">
                  <AppSkeleton width="120px" height="80px" radius="md" />
                  <div class="page-foundations__skel-detail-body">
                    <AppSkeleton width="70%" height="18px" radius="sm" />
                    <AppSkeleton width="40%" height="10px" radius="sm" />
                    <AppSkeleton width="90%" height="10px" radius="sm" />
                    <AppSkeleton width="85%" height="10px" radius="sm" />
                  </div>
                </div>
              </template>
            </AppCard>
          </div>
        </div>

        <!-- Inline radius showcase -->
        <h3 class="page-foundations__color-group-title">Radius variants</h3>
        <div class="page-foundations__row-flex">
          <div class="page-foundations__skel-item">
            <AppSkeleton width="80px" height="80px" radius="sm" />
            <span class="page-foundations__swatch-value">sm</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppSkeleton width="80px" height="80px" radius="md" />
            <span class="page-foundations__swatch-value">md</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppSkeleton width="80px" height="80px" radius="pill" />
            <span class="page-foundations__swatch-value">pill</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppSkeleton width="80px" height="16px" radius="sm" />
            <span class="page-foundations__swatch-value">text-line</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppSkeleton width="48px" height="48px" radius="pill" />
            <span class="page-foundations__swatch-value">circular</span>
          </div>
        </div>
      </section>

      <!-- ======================================================= 16. AVATAR -->
      <section id="avatar" data-token-category="avatar" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Avatar</h2>
        <p class="page-foundations__section-sub">
          Sizes xs / sm / md / lg / xl. Role badge: ADMIN (amber) · GUEST (indigo). USER has no
          badge — it's the unmarked default.
        </p>

        <h3 class="page-foundations__color-group-title">Sizes</h3>
        <div class="page-foundations__avatar-row">
          <div
            v-for="size in ['xs', 'sm', 'md', 'lg', 'xl'] as const"
            :key="size"
            class="page-foundations__skel-item"
          >
            <AppAvatar name="Elena Lin" :size="size" />
            <span class="page-foundations__swatch-value">{{ size }}</span>
          </div>
        </div>

        <h3 class="page-foundations__color-group-title">Role badges</h3>
        <div class="page-foundations__avatar-row">
          <div class="page-foundations__skel-item">
            <AppAvatar name="Mira Khoury" role="admin" size="md" />
            <span class="page-foundations__swatch-value">admin · md</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppAvatar name="Elena Lin" size="md" />
            <span class="page-foundations__swatch-value">user · md</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppAvatar name="Jordan Diaz" role="guest" size="md" />
            <span class="page-foundations__swatch-value">guest · md</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppAvatar name="Mira Khoury" role="admin" size="lg" />
            <span class="page-foundations__swatch-value">admin · lg</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppAvatar name="Jordan Diaz" role="guest" size="lg" />
            <span class="page-foundations__swatch-value">guest · lg</span>
          </div>
          <div class="page-foundations__skel-item">
            <AppAvatar name="Mira Khoury" role="admin" size="xl" />
            <span class="page-foundations__swatch-value">admin · xl</span>
          </div>
        </div>
      </section>

      <!-- ======================================================= 17. CHIPS -->
      <section id="chips" data-token-category="chips" class="page-foundations__section">
        <h2 class="page-foundations__section-title">Tag / Chip</h2>
        <p class="page-foundations__section-sub">
          Default, primary, semantic, removable. Used for filters, status, tags.
        </p>

        <h3 class="page-foundations__color-group-title">Variants</h3>
        <div class="page-foundations__row-flex page-foundations__row-flex--wrap">
          <AppChip variant="default" label="Default" />
          <AppChip variant="primary" label="Primary" />
          <AppChip variant="success" icon="check-circle" label="Completed" />
          <AppChip variant="warning" icon="alert" label="Outdated" />
          <AppChip variant="error" icon="alert" label="Failed" />
          <AppChip variant="info" icon="info" label="Beta" />
        </div>

        <h3 class="page-foundations__color-group-title">Sizes</h3>
        <div class="page-foundations__row-flex">
          <AppChip size="sm" variant="primary" label="Small" />
          <AppChip size="md" variant="primary" label="Medium" />
          <AppChip size="lg" variant="primary" label="Large" />
        </div>

        <h3 class="page-foundations__color-group-title">Selected &amp; disabled</h3>
        <div class="page-foundations__row-flex">
          <AppChip variant="default" label="Default" selected />
          <AppChip variant="primary" label="Primary selected" selected />
          <AppChip variant="default" label="Disabled" disabled />
        </div>

        <h3 class="page-foundations__color-group-title">Active filters (removable)</h3>
        <div class="page-foundations__row-flex page-foundations__row-flex--wrap">
          <AppChip
            v-for="chip in activeChips"
            :key="chip"
            variant="primary"
            :label="chip"
            removable
            @remove="removeChip(chip)"
          />
          <span v-if="activeChips.length === 0" class="page-foundations__swatch-value">
            No filters · refresh to reset
          </span>
        </div>
      </section>
    </main>

    <footer class="page-foundations__footer">
      CourseShelf · cs-foundations · WCAG 2.1 AA · Reduce-motion respected ·
      {{ sections.length }} sections
    </footer>
  </div>
</template>

<style lang="scss" scoped>
  // SCSS-owned dimensions (no token exists for visual-demo sizes).
  $page-max-w: 1440px;
  $swatch-width: 120px;
  $chip-size: 64px;
  $radius-demo-size: 48px;
  $spacing-bar-h: 12px;
  $spacing-row-min-h: 28px;
  $btn-group-min-w: 160px;
  $toc-num-size: var(--text-xs);
  $progress-max-w: 400px;

  .page-foundations {
    max-width: $page-max-w;
    margin: 0 auto;
    padding: var(--space-7) var(--space-6);
    color: var(--text-fg);

    // ---- Header ----
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

    &__header-mono {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
      letter-spacing: 0.05em;
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
      max-width: 68ch;
    }

    &__toggle {
      flex-shrink: 0;
      margin-top: var(--space-1);
    }

    // ---- TOC ----
    &__toc {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-4);
      margin-bottom: var(--space-7);
      padding: var(--space-4);
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
    }

    &__toc-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      text-decoration: none;
      transition: color var(--dur-fast) var(--ease-default);

      &:hover {
        color: var(--text-fg);
      }
    }

    &__toc-num {
      font-family: var(--font-mono);
      font-size: $toc-num-size;
      opacity: 0.6;
    }

    // ---- Sections ----
    &__main {
      display: flex;
      flex-direction: column;
      gap: var(--space-7);
    }

    &__section {
      scroll-margin-top: var(--space-6);
    }

    &__section-title {
      font-size: var(--role-h-2-font-size);
      font-weight: var(--role-h-2-font-weight);
      letter-spacing: var(--role-h-2-letter-spacing);
      line-height: var(--role-h-2-line-height);
      margin: 0 0 var(--space-3);
      color: var(--text-loud);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-default);
    }

    &__section-sub {
      margin: 0 0 var(--space-5);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      max-width: 80ch;
    }

    &__color-group {
      margin-bottom: var(--space-5);
    }

    &__color-group-title {
      font-size: var(--role-h-4-font-size);
      font-weight: var(--role-h-4-font-weight);
      color: var(--text-secondary);
      margin: var(--space-4) 0 var(--space-3);
    }

    // ---- Grids ----
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

    // ---- Swatches ----
    &__swatch {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      width: $swatch-width;
    }

    &__swatch-chip {
      width: $chip-size;
      height: $chip-size;
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

    // ---- Spacing ----
    &__spacing-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      min-height: $spacing-row-min-h;
    }

    &__spacing-bar {
      height: $spacing-bar-h;
      background: var(--brand-accent);
      border-radius: var(--radius-sm);
      min-width: 1px;
      flex-shrink: 0;
    }

    // ---- Radius ----
    &__radius-chip {
      width: $radius-demo-size;
      height: $radius-demo-size;
      background: var(--brand-accent-soft);
      border: 2px solid var(--brand-accent);
    }

    // ---- Typography ----
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

    // ---- Motion DL ----
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

    // ---- Buttons section ----
    &__btn-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-5);
      margin-bottom: var(--space-5);
    }

    &__btn-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      min-width: $btn-group-min-w;
    }

    &__label-mono {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-bottom: var(--space-1);
      display: block;
    }

    &__row-flex {
      display: flex;
      flex-wrap: nowrap;
      gap: var(--space-3);
      align-items: center;
      margin-bottom: var(--space-4);

      &--wrap {
        flex-wrap: wrap;
      }

      &--accent {
        color: var(--brand-accent);
      }
    }

    // ---- Inputs section ----
    &__inputs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--space-5);
      margin-bottom: var(--space-5);
    }

    &__field-block {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    // ---- Cards section ----
    &__cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--space-4);
    }

    &__card-stat {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-2) 0;
    }

    &__card-stat-cap {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      letter-spacing: 0.06em;
    }

    &__card-stat-num {
      font-size: var(--role-h-2-font-size);
      font-weight: var(--fw-semibold);
      color: var(--text-loud);

      &--mono {
        font-family: var(--font-mono);
      }
    }

    &__card-stat-unit {
      font-size: var(--text-md);
      font-weight: var(--fw-regular);
      color: var(--text-secondary);
    }

    &__card-stat-sub {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    // ---- Rows section ----
    &__two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
    }

    &__card-inset {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: var(--space-2);
    }

    &__row-title {
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-fg);
    }

    &__row-sub {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    // ---- Tabs section ----
    &__tabs-demo {
      margin-bottom: var(--space-5);
    }

    &__demo-note {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin: var(--space-2) 0 0;
    }

    // ---- Feedback section ----
    &__feedback-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
    }

    // ---- Progress section ----
    &__progress-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      max-width: $progress-max-w;
      margin-bottom: var(--space-5);
    }

    &__circle-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }

    // ---- Empty states section ----
    &__empty-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-4);
    }

    // ---- Skeleton section ----
    &__skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-5);
    }

    &__skel-card {
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow: hidden;
    }

    &__skel-body {
      padding: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__skel-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) 0;
    }

    &__skel-row-body {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    &__skel-detail {
      display: flex;
      gap: var(--space-4);
    }

    &__skel-detail-body {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__skel-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }

    // ---- Avatar section ----
    &__avatar-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-5);
      align-items: flex-end;
      margin-bottom: var(--space-4);
    }

    // ---- Footer ----
    &__footer {
      margin-top: var(--space-8);
      padding-top: var(--space-5);
      border-top: 1px solid var(--border-default);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-align: center;
    }
  }
</style>
