# Player Transport Controls and Transcript Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the lesson player gets the transport controls people expect from a
video player, shows whether subtitles are on, offers playback speeds as a menu
instead of a cycle, and gives the transcript the width it needs.

**Architecture:** four of the five tasks are markup and styling inside one
`@app/ui` component, `AppPlayerChrome.vue`, whose script already contains the
logic they need — `seekBy`, `togglePlay`, `subtitlesEnabled`. `useLessonPlayer`
is not touched at all. The fifth task relocates `PlayerTranscriptTab` from the
sidebar's tab strip into the player column, which is page-level composition plus
a narrowed `PlayerSidebar` interface.

**Tech Stack:** Vue 3.5 SFCs with scoped SCSS on design tokens, Vitest +
`@vue/test-utils`, Storybook 10.6, vue-i18n via `t()` in `apps/web`.

**Spec:** no feature spec. Five tuxedo findings carry the requirements, and each
one's settled decision is quoted in the task that implements it: 231, 222, 223,
224, 216.

## Global Constraints

Every task's requirements implicitly include this section.

- **`AppPlayerChrome` is i18n-free.** It takes every visible and accessible
  string as a prop with an English default; `apps/web` passes the localized
  value. A new accessible label means a new key on `PlayerChromeAriaLabels`, a
  new English default in `DEFAULT_ARIA`, and a new line in the page's
  `chromeAria` computed at `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue:212`.
- **Both locales, always.** Any key added to `apps/web/i18n/locales/en.ts` is
  added to `apps/web/i18n/locales/ru.ts` in the same commit. `pnpm check:i18n`
  gates it.
- **No teleported or portaled UI inside the chrome.** `chromeToggleFullscreen`
  fullscreens the chrome's own root element, not the `<video>`. Anything
  rendered through a portal lands outside that element and is invisible in
  fullscreen. The speed menu is therefore plain inline markup, positioned with
  CSS.
- **Styling only through tokens:** `var(--brand-*)`, `var(--surface-*)`,
  `var(--text-*)`, `var(--media-*)`, `var(--radius-*)`, `var(--space-*)`,
  `var(--dur-*)`. No hex literals, no `!important`, no inline `style=""` —
  Stylelint fails the build on all three.
- **Rendered DOM carries only `app-player-chrome__*` BEM classes** in
  `packages/ui`, and `player-*` / `page-lesson-player__*` in `apps/web`. No
  Tailwind utilities.
- **No `any`** to escape a type error. The existing `// eslint-disable-next-line`
  lines in the spec files are test-only DOM polyfills and stay as they are.
- **A `@app/ui` component change keeps its story and spec current.**
  `pnpm --filter @app/ui audit:components` fails a component missing either.
- Conventional Commits, enforced by `commitlint`. `husky` runs `lint-staged` on
  every commit, so do not hand-format staged files afterwards.
- Before the first edit, push an entry to the top of `specs/tasks/active.md`
  with id `T-2026-09-17-player-transport-controls`, following
  `specs/tasks/README.md`.

## File Structure

| File | Responsibility | Tasks |
| --- | --- | --- |
| `apps/web/vitest.config.ts` | vitest options for the web package | T1 |
| `packages/ui/src/components/IconCS/IconCS.vue` | the icon set; one `<template v-else-if="name === '…'">` per icon | T2 |
| `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.vue` | the whole player overlay: scrubber, control row, state overlays | T2, T3, T4 |
| `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.spec.ts` | its colocated spec, 532 lines today | T2, T3, T4 |
| `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.stories.ts` | its stories, 198 lines today | T2, T4 |
| `apps/web/app/components/lesson-player/PlayerSidebar.vue` | the five-tab sidebar | T5 |
| `apps/web/app/components/lesson-player/__tests__/PlayerSidebar.spec.ts` | its spec | T5 |
| `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue` | page composition, aria mapping, layout CSS | T2, T5 |
| `apps/web/i18n/locales/{en,ru}.ts` | locale trees under `pages.lessonPlayer` | T2 |

`PlayerTranscriptTab.vue` itself is **not modified** in T5 — it already takes
`cues`, `activeIndex`, `emptyLabel`, `noMatchLabel`, `filterPlaceholder` and
emits `seek`. Only its mounting point moves.

---

### Task 1: Stop the web page specs timing out under load

Closes tuxedo 231.

**Files:**

