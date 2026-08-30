# B3 — Transcript Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a lesson's spoken words visible, searchable inside the lesson, and clickable to seek — and, as a prerequisite, make subtitles work on the web at all.

**Architecture:** Entirely client-side. The backend already serves WebVTT at `GET /api/v1/stream/lessons/{id}/subtitles/{language}` and already lists the available tracks in `LessonDto.subtitles[]`. The lesson page renders one `<track>` per available subtitle; a composable lifts the browser-parsed cues off the video element into a reactive array; a presentational tab renders them. No new endpoint, no schema change, no codegen.

**Tech Stack:** Nuxt 4 (SPA, `ssr: false`), Vue 3 `<script setup>`, TypeScript, `vue-i18n`, Vitest + `@vue/test-utils`, SCSS with design tokens.

**Spec:** [`docs/superpowers/specs/2026-08-29-transcript-first-design.md`](../specs/2026-08-29-transcript-first-design.md)

## Global Constraints

- All user-visible strings go through `t()`. Never ship a literal. Both `apps/web/i18n/locales/en.ts` and `apps/web/i18n/locales/ru.ts` must be updated together — `pnpm check:i18n` enforces key parity.
- Never use `any` to escape a type error.
- No `!important`, no inline `style=""`, no hard-coded hex brand colors. Use CSS custom properties (`var(--space-3)`, `var(--text-secondary)`, `var(--brand-accent)`, …) exactly as the sibling tab components do.
- SCSS follows BEM with the component's own block name, scoped, matching `PlayerBookmarksTab.vue`.
- Conventional Commits, enforced by `commitlint`. Types allowed: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`, `style`.
- Never commit to `main`. Work on a branch; land through a PR.
- Node `>=24` and pnpm `>=10` are required. If `turbo` is "not found", the Node version is wrong — fix that, do not work around it.
- After editing `.ts` / `.vue` / `.scss` files, run in order: `pnpm --filter @app/web lint --fix`, `pnpm stylelint:fix`, `pnpm format`. Never hand-fix what a fixer does.
- Do not edit `packages/api-client-ts/src/generated/`.

## Before you start

Push this entry to the top of `specs/tasks/active.md` — the repository requires it before the first code edit:

```md
## T-2026-08-29-007 — B3 transcript panel in the web player

- Created: 2026-08-29
- Owner: claude
- Spec: [docs/superpowers/specs/2026-08-29-transcript-first-design.md](../../docs/superpowers/specs/2026-08-29-transcript-first-design.md)
- Goal: subtitles render on web, and a transcript tab lets the user read along, filter, and click a line to seek.
- Spec diff: none — no OpenAPI change
- Codegen impact: no
- Sub-steps:
  - [ ] buildSubtitleUrl helper + `<track>` elements on the lesson page
  - [ ] useTranscriptCues composable
  - [ ] PlayerTranscriptTab + sidebar wiring + locales
  - [ ] `?t=` deep link
- Status: in-progress
- Blockers: —
```

## File Structure

| File | Responsibility |
| --- | --- |
| `apps/web/app/utils/subtitle-url.ts` (create) | Pure: derive a subtitle track URL from the signed stream URL. |
| `apps/web/app/utils/__tests__/subtitle-url.spec.ts` (create) | Its spec. |
| `apps/web/app/composables/useTranscriptCues.ts` (create) | Lift browser-parsed cues off a `<video>` into a reactive array; track the active cue. |
| `apps/web/app/composables/__tests__/useTranscriptCues.spec.ts` (create) | Its spec. |
| `apps/web/app/components/lesson-player/PlayerTranscriptTab.vue` (create) | Presentational: render cues, filter, emit `seek`. |
| `apps/web/app/components/lesson-player/__tests__/PlayerTranscriptTab.spec.ts` (create) | Its spec. |
| `apps/web/app/components/lesson-player/PlayerSidebar.vue` (modify) | Add the fifth tab. |
| `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue` (modify) | Render `<track>` elements, wire the composable and the tab, honour `?t=`. |
| `apps/web/i18n/locales/en.ts`, `apps/web/i18n/locales/ru.ts` (modify) | New `pages.lessonPlayer.*` keys. |

Why a composable plus a presentational component rather than one component that reads the DOM: every other tab (`PlayerBookmarksTab`, `PlayerSectionsTab`, `PlayerMaterialsTab`) takes plain data props and emits events. Keeping `PlayerTranscriptTab` presentational matches that and makes it mountable in a test without a real `<video>`.

Why no new `@app/ui` component: the cue list is one scrollable list of buttons with no reuse outside this tab, and `@app/ui` carries a Storybook + parity + `design:audit --strict` obligation that a single-use list does not earn. `PlayerNotesTab` sets the same precedent.

---

### Task 1: Render the subtitle tracks

This is the prerequisite fix. `apps/web/app/composables/useLessonPlayer.ts:205-211` already toggles `videoEl.textTracks`, but the page never renders a `<track>`, so the list is always empty and the player's subtitle button does nothing.

**Files:**
- Create: `apps/web/app/utils/subtitle-url.ts`
- Test: `apps/web/app/utils/__tests__/subtitle-url.spec.ts`
- Modify: `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue` (script `<script setup>` block and the `#frame` template slot at lines 380-390)

