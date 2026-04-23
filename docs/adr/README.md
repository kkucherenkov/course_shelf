# Architecture Decision Records (ADRs)

A short, dated write-up of any non-obvious decision that shapes the codebase.
ADRs exist because git history records the *what* but not the *why*, and issues
get closed. An ADR survives both.

## When to write one

Write an ADR for any decision that:

- **Has credible alternatives.** If there's only one reasonable way, skip it.
- **Is hard to reverse.** Framework choices, auth model, persistence strategy,
  inter-service protocol.
- **Is not obvious from the code.** If a new contributor will ask "why are we
  doing it this way?", the answer goes in an ADR.

Skip ADRs for:

- Style or lint rule choices (put those in the config with a comment).
- Library swaps that are trivial to reverse.
- Bugfixes or refactors that don't change architecture.

## Format — MADR 4.0

Copy [`0000-template.md`](0000-template.md), rename to
`NNNN-short-slug.md` with the next number, and fill in the sections.

Required: **Title**, **Context**, **Decision**, **Consequences**. Every other
section is optional — delete what doesn't apply.

## Lifecycle

- **Status: proposed** — PR is open, decision is under review.
- **Status: accepted** — merged into main. Reference from code and docs.
- **Status: superseded by ADR-NNNN** — a later ADR replaces this one. Never
  delete superseded ADRs; they're load-bearing history.

When a decision changes, write a **new** ADR that supersedes the old one. Don't
edit accepted ADRs except for typos.

## Numbering

Zero-padded four-digit counter. `0001`, `0002`, … Numbers are never reused,
even for cancelled or superseded ADRs. `0000` is reserved for the template.

## Discovery

Link the ADR from:

- The PR that introduces it.
- Any code file whose design it governs (header comment:
  `// See docs/adr/0042-cqrs-command-bus.md`).
- `specs/tasks/active.md` or `done.md` when a task is driven by an ADR.