- Modify: `apps/web/vitest.config.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing other tasks reference. It runs first so the later tasks'
  test runs are trustworthy.

**Context.** On 2026-09-17 a `turbo run test` with backend and web running in
parallel failed `browse.spec.ts`, `course-detail-admin-actions.spec.ts`,
`index.spec.ts` and `sign-up.spec.ts`, all with `Test timed out in 5000ms` at
the `mount` call. All 583 passed when the web suite ran alone. Mounting a whole
Nuxt page under CPU contention simply exceeds vitest's 5s default, so a loaded
CI runner turns green into red at random.

This raises the ceiling rather than lowering a quality bar: a test timeout is a
heuristic for "hung", and 5s is too tight for a page mount. The alternative —
not mounting whole pages — is a rewrite of four page specs and is filed in the
task as the other option, not chosen here.

- [ ] **Step 1: Reproduce the default**

Run: `pnpm --filter @app/web test app/pages/__tests__/browse.spec.ts`
Expected: PASS in isolation. This confirms the specs are sound and the failure
is contention, not a defect. There is no honest failing test to write first: a
timeout under load is not reproducible on demand.

- [ ] **Step 2: Raise the timeout**

In `apps/web/vitest.config.ts`, inside the `test: { … }` object, add
`testTimeout` immediately before `include`:

```ts
  test: {
    environment: 'happy-dom',
    globals: true,
    // Mounting a whole Nuxt page costs well over vitest's 5s default once
    // another package's suite is competing for CPU. On 2026-09-17 four page
    // specs failed with "Test timed out in 5000ms" at the mount call during a
    // parallel `turbo run test`, and all 583 passed when this suite ran alone
    // (tuxedo 231). The timeout is a hung-process heuristic, not a performance
    // budget, so raising it costs nothing and stops a loaded runner reporting
    // a false red.
    testTimeout: 15_000,
    include: [
```

- [ ] **Step 3: Verify the suite still passes**

Run: `pnpm --filter @app/web test`
Expected: PASS, 83 files / 583 tests.

- [ ] **Step 4: Verify under contention**

Run: `pnpm exec turbo run test`
Expected: PASS for `@app/backend`, `@app/ui` and `@app/web` together.

- [ ] **Step 5: Commit**

```bash
git add apps/web/vitest.config.ts
git commit -m "test(web): give page specs room to mount under parallel load"
```

---

### Task 2: Skip-back and skip-forward buttons, and a play affordance over the video

Closes tuxedo 222.

**Files:**

- Modify: `packages/ui/src/components/IconCS/IconCS.vue`
- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.vue`
- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`
- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.stories.ts`
- Modify: `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`
- Modify: `apps/web/i18n/locales/en.ts`
- Modify: `apps/web/i18n/locales/ru.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  - two new `IconCS` names, `'skip-back'` and `'skip-forward'`, usable as
    `<IconCS name="skip-back" :size="16" />`;
  - two new keys on the exported `PlayerChromeAriaLabels` interface,
    `skipBack: string` and `skipForward: string`;
  - a new BEM block `app-player-chrome__big-play` on the chrome root.

**Context.** Half of this already exists and must not be rewritten.
`AppPlayerChrome.vue` already has `onFrameTap` bound to the root's `@click`,
which reveals the overlay when it has idle-hidden and otherwise toggles play, and
it already has `seekBy(deltaSec)` — clamped to `0` and `props.duration`,
emitting `seek` — which **no button in the template calls**. The skip buttons
were designed and never reached the markup.

What is missing: the two skip buttons, and a large play target over the picture
when playback is not running. The small 16px play button at the bottom of the
control row is the only start affordance today.

- [ ] **Step 1: Write the failing tests**

Append to `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`,
inside the top-level `describe('AppPlayerChrome', …)`:

```ts
  describe('transport controls', () => {
    it('skips back 15 seconds without going below zero', async () => {
      const wrapper = makeWrapper({ position: 5, duration: 600 });
      await wrapper.find('.app-player-chrome__btn--skip-back').trigger('click');
      expect(wrapper.emitted('seek')?.[0]).toEqual([0]);
    });

    it('skips forward 15 seconds without passing the duration', async () => {
      const wrapper = makeWrapper({ position: 595, duration: 600 });
      await wrapper.find('.app-player-chrome__btn--skip-forward').trigger('click');
      expect(wrapper.emitted('seek')?.[0]).toEqual([600]);
    });

    it('skips by exactly 15 seconds away from the boundaries', async () => {
      const wrapper = makeWrapper({ position: 100, duration: 600 });
      await wrapper.find('.app-player-chrome__btn--skip-back').trigger('click');
      await wrapper.find('.app-player-chrome__btn--skip-forward').trigger('click');
      expect(wrapper.emitted('seek')).toEqual([[85], [115]]);
    });

    it('does not skip in an inert state', async () => {
      const wrapper = makeWrapper({ state: 'locked' });
      await wrapper.find('.app-player-chrome__btn--skip-back').trigger('click');
      expect(wrapper.emitted('seek')).toBeUndefined();
    });

    it('labels the skip buttons from ariaLabels', () => {
      const wrapper = makeWrapper({
        ariaLabels: { skipBack: 'Назад 15 секунд', skipForward: 'Вперёд 15 секунд' },
      });
      expect(
        wrapper.find('.app-player-chrome__btn--skip-back').attributes('aria-label'),
      ).toBe('Назад 15 секунд');
      expect(
        wrapper.find('.app-player-chrome__btn--skip-forward').attributes('aria-label'),
      ).toBe('Вперёд 15 секунд');
    });
  });

  describe('big play affordance', () => {
    it('shows over the picture while idle', () => {
      const wrapper = makeWrapper({ state: 'idle' });
      expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(true);
    });

    it('shows while paused', () => {
      const wrapper = makeWrapper({ state: 'paused' });
      expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(true);
    });

    it('is gone while playing', () => {
      const wrapper = makeWrapper({ state: 'playing' });
      expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(false);
    });

    it('stays out of the way of the buffering, error, locked and end overlays', () => {
      for (const state of ['buffering', 'error', 'locked'] as const) {
        const wrapper = makeWrapper({ state });
        expect(wrapper.find('.app-player-chrome__big-play').exists()).toBe(false);
      }
      const ended = makeWrapper({ state: 'end', endNext: { title: 'Next one' } });
      expect(ended.find('.app-player-chrome__big-play').exists()).toBe(false);
    });

    it('emits play when clicked, and does not double-fire through the frame tap', async () => {
      const wrapper = makeWrapper({ state: 'paused' });
      await wrapper.find('.app-player-chrome__big-play').trigger('click');
      expect(wrapper.emitted('play')).toHaveLength(1);
    });
  });
```

The last assertion is the one that matters: `onFrameTap` opts interactive
descendants out with `target.closest('button, [role="slider"], a, dialog')`, so
the big play affordance must be a `<button>` for the tap not to be handled twice.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @app/ui test src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`
Expected: FAIL — every new test errors on an element that does not exist
(`wrapper.find(...)` returns an empty wrapper and `trigger` throws
`Cannot call trigger on an empty DOMWrapper`).

- [ ] **Step 3: Add the two icons**

In `packages/ui/src/components/IconCS/IconCS.vue`, next to the existing
`<!-- speed -->` block, add two more. The set's convention is stroked paths with
no `fill`, sized by the shared 24-unit viewBox:

```html
    <!-- skip-back -->
    <template v-else-if="name === 'skip-back'">
      <path d="M12 5a7 7 0 107 7" />
      <path d="M12 2.5L9 5l3 2.5" />
      <path d="M10.4 15.5V11l-1.4.9" />
      <path d="M13.2 11.6a1.2 1.2 0 012.4 0v2.8a1.2 1.2 0 01-2.4 0z" />
    </template>

    <!-- skip-forward -->
    <template v-else-if="name === 'skip-forward'">
      <path d="M12 5a7 7 0 11-7 7" />
      <path d="M12 2.5L15 5l-3 2.5" />
      <path d="M10.4 15.5V11l-1.4.9" />
      <path d="M13.2 11.6a1.2 1.2 0 012.4 0v2.8a1.2 1.2 0 01-2.4 0z" />
    </template>
```

The two inner paths draw a "15" inside the arc, which is how YouTube and every
other player signals the skip amount; without it the icon reads as a generic
refresh.

`IconCS` has a snapshot spec. After this step run
`pnpm --filter @app/ui test src/components/IconCS -u` once to record the two new
icons, and read the snapshot diff before staging it.

- [ ] **Step 4: Extend the aria interface and defaults**

In `AppPlayerChrome.vue`, add to `PlayerChromeAriaLabels` after `nextLesson`:

```ts
    skipBack: string;
    skipForward: string;
```

and to `DEFAULT_ARIA` after its `nextLesson` line:

```ts
    skipBack: 'Back 15 seconds',
    skipForward: 'Forward 15 seconds',
```

- [ ] **Step 5: Add the buttons to the control row**

In the `app-player-chrome__controls` row, insert the two skip buttons so the row
reads `skip-back · play/pause · skip-forward · prev · next · mute`. Put
skip-back immediately **before** the existing play/pause button and skip-forward
immediately **after** it:

```html
          <button
            type="button"
            class="app-player-chrome__btn app-player-chrome__btn--skip-back"
            :aria-label="aria.skipBack"
            :disabled="isInert"
            @click="seekBy(-SKIP_SECONDS)"
          >
            <IconCS name="skip-back" :size="16" />
          </button>
```

(the existing play/pause `<button>` stays exactly as it is)

```html
          <button
            type="button"
            class="app-player-chrome__btn app-player-chrome__btn--skip-forward"
            :aria-label="aria.skipForward"
            :disabled="isInert"
            @click="seekBy(SKIP_SECONDS)"
          >
            <IconCS name="skip-forward" :size="16" />
          </button>
```

and declare the constant next to the other module-level constants in the script,
above `const props = withDefaults(`:

```ts
  /** Transport skip step. 15s is the interval every mainstream player uses. */
  const SKIP_SECONDS = 15;
```

`seekBy` already returns early when `isInert.value` is true, so the `:disabled`
binding is belt-and-braces for pointer users and the real guard is in the
function.

- [ ] **Step 6: Add the big play affordance**

Inside the chrome root, as a sibling of the existing state overlays and
**after** them so their `v-else-if` chain keeps priority, add:

```html
    <button
      v-if="showBigPlay"
      type="button"
      class="app-player-chrome__big-play"
      :aria-label="aria.play"
      @click="emit('play')"
    >
      <IconCS name="play" :size="32" />
    </button>
```

and the computed next to `isPlaying` / `isInert`:

```ts
  // Only over a picture that is genuinely waiting to be started. The buffering,
  // error, locked and end states each paint their own overlay and must not get
  // a play button on top of them.
  const showBigPlay = computed(() => props.state === 'idle' || props.state === 'paused');
```

Styles, appended to the component's existing SCSS alongside `&__btn`:

```scss
    &__big-play {
      position: absolute;
      inset: 0;
      margin: auto;
      // --space-8 is 64px; the control-row buttons are --space-6 (32px). The
      // whole point of this affordance is that you do not have to aim.
      width: var(--space-8);
      height: var(--space-8);
      border-radius: var(--radius-pill);
      display: grid;
      place-items: center;
      color: var(--media-fg);
      background: var(--media-scrim-strong);
      border: 0;
      cursor: pointer;
      transition:
        background var(--dur-fast),
        transform var(--dur-fast);

      &:hover {
        background: var(--media-fill-hover);
        transform: scale(1.05);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }
```

Every token above was checked against `docs/design/shared/tokens.json`. The
space scale runs `0 4 8 12 16 24 32 48 64 96` for `--space-0` through
`--space-9` and stops there; there is no `--space-16`. Radius offers
`none xs sm md lg xl 2xl pill`, so a circle is `--radius-pill`. The chrome is
painted entirely from the media palette (`--media-fg`, `--media-stage`,
`--media-scrim-*`, `--media-fill-hover`, `--media-track*`) — do not reach into
`--surface-*` here, and never write a literal.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --filter @app/ui test src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`
Expected: PASS, including the 532 lines of pre-existing tests.

- [ ] **Step 8: Check the existing stories cover it — do not add one**

`AppPlayerChrome.stories.ts` already exports `Paused` and `Idle`, both built
from a shared `base` args object. Those are exactly the two states that render
the big play affordance, and the skip buttons appear in every overlay story. No
new story is needed, and adding `PausedWithTransport` beside `Paused` would be
duplication.

Run `pnpm --filter @app/ui storybook` and look at `Domain/AppPlayerChrome →
Paused` to confirm the new controls render and the big play button is centred
over the frame.

- [ ] **Step 9: Wire the localized labels**

In `apps/web/i18n/locales/en.ts`, inside `pages.lessonPlayer.aria`, after
`nextLesson`:

```ts
        skipBack: 'Back 15 seconds',
        skipForward: 'Forward 15 seconds',
```

and in `apps/web/i18n/locales/ru.ts`, same place:

```ts
        skipBack: 'Назад на 15 секунд',
        skipForward: 'Вперёд на 15 секунд',
```

Then in `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`, in the
`chromeAria` computed at line 212, after the `nextLesson` line:

```ts
    skipBack: t('pages.lessonPlayer.aria.skipBack'),
    skipForward: t('pages.lessonPlayer.aria.skipForward'),
```

- [ ] **Step 10: Verify everything**

```sh
pnpm check:i18n
pnpm --filter @app/ui test
pnpm --filter @app/web test
pnpm --filter @app/ui typecheck && pnpm --filter @app/web typecheck
```

Expected: all PASS.

- [ ] **Step 11: Commit**

```bash
git add packages/ui/src/components/IconCS \
        packages/ui/src/components/AppPlayerChrome \
        apps/web/app/pages/courses \
        apps/web/i18n/locales
git commit -m "feat(ui,web): add 15-second skip and a play target over the video"
```

---

### Task 3: Show whether subtitles are on

Closes tuxedo 223.

**Files:**

- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.vue`
- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`

**Interfaces:**

- Consumes: nothing from Task 2 — it edits a different part of the same control
  row. Rebase conflicts are possible in `AppPlayerChrome.vue`; resolve by
  keeping both sides.
- Produces: a `app-player-chrome__btn--active` modifier applied to any
  toggle-style button that is currently on.

**Context.** The data is already there. The subtitles button already receives
`subtitlesEnabled` as a prop, already sets `:aria-pressed`, and already swaps its
`aria-label` between `subtitlesEnable` / `subtitlesDisable` / `subtitlesUnavailable`.
A screen reader knows the state; a sighted user does not, because the button
looks identical either way.

Mute is the exception that proves it: it shows state by swapping the icon
(`volume` / `volume-mute`). Subtitles, pip and fullscreen all carry
`:aria-pressed` with no visual counterpart. One modifier class covers all three.

- [ ] **Step 1: Write the failing tests**

Append to the spec, inside the top-level describe:

```ts
  describe('toggle state is visible, not only announced', () => {
    it('marks the subtitles button active when subtitles are on', () => {
      const wrapper = makeWrapper({ subtitlesEnabled: true });
      const cc = wrapper.find('[aria-pressed="true"].app-player-chrome__btn--subtitles');
      expect(cc.exists()).toBe(true);
      expect(cc.classes()).toContain('app-player-chrome__btn--active');
    });

    it('leaves it unmarked when subtitles are off', () => {
      const wrapper = makeWrapper({ subtitlesEnabled: false });
      const cc = wrapper.find('.app-player-chrome__btn--subtitles');
      expect(cc.classes()).not.toContain('app-player-chrome__btn--active');
    });

    it('never marks it active when the lesson has no subtitle tracks', () => {
      const wrapper = makeWrapper({ subtitlesEnabled: true, subtitlesAvailable: false });
      const cc = wrapper.find('.app-player-chrome__btn--subtitles');
      expect(cc.classes()).not.toContain('app-player-chrome__btn--active');
      expect(cc.attributes('disabled')).toBeDefined();
    });

    it('marks the fullscreen button active in fullscreen', () => {
      const wrapper = makeWrapper({ fullscreen: true });
      expect(
        wrapper.find('.app-player-chrome__btn--fullscreen').classes(),
      ).toContain('app-player-chrome__btn--active');
    });
  });
```

The third test is the one worth having: `subtitlesEnabled` can be `true` while
`subtitlesAvailable` is `false`, and a disabled button lit up as "on" is worse
than no indicator at all.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @app/ui test src/components/AppPlayerChrome/AppPlayerChrome.spec.ts -t "toggle state"`
Expected: FAIL — the elements have no `--subtitles` / `--fullscreen` modifier
class yet, so `find` returns empty wrappers.

- [ ] **Step 3: Add the modifier classes to the three toggle buttons**

Subtitles button — replace its `class` attribute and add the active binding:

```html
            class="app-player-chrome__btn app-player-chrome__btn--subtitles"
            :class="{
              'app-player-chrome__btn--active': subtitlesEnabled && subtitlesAvailable,
            }"
```

Fullscreen button:

```html
            class="app-player-chrome__btn app-player-chrome__btn--fullscreen"
            :class="{ 'app-player-chrome__btn--active': fullscreen }"
```

Picture-in-picture button — it has no "on" prop today, so give it only the
stable modifier class and no active binding:

```html
            class="app-player-chrome__btn app-player-chrome__btn--pip"
```

Everything else about the three buttons — `:aria-label`, `:aria-pressed`,
`:disabled`, `@click` — stays byte-identical.

- [ ] **Step 4: Style the active state**

Append inside the existing `&__btn` block, after its `&:focus-visible` rule:

```scss
      // `aria-pressed` told a screen reader; nothing told anyone looking at it.
      &--active {
        color: var(--brand-accent);
        background: var(--media-fill-hover);
      }
```

Do not rely on colour alone if the tokens make the contrast marginal — the
filled background is what carries the state for a colour-blind user, and the
accent colour is the reinforcement.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @app/ui test src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`
Expected: PASS.

- [ ] **Step 6: Check the a11y addon is still clean**

Run: `pnpm --filter @app/ui storybook:build`
Expected: builds. The Storybook a11y addon audits at `error` level in CI; a
contrast regression on the new active state surfaces there, so eyeball the
button in Storybook against both themes before moving on.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/AppPlayerChrome
git commit -m "fix(ui): show the subtitles and fullscreen toggles as pressed"
```

---

### Task 4: Offer playback speeds as a menu

Closes tuxedo 224.

**Files:**

- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.vue`
- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`
- Modify: `packages/ui/src/components/AppPlayerChrome/AppPlayerChrome.stories.ts`

**Interfaces:**

- Consumes: `app-player-chrome__btn--active` from Task 3 is **not** reused here;
  the menu has its own selected-row styling.
- Produces: a new `speeds?: number[]` prop on `AppPlayerChrome` defaulting to
  `[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]`.

**Context.** The button currently emits `speed(props.speed)` — the value it is
already on. `useLessonPlayer`'s `chromeSpeed` reads that as "same speed clicked"
and advances to the next preset, which is the cycling behaviour the finding
complains about:

```ts
  function chromeSpeed(rate: number): void {
    if (!videoEl) return;
    let next: number;
    if (rate === speed.value) {
      const idx = PLAYBACK_SPEEDS.indexOf(rate as (typeof PLAYBACK_SPEEDS)[number]);
      next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length] ?? 1;
    } else {
      next = (PLAYBACK_SPEEDS as readonly number[]).includes(rate) ? rate : 1;
    }
    videoEl.playbackRate = next;
    speed.value = next;
  }
```

Emitting a **different**, explicit rate takes the `else` branch and sets it
directly. **The composable needs no change**, and touching it would risk the
cycling path that keyboard shortcuts may still rely on.

The menu is inline markup, not a portal — see the Global Constraints: fullscreen
targets the chrome root, and a teleported menu would render outside it.

- [ ] **Step 1: Write the failing tests**

```ts
  describe('playback speed menu', () => {
    it('is closed until the speed button is pressed', () => {
      const wrapper = makeWrapper();
      expect(wrapper.find('.app-player-chrome__speed-menu').exists()).toBe(false);
      expect(
        wrapper.find('.app-player-chrome__btn--speed').attributes('aria-expanded'),
      ).toBe('false');
    });

    it('lists every preset speed when opened', async () => {
      const wrapper = makeWrapper();
      await wrapper.find('.app-player-chrome__btn--speed').trigger('click');
      const items = wrapper.findAll('.app-player-chrome__speed-item');
      expect(items).toHaveLength(7);
      expect(items.map((i) => i.text())).toEqual([
        '0.5×',
        '0.75×',
        '1×',
        '1.25×',
        '1.5×',
        '1.75×',
        '2×',
      ]);
    });

    it('emits the chosen rate, not the current one', async () => {
      const wrapper = makeWrapper({ speed: 1 });
      await wrapper.find('.app-player-chrome__btn--speed').trigger('click');
      await wrapper.findAll('.app-player-chrome__speed-item')[4]!.trigger('click');
      expect(wrapper.emitted('speed')?.[0]).toEqual([1.5]);
    });

    it('closes after a choice', async () => {
      const wrapper = makeWrapper();
      await wrapper.find('.app-player-chrome__btn--speed').trigger('click');
      await wrapper.findAll('.app-player-chrome__speed-item')[0]!.trigger('click');
      expect(wrapper.find('.app-player-chrome__speed-menu').exists()).toBe(false);
    });

    it('marks the current speed as the selected option', async () => {
      const wrapper = makeWrapper({ speed: 1.25 });
      await wrapper.find('.app-player-chrome__btn--speed').trigger('click');
      const selected = wrapper.findAll('.app-player-chrome__speed-item')
        .filter((i) => i.attributes('aria-checked') === 'true');
      expect(selected).toHaveLength(1);
      expect(selected[0]!.text()).toBe('1.25×');
    });

    it('closes on Escape pressed on the trigger, where focus actually is', async () => {
      const wrapper = makeWrapper();
      const trigger = wrapper.find('.app-player-chrome__btn--speed');
      await trigger.trigger('click');
      // Deliberately dispatched at the button, not the menu: the menu is a
      // non-focusable div, so a test that presses Escape on it would pass
      // while the real keyboard path stayed broken.
      await trigger.trigger('keydown', { key: 'Escape' });
      expect(wrapper.find('.app-player-chrome__speed-menu').exists()).toBe(false);
      expect(wrapper.emitted('speed')).toBeUndefined();
    });

    it('honours a custom speeds list', async () => {
      const wrapper = makeWrapper({ speeds: [1, 2] });
      await wrapper.find('.app-player-chrome__btn--speed').trigger('click');
      expect(wrapper.findAll('.app-player-chrome__speed-item')).toHaveLength(2);
    });
  });
```

Note the expected labels: `1×`, not `1.0×`. The existing `speedLabel` computed
uses `toFixed(1)` and renders `1.0×` / `0.8×` — wrong for `0.75`. The menu needs
its own formatter (Step 4), and the trigger button keeps `speedLabel` as is so
no existing test breaks.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @app/ui test src/components/AppPlayerChrome/AppPlayerChrome.spec.ts -t "playback speed menu"`
Expected: FAIL — no `--speed` modifier and no menu element exist.

- [ ] **Step 3: Add the prop**

In the `defineProps` generic, after `speed?: number;`:

```ts
      /** Selectable playback rates. The trigger lists these in order. */
      speeds?: number[];
```

and in the defaults object, after `speed: 1,`:

```ts
      speeds: () => [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
```

- [ ] **Step 4: Add the state and the formatter**

Next to `shortcutsOpen`:

```ts
  const speedMenuOpen = ref(false);
```

and next to `speedLabel`:

```ts
  // `speedLabel` renders the trigger with toFixed(1), which turns 0.75 into
  // "0.8×". Fine for a single glance at the current rate, wrong for a list the
  // user picks from, so the menu formats its own rows exactly.
  function formatSpeed(rate: number): string {
    return `${String(rate)}×`;
  }

  function chooseSpeed(rate: number): void {
    speedMenuOpen.value = false;
    emit('speed', rate);
  }
```

Step 7 revises this one line — closing the menu also has to restart the
overlay's idle timer — so expect to come back to it.


- [ ] **Step 5: Replace the speed button with a trigger plus menu**

Swap the existing speed `<button>` for this wrapper. Everything else in the
control row is untouched:

```html
          <!-- Escape is handled on this wrapper, not on the menu: the menu is a
               div with no tabindex, so it never holds focus. Focus sits on the
               trigger button or a menu item, both inside this wrapper, and the
               keydown bubbles here from either. -->
          <div class="app-player-chrome__speed" @keydown.escape="closeSpeedMenu">
            <button
              type="button"
              class="app-player-chrome__btn app-player-chrome__btn--text app-player-chrome__btn--speed"
              :aria-label="aria.speed"
              :aria-haspopup="'menu'"
              :aria-expanded="speedMenuOpen ? 'true' : 'false'"
              :disabled="isInert"
              @click="toggleSpeedMenu"
            >
              {{ speedLabel }}
            </button>
            <div
              v-if="speedMenuOpen"
              class="app-player-chrome__speed-menu"
              role="menu"
              :aria-label="aria.speed"
            >
              <button
                v-for="rate in speeds"
                :key="rate"
                type="button"
                role="menuitemradio"
                class="app-player-chrome__speed-item"
                :aria-checked="rate === speed ? 'true' : 'false'"
                @click="chooseSpeed(rate)"
              >
                {{ formatSpeed(rate) }}
              </button>
            </div>
          </div>
```

- [ ] **Step 6: Style it**

```scss
    &__speed {
      position: relative;
      display: inline-flex;
    }

    &__speed-menu {
      position: absolute;
      bottom: calc(100% + var(--space-2));
      right: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      min-width: var(--space-8); // 64px — fits "1.75×" with the padding below
      padding: var(--space-1);
      border-radius: var(--radius-md);
      background: var(--media-scrim-strong);
      box-shadow: var(--shadow-md);
    }

    &__speed-item {
      padding: var(--space-1) var(--space-3);
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--media-fg);
      text-align: right;
      font-variant-numeric: tabular-nums;
      cursor: pointer;

      &:hover {
        background: var(--media-fill-hover);
      }

      &[aria-checked='true'] {
        color: var(--brand-accent);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }
```

These names are checked: `--media-scrim-strong`, `--media-fg`,
`--media-fill-hover`, `--brand-accent`, `--radius-md`, `--radius-sm`,
`--shadow-md` and `--space-1/2/3/8` all exist. Staying in the media palette
matters here — the menu floats over the video, so `--surface-*` would be the
page's colour, not the stage's.

- [ ] **Step 7: Keep the overlay from idle-hiding under an open menu**

While playing, the overlay hides itself after `IDLE_HIDE_MS` and would take the
open menu with it. Two things are needed, not one: the guard stops a *new*
timer being scheduled, and cancelling stops the one that is *already* running
from the last pointer move. The real function today is:

```ts
  function scheduleIdleHide(): void {
    clearIdleTimer();
    if (!isPlaying.value) return;
    idleTimer = setTimeout(() => {
      controlsHidden.value = true;
    }, IDLE_HIDE_MS);
  }
```

Change its guard to:

```ts
    if (!isPlaying.value || speedMenuOpen.value) return;
```

and add the two functions Step 5's markup already refers to — `toggleSpeedMenu`
on the trigger and `closeSpeedMenu` on the wrapper's Escape handler:

```ts
  function closeSpeedMenu(): void {
    if (!speedMenuOpen.value) return;
    speedMenuOpen.value = false;
    scheduleIdleHide();
  }

  function toggleSpeedMenu(): void {
    if (speedMenuOpen.value) {
      closeSpeedMenu();
      return;
    }
    speedMenuOpen.value = true;
    // Opening must cancel the timer already ticking from the last pointer
    // move, or the overlay idle-hides out from under the open menu.
    clearIdleTimer();
  }
```

`chooseSpeed` from Step 4 closes the menu too, so route it through the same
close path rather than setting the flag by hand:

```ts
  function chooseSpeed(rate: number): void {
    closeSpeedMenu();
    emit('speed', rate);
  }
```

The test follows the file's existing idle-hide block, which calls
`vi.useFakeTimers()` inside each test and — per the comment there — awaits
`nextTick()` after **every** `advanceTimersByTime`. Assert on the root's
`--idle-hidden` class, the same signal those tests use:

```ts
    it('keeps the overlay up while the speed menu is open', async () => {
      vi.useFakeTimers();
      const wrapper = makeWrapper({ state: 'playing' });
      await wrapper.find('.app-player-chrome__btn--speed').trigger('click');
      vi.advanceTimersByTime(10_000);
      await nextTick();
      expect(wrapper.classes()).not.toContain('app-player-chrome--idle-hidden');
      vi.useRealTimers();
    });
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm --filter @app/ui test src/components/AppPlayerChrome/AppPlayerChrome.spec.ts`
Expected: PASS, all suites.

- [ ] **Step 9: Add a story for a non-default speed**

The menu can only be opened by clicking, and no story in this file uses a `play`
function — do not introduce the first one for this. Add a story that at least
puts the trigger in a non-default state, next to the existing `Muted` story
which follows the same one-line shape:

```ts
export const SpeedChanged: Story = { args: { ...base, state: 'playing', speed: 1.5 } };
```

Then open `Domain/AppPlayerChrome → SpeedChanged` in Storybook and click the
speed button to check the menu's placement, its selected row, and that it sits
above the control row rather than being clipped by the frame.

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/AppPlayerChrome
git commit -m "feat(ui): pick a playback speed from a menu instead of cycling"
```

---

### Task 5: Move the transcript below the video

Closes tuxedo 216.

**Files:**

- Modify: `apps/web/app/components/lesson-player/PlayerSidebar.vue`
- Modify: `apps/web/app/components/lesson-player/__tests__/PlayerSidebar.spec.ts`
- Modify: `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`
- Not modified: `apps/web/app/components/lesson-player/PlayerTranscriptTab.vue`

**Interfaces:**

- Consumes: nothing from Tasks 2-4.
- Produces: a narrowed `PlayerSidebar` interface — the props
  `transcriptCues`, `transcriptActiveIndex`, `tabTranscript`,
  `transcriptEmptyLabel`, `transcriptNoMatchLabel` and
  `transcriptFilterPlaceholder` are **removed**, and the `transcript` value
  disappears from its internal `activeTab` union.

**Context and what the finding got wrong.** Half of tuxedo 216 is already false
and must not be "fixed". The panel **does** have its own scroll container at
desktop widths: `PlayerSidebar.vue` is `height: 100%; overflow: hidden` with
`&__body { flex: 1; overflow-y: auto; }`. Task 114's fix is also intact — the
page CSS uses `height: 100%` with a comment explaining why it is not
`calc(100vh - 56px)`. The layout page-scrolls only below 768px, where
`__layout` deliberately switches to `overflow: visible; height: auto` and the
columns stack, which is right for a phone.

What is real is the width: the sidebar is 360px at xl and 280px at lg, and a
transcript is a reading surface. The settled decision is to give it the player
column's full width, below the video, with its own scroll container. Sections,
notes, bookmarks and materials stay in the sidebar.

- [ ] **Step 1: Write the failing test**

`apps/web/app/components/lesson-player/__tests__/PlayerSidebar.spec.ts` exists
and is narrowly scoped — its header says it covers the tablist accessible name
from issue #597, and that test stays untouched. What changes is its fixture:

1. Delete these six entries from `baseProps`: `transcriptCues`,
   `transcriptActiveIndex`, `tabTranscript`, `transcriptEmptyLabel`,
   `transcriptNoMatchLabel`, `transcriptFilterPlaceholder`.
2. Delete `PlayerTranscriptTab: true` from the `stubs` in `mountSidebar()`.
3. Leave the `vi.mock('@app/ui', …)` fakes alone — `AppTab` renders as
   `<button role="tab">{{ label }}</button>`, which is what the new test reads.

Then add a second `describe` block after the existing one:

```ts
describe('PlayerSidebar — tabs', () => {
  it('offers four tabs, with the transcript no longer among them', () => {
    const wrapper = mountSidebar();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.text())).toEqual([
      'Sections',
      'Notes',
      'Bookmarks',
      'Materials',
    ]);
  });
});
```

Those four strings are the `tabSections` / `tabNotes` / `tabBookmarks` /
`tabMaterials` values already in `baseProps` — read them rather than assuming,
in case the fixture uses different text.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @app/web test app/components/lesson-player/__tests__/PlayerSidebar.spec.ts`
Expected: FAIL — five tabs are rendered, not four.

- [ ] **Step 3: Narrow `PlayerSidebar`**

In `PlayerSidebar.vue`: delete the `import PlayerTranscriptTab from './PlayerTranscriptTab.vue';`
line, the six props listed under Interfaces above, the
`<AppTab value="transcript" …/>` entry, the `<PlayerTranscriptTab v-if="activeTab === 'transcript'" …/>`
block in `__body`, and the `| 'transcript'` member of the `activeTab` union.
Everything else — including the `tabsLabel` comment about issue #597 — stays.

- [ ] **Step 4: Render the transcript in the player column**

In `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`, import the
component next to the other lesson-player imports:

```ts
  import PlayerTranscriptTab from '~/components/lesson-player/PlayerTranscriptTab.vue';
```

Inside `page-lesson-player__player-col`, immediately after the closing
`</AppPlayerChrome>` tag:

```html
          <section
            v-if="transcriptCues.length > 0"
            class="page-lesson-player__transcript"
            :aria-label="t('pages.lessonPlayer.tabTranscript')"
          >
            <h2 class="page-lesson-player__transcript-title">
              {{ t('pages.lessonPlayer.tabTranscript') }}
            </h2>
            <PlayerTranscriptTab
              class="page-lesson-player__transcript-body"
              :cues="transcriptCues"
              :active-index="transcriptActiveIndex"
              :empty-label="t('pages.lessonPlayer.transcript.empty')"
              :no-match-label="t('pages.lessonPlayer.transcript.noMatch')"
              :filter-placeholder="t('pages.lessonPlayer.transcript.filterPlaceholder')"
              @seek="onBookmarkSeek"
            />
          </section>
```

and delete the six transcript props from the `<PlayerSidebar>` element.

The `v-if` matters: with no cues the panel would render only its empty label
under every video, permanently, for every lesson that has not been transcribed —
which is most of them. The sidebar tab could afford that because you had to
choose the tab; a panel that is always on screen cannot. `emptyLabel` stays
wired for the case where cues load late.

- [ ] **Step 5: Give it a scroll container**

The player column is already `display: flex; flex-direction: column; overflow: hidden`,
so the transcript takes the leftover height and scrolls inside itself:

```scss
    &__transcript {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--border-default);
      background: var(--surface-raised);
      overflow: hidden;

      @media (width < 768px) {
        // The column layout page-scrolls below this width by design
        // (see `&__layout`), so a nested scroller here would trap the gesture.
        overflow: visible;
      }
    }

    &__transcript-title {
      padding: var(--space-3) var(--space-4) var(--space-2);
      margin: 0;
    }

    &__transcript-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
```

`min-height: 0` is not decoration: a flex child defaults to `min-height: auto`
and will refuse to shrink below its content, which makes the parent's
`overflow: hidden` clip the transcript instead of scrolling it.

- [ ] **Step 6: Run the tests to verify they pass**

```sh
pnpm --filter @app/web test app/components/lesson-player
pnpm --filter @app/web test app/pages/__tests__
```

Expected: PASS. If a page spec asserted the sidebar's transcript props, update
it to the new interface.

- [ ] **Step 7: Verify the whole thing by hand**

The stack is normally running — check with
`docker ps --format '{{.Names}} {{.Status}}'` before starting anything. Open a
lesson that has a transcript at `http://localhost:8080`, and confirm:

1. the transcript sits below the video at full column width;
2. it scrolls on its own, and the page behind it does not move;
3. the sidebar shows four tabs;
4. a lesson with no transcript shows no panel at all;
5. clicking a cue still seeks.

- [ ] **Step 8: Verify the suite and the gates**

```sh
pnpm check:i18n
pnpm exec turbo run lint typecheck test
```

Expected: all PASS. No new i18n key is introduced by this task — every string
reuses a key the sidebar already passed.

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/components/lesson-player \
        apps/web/app/pages/courses
git commit -m "feat(web): give the transcript the player column's full width"
```

---

## Wrap-up

- [ ] Tick every sub-step in the `specs/tasks/active.md` entry as it lands.
- [ ] Close tuxedo 216, 222, 223, 224 and 231 once the PR merges — read
      `tuxedo list --json` immediately before, since `N` shifts after every
      mutation, and close them in **one** `tuxedo done` call.
- [ ] Prepend a line to the dnote changelog note for `course_shelf`, newest
      first, in the format `YYYY-MM-DD · …`.
- [ ] Move the `active.md` entry to the top of `specs/tasks/done.md` with the
      PR link.

## Out of scope

- The shell lane — tuxedo 215 (one progress primitive everywhere), 217
  (breadcrumbs) and 228 (admin out of the main nav). It is a separate plan
  because it touches this same lesson-player page for breadcrumbs, and two
  lanes editing one file is the collision that costs the most to unpick.
- Keyboard shortcuts for the new skip buttons. The chrome already has a
  shortcuts dialog and a `keydown` handler; adding `J`/`L` there is a
  reasonable follow-up, but the finding asked for visible controls and this
  plan delivers exactly that.
- Making the transcript collapsible. Ship the fixed panel first and see whether
  anyone wants it gone.
