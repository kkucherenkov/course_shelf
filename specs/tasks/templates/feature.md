# Feature task template

Copy this block into the top of `specs/tasks/active.md` when starting a new
feature. Replace the placeholder values. The `T-YYYY-MM-DD-NNN` id format is
described in [`specs/tasks/README.md`](../README.md).

```md
## T-YYYY-MM-DD-NNN — {short title, verb-led}

- Created: YYYY-MM-DD
- Owner: claude | @handle
- Spec: [link to feature spec, ADR, or linear issue]
- Goal: one sentence on the outcome, not the steps.
- Acceptance:
  - observable behaviour 1
  - observable behaviour 2
- Spec diff: {openapi + asyncapi paths touched, or "none"}
- Codegen impact: {yes — regenerate api-client-{ts,dart}; no}
- Design impact: {new tokens / new @app/ui component / none}
- Tests: {unit / integration / e2e — what's covered}
- Sub-steps:
  - [ ] …
  - [ ] …
- Status: in-progress | blocked | paused
- Blockers: —
```

## Field rules

- **Goal** is the *why*. The sub-steps are the *how*. Keep them separate —
  goal survives re-planning, sub-steps don't.
- **Acceptance** is what a human can verify without reading code. "Users can
  cancel a booking from the detail page" — not "CancelBookingCommand is
  dispatched".
- **Spec diff** forces you to think spec-first. If it's blank and you're
  touching HTTP, stop and edit `packages/specs/openapi/openapi.yaml` first.
- **Codegen impact: yes** means the PR must land the regenerated
  `packages/api-client-*/…` in its own commit. See the `codegen-regen`
  slash command.
- **Design impact** covers `@app/ui` + `ui_flutter` + design tokens. A feature
  that only reuses existing components is "none".
- **Blockers** is not "I'm stuck" — it's the thing that, when resolved, lets
  the task continue. Be concrete.

On completion, move the entry to the top of `specs/tasks/done.md`, add
`- Completed: YYYY-MM-DD` and `- Result: <PR link>`. Never delete.
