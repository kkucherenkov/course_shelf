---
target: Browse / каталог (apps/web/app/pages/browse.vue)
total_score: 27
p0_count: 0
p1_count: 3
timestamp: 2026-05-24T13-08-07Z
slug: apps-web-app-pages-browse-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active filter shown by color only; result count flashes `0` during load |
| 2 | Match System / Real World | 4 | Domain language is right ("Browse courses", "Recently watched") |
| 3 | User Control and Freedom | 3 | Filtered-empty state offers no one-click "clear filter" |
| 4 | Consistency and Standards | 2 | Bespoke retry `<button>` instead of AppButton; chips use `variant` not the component's `selected` API |
| 5 | Error Prevention | 3 | n/a mostly |
| 6 | Recognition Rather Than Recall | 3 | Active filter relies on color recognition |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; library/duration/instructor facets from the spec are missing; sort lacks "duration" |
| 8 | Aesthetic and Minimalist Design | 3 | Per-card rainbow accents add chroma noise vs the calm brand; empty instructor line is dead space |
| 9 | Error Recovery | 2 | Error body duplicates the title and gives no next step |
| 10 | Help and Documentation | 2 | Empty state names the gap but doesn't teach or link an action |
| **Total** | | **27/40** | **Solid base, clear gaps** |

## Anti-Patterns Verdict

**LLM assessment**: Not obvious AI slop. Structure is restrained and on-brand for the "calm, substantial tool" tone (skeleton grid, no hero-metric template, no gradient text, no side-stripe borders). The one chromatic risk is the 6-color rotating poster accent (`accentFromId`), which fights the brief's "single confident accent / no decorative noise" directive.

**Deterministic scan**: Unavailable. `detect.mjs` reports `bundled detector not found` (engine missing from the skill install). Per critique invariant this is the allowed exception, not a skipped run. All findings below are from source + design-spec comparison.

**Visual overlays**: Skipped. No browser automation tool is exposed in this session and the app is a Nuxt SPA (`ssr: false`), so an HTTP fetch returns an empty shell. No user-visible overlay was produced.

## Overall Impression

A clean, correctly-wired Browse page that handles the four async states (loading / error / empty / populated) and uses the design system honestly. The gap is between this and the `cs-web-browse-search` handoff bundle: the spec'd faceted filtering (status + library + duration + instructor) collapsed to a single status-chip row, and several states stop one step short of the brief's "name the gap, propose an action" rule. Biggest single opportunity: the card data mapping (`toCourse`) silently drops `instructor` and `state`, so cards look thinner and lock-aware access never renders.

## What's Working

- **State coverage is complete and correctly typed.** `fetchStatus` drives loading→error→empty→populated; loading uses a skeleton grid, not a spinner (matches brief §8.1 and the mockup). `apps/web/app/pages/browse.vue:104-144`.
- **Token discipline.** No hard-coded brand hex in the page; spacing, type, radius, accent all flow through CSS vars. Focus ring on the card link is explicit (`browse.vue:212-216`).
- **i18n + pluralization done right.** `subtitle: '{n} course | {n} courses'` and every string is `t()`-bound (`en.ts:213-235`).

## Priority Issues

**[P1] Active filter is conveyed by color alone, with no announced state**
- *Why it matters*: Chips signal the active filter only via the `primary` variant background (`browse.vue:91`). `AppChip` emits `aria-pressed` only from its `selected` prop, which Browse never passes, so screen-reader users get no pressed/selected state. Fails WCAG 1.4.1 (use of color) and 4.1.2 (name/role/value), and the brief's "no information by color alone".
- *Fix*: Pass `:selected="status === option.value"` on the chip (keep the variant for visual weight). That wires `aria-pressed` and adds the `--selected` border so the cue is not purely chromatic.
- *Suggested command*: `clarify` / `harden`

