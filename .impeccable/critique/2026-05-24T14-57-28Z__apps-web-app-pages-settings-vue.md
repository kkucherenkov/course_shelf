---
target: Settings (apps/web/app/pages/settings.vue)
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-05-24T14-57-28Z
slug: apps-web-app-pages-settings-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Per-field self-evident sync indicator + toasts |
| 2 | Match System / Real World | 4 | Clear sections, plain-language labels |
| 3 | User Control and Freedom | 3 | Autosave + explicit password; "sign out other devices" has no confirm |
| 4 | Consistency and Standards | 1 | Whole page is raw Nuxt UI (`U*`) while every other page uses `@app/ui` (`App*`); token vocabulary also diverges |
| 5 | Error Prevention | 2 | Destructive-looking "Delete account" and "Sign out other devices" with no guard |
| 6 | Recognition Rather Than Recall | 4 | Everything visible, labelled, with help text |
| 7 | Flexibility and Efficiency | 3 | Good autosave; radiogroup pickers lack arrow-key roving |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but picker padding is broken (`--space-1-5` undefined) and controls look off-system |
| 9 | Error Recovery | 3 | Password errors are inline + specific; other failures use one generic toast |
| 10 | Help and Documentation | 4 | Every row carries help text |
| **Total** | | **31/40** | **Strong UX content on an off-system foundation** |

## Anti-Patterns Verdict

**LLM assessment**: Not AI slop in layout or copy. The information architecture is solid (4 labelled sections, single 720px column, per-row help, self-evident sync). The problem is structural, not aesthetic: this page is built on raw Nuxt UI primitives while the rest of the product is built on the `@app/ui` brand layer, so its buttons, inputs, and toggles are subtly off from every neighbouring screen.

**Deterministic scan**: Unavailable. `detect.mjs` reports `bundled detector not found`. Allowed exception, not a skipped run.

**Visual overlays**: Skipped. No browser automation in this session; the SPA serves an empty shell to a fetch.

## Overall Impression

The UX thinking here is good: inline autosave with a real sync indicator, generous help text, a sensible section order. But it sits on a different foundation than the rest of the app. Where auth, Browse, and Course detail use `AppButton` / `AppInput` / `AppPasswordField` / `AppSwitch`, Settings uses `UButton` / `UInput` / `UToggle` / a hand-rolled password form. The single biggest win is migrating this page onto `@app/ui` so it stops being the one screen that looks slightly foreign.

## What's Working

- **Self-evident sync.** The display-name field debounce-saves and shows a per-field `SettingSyncIndicator` (idle/saving/saved/error, `aria-live="polite"`) — exactly the brief's "self-evident sync, never modals" pattern (`settings.vue:36-81`, `SettingSyncIndicator.vue`).
- **Accessible pickers.** Theme/density/speed use `role="radiogroup"` + `role="radio"` + `aria-checked` — state is exposed to AT, not by colour alone (`settings.vue:354-372`).
- **Help on every row.** Each control has a label + a muted help line, and sections use `aria-labelledby` headings. Strong recognition and documentation.

## Priority Issues

**[P1] Design-system drift: the page bypasses `@app/ui`**
- *Why it matters*: Every control is a raw Nuxt UI component (`UButton`, `UInput`, `UFormField`, `UToggle`) and the password change is hand-rolled, while auth (`sign-in.vue`), Browse, and Course detail all use `@app/ui` (`AppButton`, `AppInput`, `AppPasswordField`, `AppSwitch`). The "save"/"sign out" buttons here don't match the buttons two screens over. The product ban on inconsistent component vocabulary is in force.
- *Fix*: Migrate to the `@app/ui` primitives that already exist: `AppButton`, `AppInput`, `AppSwitch`, `AppPasswordField`, `AppTextField`.
- *Suggested command*: `harden` / `polish`

**[P1] `UToggle` is not a Nuxt UI v4 component**
- *Why it matters*: Nuxt UI v4 renamed the switch to `USwitch`; `UToggle` is v2/v3. The autoplay-next and resume toggles use `<UToggle>` (`settings.vue:447-465`). If it doesn't resolve in v4, those two controls render nothing, so the user can't change them. Verify they appear.
- *Fix*: Use `AppSwitch` (the `@app/ui` switch) for both toggles.
- *Suggested command*: `harden`

**[P2] Broken `--space-1-5` token cramps the pickers**
- *Why it matters*: `settings.vue:751` sets `padding: var(--space-1-5) var(--space-3)` on every picker button, but `--space-1-5` is defined nowhere (the scale is `--space-0..9`). The invalid `var()` invalidates the whole `padding` declaration, so theme/density/speed buttons lose their vertical padding and read cramped.
- *Fix*: Use a defined token (`--space-2`) or migrate the picker to the shared segmented-control / `AppButton` group.
- *Suggested command*: `polish`

**[P2] "Coming soon" controls are live-looking buttons that do nothing**
- *Why it matters*: Avatar upload/remove, "Change email", and "Delete account" render as full, enabled buttons that only fire a "coming soon" toast (`settings.vue:93-99,87-89,207-209`). "Delete account" even carries `color="error"`, so it looks dangerous while being inert. Presenting dead affordances erodes trust.
- *Fix*: Hide unimplemented controls, or disable them with an explicit "Coming soon" affordance, rather than shipping active-looking buttons.
- *Suggested command*: `clarify` / `harden`

**[P2] Destructive account actions have no guard**
- *Why it matters*: "Sign out other devices" runs immediately on click (`settings.vue:192-203`); Course detail gates its far-less-destructive "Reset progress" behind an `AppDialog`. Inconsistent, and this action can't be undone (other sessions are killed).
- *Fix*: Confirm "Sign out other devices" (and, when real, "Delete account") with an `AppDialog`, matching Course detail.
- *Suggested command*: `harden`

## Persona Red Flags

**Owner-Admin (power self-hoster)**: Sees a red "Delete account" button and avatar upload controls that do nothing but toast "coming soon" — fake affordances on the page they'd use to actually configure the instance. "Sign out other devices" fires with no confirm.

**Household learner (returning)**: Theme and playback prefs autosave cleanly with visible feedback — the good path. But if `UToggle` doesn't render under Nuxt UI v4, "autoplay next" and "resume where left off" silently can't be toggled.

**Guest (scoped access)**: Settings is mostly profile/playback; little guest-specific risk. The off-system control styling is the main tell that this screen was built differently.

## Minor Observations

- `SettingSyncIndicator` uses literal `✓` / `!` text glyphs instead of `IconCS` (the app's Lucide set), so its iconography differs from every other status cue.
- The radiogroup pickers don't implement arrow-key roving tabindex; every radio is a tab stop, which isn't the expected radiogroup keyboard model.
- Token vocabulary diverges: this page uses `--primary` / `--text-loud` / `--text-muted` (valid aliases) where the rest uses `--brand-accent` / `--text-fg` / `--text-secondary`.
- The display-name debounce can fire `saveDisplayName` after the user navigates away (no clear-on-unmount); there's also no save-on-blur, only the 800ms debounce.
- Name and "sign out others" failures share one generic `toastUpdateFailed` message; not actionable.

## Questions to Consider

- Should Settings be migrated onto `@app/ui` in one pass so it stops being the lone raw-Nuxt-UI screen?
- For features that aren't built yet (avatar, email change, delete), is a visible-but-disabled control better than an active button that toasts "coming soon", or should they be hidden until real?
- Does "sign out other devices" deserve the same confirm dialog that "reset progress" already gets?
