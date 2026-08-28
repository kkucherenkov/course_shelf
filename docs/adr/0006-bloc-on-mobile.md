# 0006 — BLoC + get_it on mobile, feature-first layering

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** mobile, architecture

> Recorded retroactively. Established in E15 and carried through E19's download
> queue and E20's sync engine.

## Context

The mobile app has the hardest state in the project. Downloads are a queue with
per-item lifecycle (queued → downloading → paused → ready → failed) that must
survive an app kill and resume from the last committed byte range; sync drains
an outbox on reconnect. That state is long-lived, concurrent, and driven by
events from outside the widget tree — connectivity changes, background task
wake-ups, a finished HTTP range request.

Widget-local state is not a candidate. The real question is which state
container, and how dependencies reach it.

## Decision

`flutter_bloc` for state, `get_it` for dependency injection, feature-first
layering: `features/<name>/{domain,data,presentation}/`, with cross-cutting
pieces under `shared/`.

Domain and presentation never import `dio` — only `features/*/data/` consumes the
shared `Dio` built by `shared/network/api_client.dart`.

## Consequences

### Positive

- Events and states are explicit values, so `bloc_test` can drive a queue through
  pause/resume/kill/restart without a widget tree. The E19 download queue has 107
  such tests and no integration test — which was the only way to test it at all
  on a host with no emulator.
- The layering keeps the generated Dart API client at the edge. A regenerated
  client changes `data/` and nothing else.
- `get_it` is a service locator, not a compile-time graph, so a fake repository
  is a one-line registration in a test.

### Negative

- Boilerplate per feature: an event union, a state union, a bloc, and the
  registration. For a screen that just reads a list this is heavy.
- `get_it` resolves at runtime, so a missing registration is a runtime crash
  rather than a compile error — the cost of not using a code-generated DI graph.
- Feature-first means shared concepts need a deliberate home in `shared/`, and
  the boundary erodes if nobody watches it.

### Neutral

- Cubit is available for the genuinely trivial cases; nothing forces a full event
  union where a method call will do.

## Alternatives considered

### Option A — Riverpod

A strong option, with compile-time-safer wiring than `get_it`. Rejected on
testability of the specific hard problem: the download queue is naturally a state
machine over an event stream, which is what BLoC models directly.

### Option B — `provider` + `ChangeNotifier`

Rejected. Mutable notifier state is hard to assert on and hard to reason about
under concurrency, which is exactly what the queue has.

### Option C — Mirror the web's Pinia stores

Rejected. Symmetry with the web app is not worth choosing a weaker fit for a
problem the web app does not have — the browser never resumes a download across
a process kill.

## Related

- [ADR-0002](0002-spec-first-openapi.md) — the generated Dart client `data/`
  wraps.
- [ADR-0007](0007-storybook-and-widgetbook.md) — the Flutter component catalog.