**[P1] Nested interactive elements on every card**
- *Why it matters*: `CoursePosterCard` is `role="button"` + `tabindex="0"` (`CoursePosterCard.vue:40-48`) wrapped in a `NuxtLink` anchor (`browse.vue:136-143`). That is an interactive control inside an `<a>`: two tab stops per card, invalid nesting, and duplicated accessible names (link + `aria-label`).
- *Fix*: In a navigation grid the card should not be interactive. Either drop `role`/`tabindex`/`@click` when rendered inside a link, or render the card itself as the link and remove the wrapping `NuxtLink`.
- *Suggested command*: `harden`

**[P1] `toCourse` drops instructor and course state**
- *Why it matters*: `toCourse` hardcodes `instructor: ''` (`browse.vue:59`) even though the list DTO exposes `instructorNames` (`packages/api-client-ts/src/generated/types.gen.ts:119`). Result: an empty `instructor` paragraph reserves a line under every title (`CoursePosterCard.vue:77-79`) and a real differentiator is thrown away. It also never sets `state`, so the card's `locked`/`completed` explicit treatments never fire — a guest with scoped access sees locked courses as ordinary posters.
- *Fix*: Map `instructor: item.instructorNames?.join(', ') ?? ''` and pass the server access/completion state into `:state`. If a course has no instructor, hide the element rather than rendering an empty line.
- *Suggested command*: `clarify` / `harden`

**[P2] Error and empty states aren't actionable**
- *Why it matters*: The error banner body is `error?.message` = "Failed to load courses", which restates `errorTitle` "Could not load courses" and gives no next step (`browse.vue:112-124`, `en.ts:216-219`). The filtered-empty state offers no "clear filters" button (`browse.vue:127-132`), unlike the mockup ("Clear all filters" / "Browse libraries"). Violates the brief: "Errors: what happened AND what to do; empty states: name the gap, propose an action."
- *Fix*: Replace the raw message with an actionable line ("Check the server is running, then retry"). Add a "Show all courses" action to the filtered-empty state that resets `status` to `all`.
- *Suggested command*: `clarify`

**[P2] Filter chips are below the web hit-target minimum**
- *Why it matters*: `AppChip` is 22px tall (`AppChip.vue` `height: 22px`). As primary filter controls these sit under the brief's "≥ 32×32 on web" target (§8.2), hurting pointer and touch users on the most-used control on the page.
- *Fix*: Use a larger chip size for interactive filters, or pad the hit area to ≥32px while keeping the visual pill compact.
- *Suggested command*: `adapt` / `harden`

## Persona Red Flags

**Owner-Admin (power self-hoster)**: Can't filter by library, duration, or instructor — the page exposes only status, so a large shelf can't be narrowed the way the spec promised. No keyboard shortcuts. Sort is missing "duration". Re-clicking the active chip doesn't reset (the `selectStatus` code never toggles back, despite the comment at `browse.vue:32-34`).

**Household learner (returning, wants to resume)**: Two near-identical course titles are indistinguishable because instructor is blank. After narrowing to a status that returns nothing, there's no one-tap way back — they must spot and click the "All" chip. Screen-reader user can't tell which filter is active.

**Guest (scoped access)**: Locked courses render as normal posters because `state` is never passed to the card, even though the card has a `locked` scrim built for exactly this case (`CoursePosterCard.vue:63-65`).

## Minor Observations

- Result count flashes `0` during the pending phase because `items.length` is `0` before data arrives; the mockup shows a "— loading" placeholder instead (`browse.vue:71-73`).
- Comment at `browse.vue:32-34` describes a toggle-back-to-`all` behavior that `selectStatus` does not implement.
- Per-card accent is a deterministic 6-color rotation (`course-accent.ts`). Defensible as fallback cover art, but verify the palette is muted; a rainbow grid undercuts the "calm, no decorative noise" brand.
- White/black overlay colors in `CoursePosterCard` are hard-coded `#fff` / `rgba(...)`; acceptable as image scrims but worth a token if reused.

## Questions to Consider

- What would Browse feel like if the spec'd filter rail (library / duration / instructor) were present — is the single status row a deliberate scope cut or an unfinished one?
- Should the card itself be the link, removing the button-in-anchor entirely?
- If instructor is the main thing that distinguishes two courses, why is it the first field dropped?