**Interfaces:**
- Consumes: `useStreamUrl().url` — an absolute URL of the form `https://host/api/v1/stream/lessons/<id>?token=<jwt>`, already resolved against `runtimeConfig.public.apiBaseUrl` by `useStreamUrl`.
- Produces: `buildSubtitleUrl(streamUrl: string, language: string): string`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/app/utils/__tests__/subtitle-url.spec.ts`:

```ts
/**
 * Spec for buildSubtitleUrl.
 */

import { describe, it, expect } from 'vitest';
import { buildSubtitleUrl } from '../subtitle-url';

const STREAM_URL = 'https://shelf.example/api/v1/stream/lessons/lesson-1?token=abc.def.ghi';

describe('buildSubtitleUrl', () => {
  it('appends the subtitles path segment and keeps the token', () => {
    expect(buildSubtitleUrl(STREAM_URL, 'en')).toBe(
      'https://shelf.example/api/v1/stream/lessons/lesson-1/subtitles/en?token=abc.def.ghi',
    );
  });

  it('encodes the language segment', () => {
    expect(buildSubtitleUrl(STREAM_URL, 'pt br')).toContain('/subtitles/pt%20br?');
  });

  it('preserves a port and a path prefix', () => {
    const url = buildSubtitleUrl(
      'http://localhost:8080/api/v1/stream/lessons/x?token=t',
      'ru',
    );
    expect(url).toBe('http://localhost:8080/api/v1/stream/lessons/x/subtitles/ru?token=t');
  });

  it('returns an empty string for input that is not a URL', () => {
    expect(buildSubtitleUrl('not a url', 'en')).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/web test app/utils/__tests__/subtitle-url.spec.ts`
Expected: FAIL — cannot resolve `../subtitle-url`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/app/utils/subtitle-url.ts`:

```ts
/**
 * WHY this file exists:
 * The `<track>` element cannot send an Authorization header, so the subtitle
 * route takes the same signed `token` query parameter as the video route
 * (see the route description in packages/specs/openapi/openapi.yaml).
 *
 * Rather than plumb the raw token through a second composable return value,
 * we derive the subtitle URL from the already-resolved, already-signed stream
 * URL: same origin, same token, one extra path segment.
 *
 * Returns '' when the input is not a parseable URL, so the caller can render
 * no <track> instead of an <track src="undefined">.
 */
export function buildSubtitleUrl(streamUrl: string, language: string): string {
  let parsed: URL;
  try {
    parsed = new URL(streamUrl);
  } catch {
    return '';
  }
  parsed.pathname = `${parsed.pathname}/subtitles/${encodeURIComponent(language)}`;
  return parsed.toString();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/web test app/utils/__tests__/subtitle-url.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Render the tracks on the page**

In `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`, add the import next to the other `~/` imports:

```ts
  import { buildSubtitleUrl } from '~/utils/subtitle-url';
```

Add this computed after the `useStreamUrl()` destructuring block (around line 66):

```ts
  // ── Subtitle tracks ──────────────────────────────────────────────────────────

  /**
   * One entry per subtitle track the lesson declares. `src` is empty until the
   * signed stream URL has arrived, which is why the template guards on it.
   */
  const subtitleTracks = computed(() =>
    (lessonData.value?.subtitles ?? []).map((s) => ({
      id: s.id,
      language: s.language,
      label: s.label,
      src: streamUrl.value ? buildSubtitleUrl(streamUrl.value, s.language) : '',
    })),
  );

  /** The track that matches the UI locale, if the lesson has one. */
  const defaultSubtitleLanguage = computed<string | null>(() => {
    const tracks = subtitleTracks.value;
    if (tracks.length === 0) return null;
    const match = tracks.find((tr) => tr.language === locale.value);
    return (match ?? tracks[0])?.language ?? null;
  });
```

`locale` comes from `useI18n()`. Change the existing destructuring on line 18 from `const { t } = useI18n();` to:

```ts
  const { t, locale } = useI18n();
```

Replace the `<video>` element in the `#frame` slot with:

```vue
              <video
                ref="videoRef"
                class="page-lesson-player__video"
                :src="streamUrl ?? undefined"
                preload="metadata"
                playsinline
                crossorigin="use-credentials"
                @loadedmetadata="onVideoLoadedMetadata"
              >
                <track
                  v-for="tr in subtitleTracks"
                  :key="tr.id"
                  :src="tr.src || undefined"
                  kind="subtitles"
                  :srclang="tr.language"
                  :label="tr.label"
                  :default="tr.language === defaultSubtitleLanguage"
                />
              </video>
```

- [ ] **Step 6: Verify by hand in the running stack**

The Docker stack is normally already up — check with `docker ps --format '{{.Names}} {{.Status}}'` before starting anything. Open a lesson that has a `.srt` or `.vtt` sidecar at <http://localhost:8080>, press the subtitles button in the player chrome, and confirm captions appear. Before this task they could not, because there was no track to show.

- [ ] **Step 7: Format, lint, commit**

```bash
pnpm --filter @app/web lint --fix
pnpm format
git add apps/web/app/utils/subtitle-url.ts \
        apps/web/app/utils/__tests__/subtitle-url.spec.ts \
        "apps/web/app/pages/courses/[id]/lessons/[lessonId].vue"
git commit -m "fix(web): render subtitle tracks in the lesson player

useLessonPlayer toggled videoEl.textTracks but the page never rendered a
<track>, so the list was always empty and the subtitles button did nothing.
The route was designed for this element and takes the same signed token as
the video, so the URL is derived from the stream URL."
```

---

### Task 2: Lift cues off the video element

**Files:**
- Create: `apps/web/app/composables/useTranscriptCues.ts`
- Test: `apps/web/app/composables/__tests__/useTranscriptCues.spec.ts`

**Interfaces:**
- Consumes: nothing from Task 1 at runtime — it reads whatever `<track>` elements exist on the element it is given.
- Produces:
  ```ts
  export interface TranscriptCue {
    readonly startMs: number;
    readonly endMs: number;
    readonly text: string;
  }

  export interface UseTranscriptCuesOptions {
    videoRef: Ref<HTMLVideoElement | null>;
    position: Ref<number>;          // playhead, in seconds
    preferredLanguage: Ref<string>; // UI locale, e.g. 'en'
  }

  export interface UseTranscriptCuesReturn {
    cues: Ref<TranscriptCue[]>;
    activeIndex: ComputedRef<number>; // -1 when no cue covers `position`
    hasTranscript: ComputedRef<boolean>;
  }

  export function useTranscriptCues(o: UseTranscriptCuesOptions): UseTranscriptCuesReturn;
  ```

**The gotcha this task exists to handle.** A `<track>` without the `default` attribute starts in mode `disabled`, and a disabled track has `cues === null` — the browser does not parse the file at all. The composable must set the chosen track's mode to `'hidden'` (which parses cues without painting them on the video) and must not clobber `'showing'` if the user has subtitles turned on.

- [ ] **Step 1: Write the failing test**

Create `apps/web/app/composables/__tests__/useTranscriptCues.spec.ts`:

```ts
/**
 * Spec for useTranscriptCues.
 */

import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import { useTranscriptCues } from '../useTranscriptCues';

interface FakeCue {
  startTime: number;
  endTime: number;
  text: string;
}

function fakeTrack(language: string, cues: FakeCue[] | null, mode = 'disabled'): TextTrack {
  return { language, mode, cues } as unknown as TextTrack;
}

function fakeVideo(tracks: TextTrack[]): HTMLVideoElement {
  return {
    textTracks: tracks,
    getElementsByTagName: () => [] as unknown as HTMLCollectionOf<HTMLTrackElement>,
  } as unknown as HTMLVideoElement;
}

const EN_CUES: FakeCue[] = [
  { startTime: 0, endTime: 2, text: 'An aggregate is a consistency boundary.' },
  { startTime: 2, endTime: 5, text: 'It has exactly one root.' },
  { startTime: 5, endTime: 9, text: 'Everything outside references the root only.' },
];

describe('useTranscriptCues', () => {
  it('reads cues from the track matching the preferred language', async () => {
    const video = ref(fakeVideo([fakeTrack('ru', []), fakeTrack('en', EN_CUES)]));
    const { cues } = useTranscriptCues({
      videoRef: video,
      position: ref(0),
      preferredLanguage: ref('en'),
    });
    await nextTick();

    expect(cues.value).toHaveLength(3);
    expect(cues.value[0]).toEqual({
      startMs: 0,
      endMs: 2000,
      text: 'An aggregate is a consistency boundary.',
    });
  });

  it('falls back to the first track when the preferred language is absent', async () => {
    const video = ref(fakeVideo([fakeTrack('el', EN_CUES)]));
    const { cues, hasTranscript } = useTranscriptCues({
      videoRef: video,
      position: ref(0),
      preferredLanguage: ref('ru'),
    });
    await nextTick();

    expect(hasTranscript.value).toBe(true);
    expect(cues.value).toHaveLength(3);
  });

  it('enables a disabled track so the browser parses its cues', async () => {
    const track = fakeTrack('en', EN_CUES, 'disabled');
    const video = ref(fakeVideo([track]));
    useTranscriptCues({
      videoRef: video,
      position: ref(0),
      preferredLanguage: ref('en'),
    });
    await nextTick();

    expect(track.mode).toBe('hidden');
  });

  it('leaves a showing track showing', async () => {
    const track = fakeTrack('en', EN_CUES, 'showing');
    const video = ref(fakeVideo([track]));
    useTranscriptCues({
      videoRef: video,
      position: ref(0),
      preferredLanguage: ref('en'),
    });
    await nextTick();

    expect(track.mode).toBe('showing');
  });

  it('reports no transcript when the video has no tracks', async () => {
    const video = ref(fakeVideo([]));
    const { cues, hasTranscript } = useTranscriptCues({
      videoRef: video,
      position: ref(0),
      preferredLanguage: ref('en'),
    });
    await nextTick();

    expect(cues.value).toEqual([]);
    expect(hasTranscript.value).toBe(false);
  });

  it('tolerates a track whose cues have not been parsed yet', async () => {
    const video = ref(fakeVideo([fakeTrack('en', null)]));
    const { cues } = useTranscriptCues({
      videoRef: video,
      position: ref(0),
      preferredLanguage: ref('en'),
    });
    await nextTick();

    expect(cues.value).toEqual([]);
  });

  it('marks the cue covering the playhead as active', async () => {
    const position = ref(0);
    const video = ref(fakeVideo([fakeTrack('en', EN_CUES)]));
    const { activeIndex } = useTranscriptCues({
      videoRef: video,
      position,
      preferredLanguage: ref('en'),
    });
    await nextTick();

    expect(activeIndex.value).toBe(0);
    position.value = 3;
    expect(activeIndex.value).toBe(1);
    position.value = 8.5;
    expect(activeIndex.value).toBe(2);
  });

  it('reports -1 when the playhead is past the last cue', async () => {
    const position = ref(30);
    const video = ref(fakeVideo([fakeTrack('en', EN_CUES)]));
    const { activeIndex } = useTranscriptCues({
      videoRef: video,
      position,
      preferredLanguage: ref('en'),
    });
    await nextTick();

    expect(activeIndex.value).toBe(-1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/web test app/composables/__tests__/useTranscriptCues.spec.ts`
Expected: FAIL — cannot resolve `../useTranscriptCues`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/app/composables/useTranscriptCues.ts`:

```ts
/**
 * useTranscriptCues
 *
 * Lifts the browser's parsed subtitle cues off a <video> element into a plain
 * reactive array, so the transcript tab can stay presentational.
 *
 * The subtlety worth knowing: a <track> without the `default` attribute starts
 * in mode 'disabled', and a disabled TextTrack exposes `cues === null` — the
 * browser has not parsed the file. Setting the mode to 'hidden' makes it parse
 * without painting captions over the video. A track already 'showing' is left
 * alone so the composable never fights the player's subtitle button.
 *
 * Cues arrive asynchronously: the <track> element fires `load` once its file is
 * parsed. We read once immediately (the file may already be cached) and again
 * on `load`.
 */

import { ref, computed, watch, onUnmounted } from 'vue';
import type { Ref, ComputedRef } from 'vue';

export interface TranscriptCue {
  readonly startMs: number;
  readonly endMs: number;
  readonly text: string;
}

export interface UseTranscriptCuesOptions {
  videoRef: Ref<HTMLVideoElement | null>;
  /** Playhead position in seconds. */
  position: Ref<number>;
  /** UI locale — the track for this language wins when the lesson has one. */
  preferredLanguage: Ref<string>;
}

export interface UseTranscriptCuesReturn {
  cues: Ref<TranscriptCue[]>;
  activeIndex: ComputedRef<number>;
  hasTranscript: ComputedRef<boolean>;
}

function pickTrack(video: HTMLVideoElement, preferred: string): TextTrack | null {
  const tracks = video.textTracks;
  let first: TextTrack | null = null;
  for (const track of tracks) {
    first ??= track;
    if (track.language === preferred) return track;
  }
  return first;
}

function readCues(track: TextTrack): TranscriptCue[] {
  const list = track.cues;
  if (!list) return [];
  const out: TranscriptCue[] = [];
  for (let i = 0; i < list.length; i++) {
    const cue = list[i];
    if (!cue) continue;
    // `text` lives on VTTCue, not on the TextTrackCue base type.
    const text = (cue as VTTCue).text ?? '';
    out.push({
      startMs: Math.round(cue.startTime * 1000),
      endMs: Math.round(cue.endTime * 1000),
      text,
    });
  }
  return out;
}

export function useTranscriptCues(options: UseTranscriptCuesOptions): UseTranscriptCuesReturn {
  const { videoRef, position, preferredLanguage } = options;

  const cues = ref<TranscriptCue[]>([]);
  let detachLoad: (() => void) | null = null;

  function refresh(): void {
    const video = videoRef.value;
    if (!video) {
      cues.value = [];
      return;
    }

    const track = pickTrack(video, preferredLanguage.value);
    if (!track) {
      cues.value = [];
      return;
    }

    // 'disabled' means the browser has not parsed the file at all.
    if (track.mode === 'disabled') track.mode = 'hidden';

    cues.value = readCues(track);
  }

  function attachLoadListeners(): void {
    detachLoad?.();
    detachLoad = null;

    const video = videoRef.value;
    if (!video) return;

    const elements = Array.from(video.getElementsByTagName('track'));
    if (elements.length === 0) return;

    const onLoad = (): void => {
      refresh();
    };
    for (const el of elements) el.addEventListener('load', onLoad);
    detachLoad = (): void => {
      for (const el of elements) el.removeEventListener('load', onLoad);
    };
  }

  watch(
    [videoRef, preferredLanguage],
    () => {
      attachLoadListeners();
      refresh();
    },
    { immediate: true, flush: 'post' },
  );

  onUnmounted(() => {
    detachLoad?.();
    detachLoad = null;
  });

  const activeIndex = computed<number>(() => {
    const ms = position.value * 1000;
    return cues.value.findIndex((c) => ms >= c.startMs && ms < c.endMs);
  });

  const hasTranscript = computed<boolean>(() => cues.value.length > 0);

  return { cues, activeIndex, hasTranscript };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/web test app/composables/__tests__/useTranscriptCues.spec.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Format, lint, commit**

```bash
pnpm --filter @app/web lint --fix
pnpm format
git add apps/web/app/composables/useTranscriptCues.ts \
        apps/web/app/composables/__tests__/useTranscriptCues.spec.ts
git commit -m "feat(web): add useTranscriptCues composable

Lifts the browser-parsed subtitle cues off the video element into a reactive
array. Enables a disabled track as 'hidden' so the cues are parsed without
painting captions, and never downgrades a track the user has set to showing."
```

---

### Task 3: The transcript tab

**Files:**
- Create: `apps/web/app/components/lesson-player/PlayerTranscriptTab.vue`
- Test: `apps/web/app/components/lesson-player/__tests__/PlayerTranscriptTab.spec.ts`
- Modify: `apps/web/app/components/lesson-player/PlayerSidebar.vue`
- Modify: `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`
- Modify: `apps/web/i18n/locales/en.ts`, `apps/web/i18n/locales/ru.ts`

**Interfaces:**
- Consumes: `TranscriptCue` and `useTranscriptCues` from Task 2; `buildSubtitleUrl` wiring from Task 1.
- Produces: a component with props `{ cues: TranscriptCue[]; activeIndex: number; filterPlaceholder: string; emptyLabel: string; noMatchLabel: string }` and one emit `seek: [time: number]` — `time` in **seconds**, matching the sidebar's existing `seek` contract (`PlayerBookmarksTab` emits `bookmark.positionSeconds`).

- [ ] **Step 1: Write the failing test**

Create `apps/web/app/components/lesson-player/__tests__/PlayerTranscriptTab.spec.ts`:

```ts
/**
 * Spec for PlayerTranscriptTab component.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayerTranscriptTab from '../PlayerTranscriptTab.vue';

const CUES = [
  { startMs: 0, endMs: 2000, text: 'An aggregate is a consistency boundary.' },
  { startMs: 2000, endMs: 5000, text: 'It has exactly one root.' },
  { startMs: 5000, endMs: 9000, text: 'Everything outside references the root only.' },
];

const baseProps = {
  cues: CUES,
  activeIndex: 1,
  filterPlaceholder: 'Filter transcript',
  emptyLabel: 'No transcript for this lesson.',
  noMatchLabel: 'Nothing matches.',
};

describe('PlayerTranscriptTab', () => {
  it('renders one row per cue', () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    expect(wrapper.findAll('.player-transcript-tab__cue')).toHaveLength(3);
  });

  it('marks the active cue', () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    const rows = wrapper.findAll('.player-transcript-tab__cue');
    expect(rows[1]?.classes()).toContain('player-transcript-tab__cue--active');
    expect(rows[0]?.classes()).not.toContain('player-transcript-tab__cue--active');
  });

  it('emits seek in seconds when a cue is clicked', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    await wrapper.findAll('.player-transcript-tab__cue')[2]?.trigger('click');
    expect(wrapper.emitted('seek')).toEqual([[5]]);
  });

  it('renders a formatted timestamp per cue', () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    expect(wrapper.text()).toContain('0:00');
    expect(wrapper.text()).toContain('0:05');
  });

  it('filters cues by the typed string, case-insensitively', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    await wrapper.find('.player-transcript-tab__filter').setValue('ROOT');
    expect(wrapper.findAll('.player-transcript-tab__cue')).toHaveLength(2);
  });

  it('shows the no-match label when the filter matches nothing', async () => {
    const wrapper = mount(PlayerTranscriptTab, { props: baseProps });
    await wrapper.find('.player-transcript-tab__filter').setValue('zzz');
    expect(wrapper.findAll('.player-transcript-tab__cue')).toHaveLength(0);
    expect(wrapper.text()).toContain('Nothing matches.');
  });

  it('shows the empty label and no filter box when there are no cues', () => {
    const wrapper = mount(PlayerTranscriptTab, {
      props: { ...baseProps, cues: [], activeIndex: -1 },
    });
    expect(wrapper.text()).toContain('No transcript for this lesson.');
    expect(wrapper.find('.player-transcript-tab__filter').exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/web test app/components/lesson-player/__tests__/PlayerTranscriptTab.spec.ts`
Expected: FAIL — cannot resolve `../PlayerTranscriptTab.vue`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/app/components/lesson-player/PlayerTranscriptTab.vue`:

```vue
<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { TranscriptCue } from '~/composables/useTranscriptCues';

  const props = defineProps<{
    cues: TranscriptCue[];
    /** Index into `cues` of the cue covering the playhead, or -1. */
    activeIndex: number;
    filterPlaceholder: string;
    emptyLabel: string;
    noMatchLabel: string;
  }>();

  const emit = defineEmits<{
    seek: [time: number];
  }>();

  const filter = ref('');

  interface VisibleCue extends TranscriptCue {
    /** Index in the unfiltered `cues` array, so the active flag survives filtering. */
    index: number;
  }

  const visibleCues = computed<VisibleCue[]>(() => {
    const rows = props.cues.map((c, index) => ({ ...c, index }));
    const q = filter.value.trim().toLowerCase();
    if (q === '') return rows;
    return rows.filter((c) => c.text.toLowerCase().includes(q));
  });

  function formatTime(ms: number): string {
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
    const ss = String(seconds).padStart(2, '0');
    return hours > 0 ? `${String(hours)}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function onCueClick(cue: VisibleCue): void {
    emit('seek', cue.startMs / 1000);
  }
</script>

<template>
  <div class="player-transcript-tab">
    <p v-if="props.cues.length === 0" class="player-transcript-tab__empty">
      {{ props.emptyLabel }}
    </p>

    <template v-else>
      <input
        v-model="filter"
        type="search"
        class="player-transcript-tab__filter"
        :placeholder="props.filterPlaceholder"
        :aria-label="props.filterPlaceholder"
      />

      <p v-if="visibleCues.length === 0" class="player-transcript-tab__empty">
        {{ props.noMatchLabel }}
      </p>

      <ol v-else class="player-transcript-tab__list">
        <li v-for="cue in visibleCues" :key="cue.index">
          <button
            type="button"
            class="player-transcript-tab__cue"
            :class="{
              'player-transcript-tab__cue--active': cue.index === props.activeIndex,
            }"
            :aria-current="cue.index === props.activeIndex ? 'true' : undefined"
            @click="onCueClick(cue)"
          >
            <span class="player-transcript-tab__time">{{ formatTime(cue.startMs) }}</span>
            <span class="player-transcript-tab__text">{{ cue.text }}</span>
          </button>
        </li>
      </ol>
    </template>
  </div>
</template>

<style scoped lang="scss">
  .player-transcript-tab {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__empty {
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }

    &__filter {
      appearance: none;
      width: 100%;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-primary);
      font-size: var(--text-sm);
      padding: var(--space-2) var(--space-3);

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
      gap: var(--space-1);
    }

    &__cue {
      appearance: none;
      width: 100%;
      display: flex;
      gap: var(--space-3);
      text-align: left;
      border: 0;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-secondary);
      font-size: var(--text-sm);
      padding: var(--space-2) var(--space-3);
      cursor: pointer;
      transition:
        background var(--dur-fast),
        color var(--dur-fast);

      &:hover {
        background: var(--surface-raised);
        color: var(--text-primary);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }

      &--active {
        background: var(--surface-raised);
        color: var(--text-primary);
      }
    }

    &__time {
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
      color: var(--text-tertiary);
    }

    &__text {
      flex: 1;
    }
  }
</style>
```

If `--surface-raised`, `--text-tertiary`, or `--radius-md` do not exist, run `rg '\-\-surface-' packages/ui/src/tokens.generated.ts` and substitute the nearest real token. Do not invent a hex value.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/web test app/components/lesson-player/__tests__/PlayerTranscriptTab.spec.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Add the locale keys**

In `apps/web/i18n/locales/en.ts`, inside `pages.lessonPlayer` (next to `tabMaterials` on line 198):

```ts
      tabTranscript: 'Transcript',
      transcriptEmpty: 'No transcript for this lesson.',
      transcriptNoMatch: 'Nothing matches that filter.',
      transcriptFilterPlaceholder: 'Filter transcript',
```

The same four keys in `apps/web/i18n/locales/ru.ts`, inside the same object:

```ts
      tabTranscript: 'Расшифровка',
      transcriptEmpty: 'Для этого урока нет расшифровки.',
      transcriptNoMatch: 'Ничего не найдено.',
      transcriptFilterPlaceholder: 'Поиск по расшифровке',
```

- [ ] **Step 6: Wire the tab into the sidebar**

In `apps/web/app/components/lesson-player/PlayerSidebar.vue`:

Add the import beside its siblings:

```ts
  import PlayerTranscriptTab from './PlayerTranscriptTab.vue';
  import type { TranscriptCue } from '~/composables/useTranscriptCues';
```

Add to `defineProps`:

```ts
    cues: TranscriptCue[];
    activeCueIndex: number;
    tabTranscript: string;
    transcriptEmpty: string;
    transcriptNoMatch: string;
    transcriptFilterPlaceholder: string;
```

Widen the `activeTab` ref:

```ts
  const activeTab = ref<'sections' | 'notes' | 'bookmarks' | 'materials' | 'transcript'>(
    'sections',
  );
```

Add the tab button after the materials one:

```vue
      <AppTab value="transcript" :label="props.tabTranscript" />
```

And the panel after `PlayerMaterialsTab`:

```vue
      <PlayerTranscriptTab
        v-else-if="activeTab === 'transcript'"
        :cues="props.cues"
        :active-index="props.activeCueIndex"
        :filter-placeholder="props.transcriptFilterPlaceholder"
        :empty-label="props.transcriptEmpty"
        :no-match-label="props.transcriptNoMatch"
        @seek="(t) => emit('seek', t)"
      />
```

- [ ] **Step 7: Wire the composable on the page**

In `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`, add the import:

```ts
  import { useTranscriptCues } from '~/composables/useTranscriptCues';
```

After the `videoRef` declaration (around line 106) add:

```ts
  const { cues: transcriptCues, activeIndex: activeCueIndex } = useTranscriptCues({
    videoRef,
    position,
    preferredLanguage: computed(() => locale.value),
  });
```

Pass them to `<PlayerSidebar>`:

```vue
          :cues="transcriptCues"
          :active-cue-index="activeCueIndex"
          :tab-transcript="t('pages.lessonPlayer.tabTranscript')"
          :transcript-empty="t('pages.lessonPlayer.transcriptEmpty')"
          :transcript-no-match="t('pages.lessonPlayer.transcriptNoMatch')"
          :transcript-filter-placeholder="t('pages.lessonPlayer.transcriptFilterPlaceholder')"
```

The existing `@seek="onBookmarkSeek"` already routes to `onSeek`, so clicking a cue seeks with no further wiring.

- [ ] **Step 8: Run the full web suite and the i18n gate**

```bash
pnpm --filter @app/web test
pnpm check:i18n
```

Expected: all green. `check:i18n` fails if `en.ts` and `ru.ts` disagree on keys.

- [ ] **Step 9: Verify by hand**

Open a lesson with subtitles at <http://localhost:8080>, switch to the Transcript tab, confirm the active line tracks playback, type into the filter, and click a line to jump.

- [ ] **Step 10: Format, lint, commit**

```bash
pnpm --filter @app/web lint --fix
pnpm stylelint:fix
pnpm format
git add apps/web/app/components/lesson-player/ \
        apps/web/i18n/locales/en.ts apps/web/i18n/locales/ru.ts \
        "apps/web/app/pages/courses/[id]/lessons/[lessonId].vue"
git commit -m "feat(web): add a transcript tab to the lesson player

Reads the cues the browser already parsed from the subtitle track, highlights
the line under the playhead, filters within the lesson, and seeks on click."
```

---

### Task 4: `?t=` deep links

This is what the later global transcript search (B2) will link to, and it is useful on its own for sharing a position.

**Files:**
- Create: `apps/web/app/utils/start-time.ts`
- Test: `apps/web/app/utils/__tests__/start-time.spec.ts`
- Modify: `apps/web/app/pages/courses/[id]/lessons/[lessonId].vue` (`onVideoLoadedMetadata`, around lines 111-120)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `parseStartTime(raw: unknown): number | null` — seconds, or `null` when absent or invalid.

- [ ] **Step 1: Write the failing test**

Create `apps/web/app/utils/__tests__/start-time.spec.ts`:

```ts
/**
 * Spec for parseStartTime.
 */

import { describe, it, expect } from 'vitest';
import { parseStartTime } from '../start-time';

describe('parseStartTime', () => {
  it('parses a positive integer', () => {
    expect(parseStartTime('125')).toBe(125);
  });

  it('parses a fractional value', () => {
    expect(parseStartTime('12.5')).toBe(12.5);
  });

  it('accepts zero', () => {
    expect(parseStartTime('0')).toBe(0);
  });

  it('takes the first entry when the query repeats the parameter', () => {
    expect(parseStartTime(['30', '90'])).toBe(30);
  });

  it('rejects a negative value', () => {
    expect(parseStartTime('-5')).toBeNull();
  });

  it('rejects a non-numeric value', () => {
    expect(parseStartTime('abc')).toBeNull();
  });

  it('rejects undefined and empty', () => {
    expect(parseStartTime(undefined)).toBeNull();
    expect(parseStartTime('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/web test app/utils/__tests__/start-time.spec.ts`
Expected: FAIL — cannot resolve `../start-time`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/app/utils/start-time.ts`:

```ts
/**
 * WHY this file exists:
 * `?t=<seconds>` deep-links into a lesson at a position. Vue Router hands a
 * query value as `string | string[] | null`, and the value is user-supplied,
 * so it is parsed and range-checked in one pure place the page can test.
 */
export function parseStartTime(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/web test app/utils/__tests__/start-time.spec.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Honour the parameter on the page**

Add the import:

```ts
  import { parseStartTime } from '~/utils/start-time';
```

Replace `onVideoLoadedMetadata` (currently lines 111-120) with:

```ts
  function onVideoLoadedMetadata(): void {
    if (!videoRef.value) return;

    // An explicit ?t= wins over the resume position, and over the user's
    // "Resume where I left off" preference — they asked for this second.
    const requested = parseStartTime(route.query.t);
    if (requested !== null) {
      if (!hasSetResumeTime) {
        videoRef.value.currentTime = requested;
        hasSetResumeTime = true;
      }
      return;
    }

    // Skip resume seek when the user has turned off "Resume where I left off".
    if (!preferencesStore.resumeWhereLeftOff) return;
    const lastSeen = lessonData.value?.progress.lastSeenAtSeconds ?? 0;
    if (!hasSetResumeTime && lastSeen > 0) {
      videoRef.value.currentTime = lastSeen;
      hasSetResumeTime = true;
    }
  }
```

- [ ] **Step 6: Verify by hand**

Open `http://localhost:8080/courses/<id>/lessons/<lessonId>?t=90` and confirm playback starts at 1:30 rather than at the resume position.

- [ ] **Step 7: Run the full web suite**

Run: `pnpm --filter @app/web test`
Expected: all green.

- [ ] **Step 8: Format, lint, commit**

```bash
pnpm --filter @app/web lint --fix
pnpm format
git add apps/web/app/utils/start-time.ts \
        apps/web/app/utils/__tests__/start-time.spec.ts \
        "apps/web/app/pages/courses/[id]/lessons/[lessonId].vue"
git commit -m "feat(web): honour ?t= deep links in the lesson player

An explicit timestamp wins over the resume position, so a link to a moment
lands on that moment."
```

---

## Closing out

- [ ] Move the `T-2026-08-29-007` entry from `specs/tasks/active.md` to the top of `specs/tasks/done.md`, adding `- Completed: <date>` and `- Result: <PR link>`.
- [ ] Update `docs/user-guide.md`: the lesson-player section gains the transcript tab, and the **Known limits** table loses nothing yet — but if the subtitles defect was ever going to be listed there, it is fixed now, not pending.
- [ ] Close tuxedo task 37 (the `<track>` defect) — it is fixed by Task 1.
- [ ] Prepend a dated entry to the dnote `CHANGELOG course_shelf` note.
- [ ] Open the PR against `main`.

## Deliberately not in this plan

- Whisper transcription, transcript storage in Postgres, and global transcript search — stages B1, B2 and B4 of the spec, each with its own plan.
- A mobile transcript panel. The composable's approach is platform-specific; Flutter will need its own.
- Promoting the cue list into `@app/ui`. Single-use, and the package carries a Storybook and parity obligation it has not earned.
