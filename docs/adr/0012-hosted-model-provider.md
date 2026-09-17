# 0012 — Hosted text-generation provider, selectable, local stays the default

- **Status:** accepted
- **Date:** 2026-09-17
- **Deciders:** @kkucherenkov
- **Tags:** backend, ml

## Context

ADR-0011 rejected hosted text-generation APIs outright, on the grounds that
"a self-hosted personal instance sending its course audio or transcripts to a
third party is a decision the owner makes, not one the roadmap makes for
them." That framing assumed the library held personal data. It does not: the
library holds published third-party courses — content the provider that
authored it could itself already have trained on — so sending a transcript
window to a hosted model is a materially smaller step than the ADR treated it
as.

The other half of ADR-0011's bet was that process-per-call llama.cpp on the
target hardware would be slow but usable. Measured, it is 0.91 tok/s on the
maintainer's NAS — a machine that also serves video to whoever is watching a
course while quiz generation runs. At that rate, a single lesson's worth of
output costs roughly ten minutes of CPU the video pipeline is also
competing for. Quiz generation was already accepted as slow (ADR-0011,
Negative consequences); lesson summaries and slide export add a second,
independent consumer of the same throughput, and ten minutes per lesson
across a real library is the difference between a feature someone tries once
and one they use.

The owner has made the call ADR-0011 said only the owner could make: run
generation against a hosted model instead of, or alongside, the local one.

## Decision

Add a provider switch, not a replacement. `LLM_PROVIDER` selects the engine
for every text-generation call; default `local` so an existing deployment's
behaviour is unchanged until the owner opts in. `openrouter` routes the same
calls to a hosted model through the OpenRouter chat-completions API instead.

One extra adapter behind the existing port — no second port, no
provider-specific call sites. The port currently leaks llama.cpp specifics
(a local file path for the model); a follow-up task makes it
provider-neutral so both adapters implement the same interface. The prompts
and JSON schemas that shape a generation call move into the domain layer in
the same pass, shared by both adapters — two adapters each holding their own
copy of a system prompt drift from each other, and the drift shows up as a
quality difference nobody asked for and nobody can explain from the outside.

The API key is a secret and lives in `AppConfig.hostedModel`, sourced from
`OPENROUTER_API_KEY`, exactly like every other credential in this repo:
never a committed default, never logged, never in an error message.
`AppConfig.hostedModel.configured` is a presence check on that key and
nothing more — unlike a local `.gguf` file, there is no way to confirm a
model id is valid without calling the provider, so a bad id surfaces as a
failed generation rather than a boot-time refusal.

## Consequences

### Positive

- Quiz generation and the upcoming lesson-summary feature both get a
  practical throughput option — minutes instead of the tens of minutes a
  30-lesson course would cost entirely on the NAS.
- `LLM_PROVIDER=local` keeps every current deployment's behaviour and
  privacy posture unchanged; opting into a hosted model is a config change,
  not an upgrade.
- Sharing prompts and schemas between adapters means the two engines answer
  the same question the same way — a quality comparison between them tests
  the model, not two different prompts wearing the same feature name.

### Negative

- Transcript text leaves the machine when the hosted provider is on. This is
  now a documented, configurable choice the owner makes per deployment,
  rather than the accident a default-on hosted call would have been.
- Free-tier hosted models are rate-limited: 20 requests/minute, and 50
  requests/day with no credit balance on the account (1000/day once the
  account holds credits). Covering the current library end to end is
  roughly 6200 requests — days of throttled runs on the free tier, against
  about $0.32 on a paid model for the same work. The free tier is a
  development convenience, not a deployment plan.
- A second engine is a second thing that can fail in a different way — a
  network timeout and a rate-limit response are failure modes local
  llama.cpp never has to handle, and the adapter has to turn both into the
  same domain-level failure the caller already expects.

### Neutral

- The port becoming provider-neutral and the prompts moving into the domain
  are refactors this decision requires, not features in their own right —
  local-only behaviour before and after is identical, verified by the
  existing `LocalLlamaAdapter` test suite continuing to pass unchanged.

## Alternatives considered

### Option A — stay local-only

Rejected. Ten minutes per lesson, on a machine that also serves video, is a
real cost with no floor once summaries and slide export add a second
generation-heavy feature. This is the option ADR-0011 chose; it is revisited
because the input to that choice (privacy exposure) changed, not because the
performance numbers did.

### Option B — a resident model server

Still rejected, for exactly ADR-0011's reasons: a long-running service
holding several GB of weights in RAM competes with everything else on a
personal NAS for a feature that runs on demand. Nothing about adding a
hosted option changes that trade-off for the local path — `local` still
means process-per-call.

### Option C — free tier as the production mode

Rejected. 50 requests a day without credits (1000 with) turns a course
import into a week of throttled runs to save roughly thirty cents against
the paid alternative. The free tier stays useful for development and manual
testing, where a handful of calls a day is plenty; it is not sized for a
real library.

## Related

- [ADR-0011](0011-local-llm-quiz-generation.md) — the decision this
  supersedes and the local-adapter shape the new provider sits beside.
- [ADR-0003](0003-cqrs-without-event-sourcing.md) — the CQRS shape quiz
  generation and lesson summaries both follow.
- `docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md`,
  decision D9 — the feature work this configuration unblocks.
