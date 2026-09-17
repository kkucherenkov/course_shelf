---
name: pre-release-audit
description: Use before cutting a release, when deciding whether the product is shippable, or when a UI/UX review is requested. Covers standing up an audit instance from production data, driving it with a browser, running the two-assessment critique, and comparing a run against the previous one.
---

# Pre-release audit

Two passes over a running instance restored from production data: an exploratory
browser sweep that reports what is broken, then a design critique that scores
the product. Run it before a release; compare the score against the last run.

`tests/e2e/` proves known things still hold, on seeded data, one page at a time.
This proves nothing. It walks journeys across pages on data shaped like the real
library and reports what nobody thought to assert. The two do not overlap and
neither replaces the other.

## When to run it

- Before cutting a release, once the wave's PRs are merged
- After a wave of UI fixes, to measure whether they moved anything
- When asked for a UI or UX review

Do not run it against `main` on the day a lane is still merging — the images you
build will not match what you audit.

## The environment is the whole game

**Restore a production dump into a local stack. Not the seed, not the NAS.**

`seed-catalog.ts` produces Latin titles, short descriptions and small courses.
Every bug this project shipped lived in the gap between that and reality: a
non-Latin title that deleted a course, a 4203-character description with nowhere
to go, 1945 transcripts filed under `und`, 153 lessons ordered by a rule their
import predates. An audit on seeded data re-proves what Playwright already
proves.

The live NAS is the other wrong answer: half the interesting scenarios are
destructive — revoke a grant mid-playback, delete a course, restart a scan — and
they cannot run against the real library.

**Audit the release images, not a dev server.** Build from the merge commit with
`apps/{backend,web}/Dockerfile` and run the release bundle. A dev server differs
from what users get in exactly the places that matter: CSP, minification, the
rendered document.

See [setup.md](setup.md) for the procedure.

## Two assessments, and why they must not see each other

The critique method (`impeccable critique`) requires both:

- **A — design review.** Reads source, walks the product, scores Nielsen's ten
  heuristics, cognitive load, emotional journey, personas.
- **B — browser evidence.** Deterministic: axe-core, console errors, failed
  requests, render probes, forced states.

**A must finish before B's findings reach the synthesis.** Deterministic findings
anchor judgment: an agent that has just been handed 477 axe violations writes a
different review than one that has not. Dispatch A as its own agent with an
explicit instruction not to seek B's output.

The bundled `detect.mjs` in the `impeccable` skill may have no payload installed.
That is a documented fallback, not a failed run — say "deterministic scan
unavailable" and let B stand on browser evidence.

## Running it

```sh
# once per wave, after the merge commit is known
node driver.mjs sweep    # matrix + axe, ~15 min
node driver.mjs states   # forced error / empty / slow, ~3 min
```

[driver.mjs](driver.mjs) is the harness. It walks three personas × two locales ×
two themes × four viewports, injects axe-core per page, and forces the states
the data never produces. It asserts nothing; it writes `report.json` and a
screenshot per combination.

Then dispatch Assessment A. Then synthesize: where A and B agree, where B caught
what A missed, and which of B's findings are false positives.

## Pass C — interaction and performance, when a question needs it

A and B answer "what is broken on a page the harness can reach". Neither
clicks, submits, or measures cost. `chrome-devtools-mcp` covers that gap:
CPU and network throttling, performance traces, Core Web Vitals, and driving
a real Chrome conversationally instead of extending the driver first.

Run it **as a third pass, against a question**, not as a matrix. It produces
no comparable numbers, so it never replaces B — the audit's value is that run
N and run N-1 walk the same 128 combinations.

Worth its cost on:

- **Long operations.** A scan is never triggered by the harness and takes
  minutes on real data. Its progress surface is the product's strongest, and
  nothing automated has ever watched it run.
- **Cost claims we have asserted but never measured.** The course page mounts
  540 lesson rows with no virtualisation. That has been in three reports as a
  defect and zero times as a number.
- **Keyboard-only paths.** Two admin dialogs moved to a native `<dialog>` on
  the strength of the platform giving focus trapping for free. No check drives
  them by keyboard.

**It does not see the player's native chrome.** The CC menu and fullscreen are
drawn by the browser, not the page, and CDP does not expose them either.
`computer-use` remains the only thing that reaches them; do not let the MCP's
presence imply otherwise.

Not configured in this repository yet: add the server to `.mcp.json` before
the first use.

## Traps that cost hours

Every one of these produced a wrong answer that looked like a right answer.

**A run that reports zero findings is the failure mode, not the success.** The
first sweep reported "56 pages, 0 violations" while every page was the sign-in
redirect. Make the harness refuse to continue when authentication did not take,
and check a screenshot before believing a clean result.

**Sign-in is rate-limited twice.** Five attempts per 15 minutes plus a general
60 requests per 60 seconds. A harness that signs in per run burns the allowance
on plumbing. Mint once, cache to disk, reuse.

`docker restart` on the backend does **not** reliably clear the counter — a
restart mid-audit answered with a fresh `429` and 780 seconds remaining. Seed
`.auth-<persona>.json` by hand from a sign-up response instead; the driver
probes a cached token before using it and skips sign-in entirely.

That probe must treat **429 as valid**, not as a bad token: the general
throttler fires during a sweep, and a probe that reads 429 as "expired" sends
the run into the stricter sign-in limiter. Fixed in `driver.mjs`, recorded here
because the same trap will appear in any harness written against this API.

