## Summary

<!-- What does this PR do, and why? Link to the `specs/tasks/active.md`
entry or its `specs/tasks/done.md` archive row. -->

## Changes

<!-- Bullet list of meaningful changes, not a file-by-file diff summary. -->

-
-

## Spec changes

<!-- If any route / channel / payload changed: -->

- [ ] Edited `packages/specs/openapi/openapi.yaml` or `…/asyncapi/centrifugo.yaml`
- [ ] Ran `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
- [ ] Codegen output committed as a **separate commit**
- [ ] N/A — no spec change

## Design / UI changes

- [ ] Updated `specs/design/tokens/*.json` and ran `pnpm design:build`
- [ ] Added or updated Storybook story + `.spec.ts`
- [ ] Screenshots / screen-recording attached below
- [ ] Storybook visual regression is green, **or** the drift is intentional and
      this PR carries the `visual-approved` label (the check posts a comment
      listing which stories moved and links the diff images)
- [ ] N/A — no UI change

## i18n

- [ ] Added strings in every locale the project ships (`pnpm check:i18n` passes)
- [ ] N/A — no user-visible string added

## Testing

- [ ] `pnpm lint` green
- [ ] `pnpm typecheck` green
- [ ] `pnpm test` green (backend + web + ui)
- [ ] `(cd apps/mobile && flutter analyze && flutter test)` green, if mobile touched
- [ ] Manual verification steps (list below)

## Task stack

- [ ] Entry pushed to `specs/tasks/active.md` at start
- [ ] Entry moved to top of `specs/tasks/done.md` with this PR's link on merge

## Screenshots / recordings

<!-- For any user-visible change. -->

## Notes for reviewer

<!-- Trade-offs, alternatives considered, follow-up work, etc. -->
