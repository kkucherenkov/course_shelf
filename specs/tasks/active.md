# Active tasks

## T-2026-04-27-041 — Primitives batch B: dialog + avatar + chip refactor (E13-F01-S08/S11/S12)

- Created: 2026-04-27
- Owner: claude
- Spec: cards `E13-F01-S08`, `E13-F01-S11`, `E13-F01-S12`. Bundle CSS in `docs/design/shared/tokens.css` ships `.avatar` + role badges. Bundle ships **no** dialog/modal/cmdk styles — those are designed from scratch using project tokens. AppChip already exists (`packages/ui/src/components/AppChip/AppChip.vue`) with a richer-but-different prop axis than the card's flat 6-variant contract.
- Goal: ship AppDialog (sm/md, focus trap), AppCommandPalette (Ctrl/Cmd+K opener, search-and-pick list), AppAvatar (5 sizes + role badges), and refactor AppChip to match the bundle's flat variant axis.
- Acceptance:
  - **S08 — `AppDialog`**: native `<dialog>` element; props `open: boolean` (v-model'd via `update:open`), `size: 'sm' | 'md'` (sm 480px / md 640px max-width), `title: string`, optional `description`, optional `dismissible: boolean` (defaults true) showing a close button. ESC closes. Click on backdrop closes (only when `dismissible`). Focus trap inside the dialog: first focusable on open, return to trigger on close. `role="dialog"`, `aria-labelledby` to the title id, `aria-describedby` to the description id (when present). Slots: default for body, `footer` for actions. Animations: fade-in backdrop + scale-in dialog.
  - **S08 — `AppCommandPalette`**: a search-and-pick command list. Props: `open: boolean` (v-model), `placeholder?: string`, `commands: Command[]` where `Command = { id: string; label: string; description?: string; icon?: IconName; group?: string; }`. Emits `select: [command: Command]`. Keyboard: ArrowDown / ArrowUp navigate, Enter selects, ESC closes. Renders inside an AppDialog (size sm) with a search input at top and a filtered list below. Optional global keyboard shortcut wiring is out of scope — caller wires `Ctrl/Cmd+K` themselves.
  - **S11 — `AppAvatar`**: props `image?: string` (URL), `initials?: string` (fallback), `name?: string` (computed initials when initials prop missing — first letter of each word, max 2), `size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` (default `md`), `role?: 'admin' | 'guest'` (badge). When `role` is set, renders the role badge in the corner using `--brand-accent` for admin and `--status-info-fg` (or `--info`) for guest. When `image` is provided, uses `<img>`; otherwise renders initials in a circle with the bundle's gradient background (`linear-gradient(135deg, --surface-overlay, --surface-raised)`).
  - **S12 — `AppChip` refactor**: collapse to flat `variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'` axis matching the bundle's `.chip-*` classes. Drop the `color × variant` matrix (existing `solid|soft|subtle|outline` variants and `neutral|primary|...` colors). Migrate icon usage from `AppIcon` (Iconify) to `IconCS` (typed `IconName`). Fix the broken `--status-danger` token reference (use `--status-error-fg`). Keep `removable`/`dismissible`, `selected`, `disabled`, `to` (NuxtLink mode). Update existing `AppChip.spec.ts` and `AppChip.stories.ts`.
  - All four components export from `packages/ui/src/index.ts`. `Command` type from AppCommandPalette is also exported.
  - A11y: dialog focus trap, command palette `role="combobox"` on input + `role="listbox"` + `role="option"` on results, avatar role badges include accessible label (e.g. `aria-label="Administrator"`).
- Token deviations as needed: bundle's `.avatar` uses `--surface-3` / `--surface-2` for the gradient and `--bg` for the role-badge ring — map to `--surface-overlay` / `--surface-raised` and `--surface-bg`.
- Spec diff: none. Codegen impact: no. Design impact: yes.
- Tests: spec per component (mount + a11y attribute assertions + interaction simulation: dialog ESC + backdrop click; command palette arrow-key nav + filter; avatar fallback initials; chip variant + remove emit).
- Sub-steps:
  - [ ] T-041-A: AppDialog (focus trap, ESC, backdrop) + spec + story
  - [ ] T-041-B: AppCommandPalette (search + filter + arrow nav, composes AppDialog) + spec + story
  - [ ] T-041-C: AppAvatar with role badges + spec + story
  - [ ] T-041-D: AppChip refactor + update existing spec/stories + login.vue audit (no caller changes expected)
  - [ ] T-041-E: barrel exports; lint, typecheck, test, prettier; flip 3 cards; archive T-041
- Status: in-progress
- Blockers: —