**Node's fetch cannot sign in without an explicit `Origin`.** `undici` sends
`Sec-Fetch-*` headers but no `Origin`, and Better Auth reads that combination as
a browser request with a null origin — `403 MISSING_OR_NULL_ORIGIN`. curl, which
sends neither, is let through. Any non-browser client that looks half-browser
hits this.

**Filling the sign-in form does not work.** Nuxt hydrates after `networkidle`
and replaces the inputs, discarding the fill silently. Authenticate over the API
and seed the credentials instead.

**Seeding the bearer token alone is not enough** (before #577 landed): the
Better Auth client ran with `credentials: 'include'`, so `getSession()` — which
the global middleware calls on every hard navigation — authenticated by
**cookie**. Seed both, or check which mechanism the current code uses.

**A probe that checks `display` on the element misses ancestors.** The first
render probe reported 11 violations; ten were navigation buttons hidden by a
parent. Walk up the tree.

**`gh` reports a pending check as `conclusion: ""`, not `null`.** jq's `//`
only substitutes on `false` and `null`, so `.conclusion // "PENDING"` returns
`""` and every "is it still running?" test silently passes. Gate on
`.status != "COMPLETED"`.

**A baseline regeneration does not re-run the checks.** The regen workflow
pushes as `github-actions[bot]` with `GITHUB_TOKEN`, and GitHub deliberately
does not trigger workflows on such a push — otherwise a regeneration would
retrigger itself. The pull request keeps showing the previous run, so a stale
red looks like a slow queue. Push something of your own, or update the branch,
to get the verdict on the new baselines.

**Regeneration rewrites every baseline whose bytes differ**, including
sub-threshold drift the visual check deliberately ignores. Twice this pulled an
unrelated component's image into a pull request that never touched it. Read the
regen commit's file list before accepting it.

**Bash and Monitor commands run under zsh**, which does not word-split unquoted
parameters: `for x in $LIST` iterates once with the whole string. It produced a
monitor event claiming four lanes had finished while two were 90 seconds old.

**The report lands in the output directory, not beside the driver.**
`driver.mjs` writes `report.json` into `AUDIT_OUT` (`./out2` by default), so a
`mv report.json` from the driver's directory silently moves nothing and the
next sweep overwrites the previous run's report. Archive the whole output
directory, or point `AUDIT_OUT` at a per-run one.

**`sweep` and `states` need different `AUDIT_OUT` directories, not just
different runs.** Both write `report.json`, so running `states` after `sweep`
into the same directory destroys the sweep's findings — and the result looks
like a clean product: `findings: 0`, which is the shape of success. This is the
same "a zero is a failure" trap one level down.

**A clip probe flags the visually-hidden heading pattern.** A `sr-only` `h1`
(`position:absolute; width:1px; clip-path:inset(50%)`) is indistinguishable
from a clipped element by geometry alone. Four "clipped" findings in one run
were all the lesson player's deliberately hidden title. Check the class before
filing.

**Narrow the state mock.** Faking every `/api/v1/**` response also fakes
`/admin/has-users` and `/admin/instance`, so the middleware decides the instance
is uninitialised and funnels every route into the first-run wizard — a different
screen than the one under audit. Exclude auth and instance-config routes.

## Reading the result

Compare against the previous run's `report.json`, kept beside the new one.

**One axe rule is usually one element.** A run reported 98 `button-name`
violations; they were a single unlabelled avatar button multiplied by 128 matrix
combinations. Group by rule, then find the element, before sizing the work.

**Normalise before comparing.** Raw counts mislead: a run with a wider matrix
produces more of everything. Rate-limit noise dominates both numerators — strip
429s before comparing console errors. Screenshot counts and axe totals are only
comparable at the same matrix size.

**The heuristic score is the number that carries.** Nielsen's ten, 0-4 each,
from Assessment A. Most real interfaces land 20-32/40. Say which heuristics
moved and why; if the total did not move, say that.

**Separate fixture artefacts from defects.** A 404 on a poster whose file was
never copied into the fixture is not a finding. Check before filing.

**Expect the fixes to break things.** The first fix wave moved the score from
18 to 22 and introduced three new inconsistencies, one of which made a
previously inert setting actively contradictory. Audit the fixes, not just the
original findings.

## What the audit systematically misses

Say this in the report rather than implying coverage you do not have.

- **Interaction.** The harness navigates; it does not click, type, submit, drag
  or play. Every finding that needs _doing_ something comes from reading code.
- **Long operations.** A scan or a transcription run is never triggered.
- **The player.** The most-used surface, and the harness never presses play. The
  native CC menu and fullscreen are drawn by the browser; page automation cannot
  see them. That is the one place `computer-use` earns its place.
- **Keyboard-only navigation**, zoom at 150/200%, `prefers-reduced-motion`,
  `forced-colors`.

## Filing what you find

One issue per defect, with the measurement in it — the file and line, the count,
the reproduction. Group only genuine papercuts.

Put `Closes #N` on its own line **for every issue the PR fixes**. A lane that
wrote one `Closes` out of four left three issues open and needed them closed by
hand; the same leak has been observed across waves.

If the repository is public, describe a security finding as a class of problem
with the fix location. Never write a working exploit.
