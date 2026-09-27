# `stacks/ts-monorepo` — capture notes

Input for phase 4 of the
[two-layer template design](../specs/2026-09-25-project-template-two-layer-design.md).
D8 says the recipe is drafted against a named consumer, never in the abstract.
The consumer is `todoer`, and its walking skeleton is the recipe's first run.

These notes are written **as each task lands**, not reconstructed afterwards.
What makes a recipe a recipe is the reasoning behind a choice, and reasoning is
the one thing a diff does not carry.

Per module, three columns: what the recipe instructs, what is the consumer's own
business, and what was learned by doing it here rather than by remembering it.

---

## `core` — workspace, build graph, TypeScript

**Recipe carries:**

- `pnpm-workspace.yaml` with `apps/*` and `packages/*`. Two globs, not one, so
  a package is filed by what it is rather than by who imports it.
- `turbo.json` with `build` / `typecheck` / `test` / `lint`, where the first
  three declare `dependsOn: ["^build"]`. A `typecheck` that does not wait for
  upstream builds passes against yesterday's types.
- `tsconfig.base.json` with `strict`, **`noUncheckedIndexedAccess`** and
  **`exactOptionalPropertyTypes`**.

**Consumer decides:** package scope (`@todoer/*`), the Node floor, the pnpm
version.

**Learned here:** `noUncheckedIndexedAccess` is not a taste setting and the
recipe must say why, or the first person who hits a compile error will turn it
off. In `todoer` the sync engine indexes `field_ts[field]` — a record that may
not hold the key — and without the flag the compiler is silent about exactly
the case the conflict rules exist to handle. The recipe carries the flag **and
the sentence**.

## `docker` — local dependencies

**Recipe carries:** a `docker/compose.yml` whose services publish on
**non-default host ports**.

**Consumer decides:** which services, which images, the port numbers.

**Learned here:** the reason has to travel with the rule. `todoer` publishes
Postgres on 5433 because another Postgres is very likely already listening on
5432 — and the failure that produces is not a refused connection but a
successful connection to the wrong database, which looks like a data bug for as
long as it takes to notice. A recipe that says "use a non-default port" without
that sentence gets overridden by the next person who finds it inconvenient.

## `specs` — the contract and its generated client

**Recipe carries:**

- An OpenAPI 3.1 document under `packages/specs/openapi/`, linted with
  `redocly lint` and turned into a typed client by `@hey-api/openapi-ts`.
- Two scripts, `validate` and `codegen`, and the rule that **generated output
  is committed in its own commit**. A reviewer then reads the contract change
  without the derived diff, and a regeneration that changes nothing shows up as
  an empty commit rather than as noise inside a feature.

**Consumer decides:** the package scope, which paths exist, whether a second
client (Dart, Kotlin) is generated alongside.

**Learned here — two things, and the second is the one worth carrying:**

1. Redocly's default ruleset **errors** on a missing `operation-summary`. The
   reflex is to add a config that relaxes the rule, and the recipe must say
   why that is backwards: a `summary` is contract content, not a linter's
   opinion — it becomes the docstring on every generated client method, and in
   this stack three clients read it. Write the summaries.
2. Not every default rule fits every operation, and the recipe has to say so
   explicitly, or someone will silence the whole ruleset over one of them. The
   concrete case: `operation-4xx-response` fires on a liveness probe, which has
   no client error to declare — it answers, or the process is not there to
   answer. Inventing a 4xx would put an impossible response in the contract
   that every client generates a branch for. The right move is to leave that
   one warning visible and unsilenced, and the recipe names it so the next
   person recognises it rather than rediscovering the argument.

The general shape, worth stating once in the recipe: **fix the document, not
the linter — except where the rule does not apply to the operation, and then
leave the warning where a human can see it.** A silenced warning and an absent
one look identical six months later.

## `specs`, continued — a codegen package ships artefacts, not sources

**The rule:** a package whose contents are generated **builds** and exports
`dist/`. It never exports raw TypeScript.

**Why, precisely.** Generated code follows its generator's idiom, and
`@hey-api/openapi-ts` emits extension-less relative imports (`from
"./types.gen"`). A package that exports raw TS does not resolve those itself —
the **consumer** does, under its own module resolution. Both a NestJS backend
and a Node CLI compile under `NodeNext`, where extension-less relative imports
do not resolve, so the failure lands in every consumer at once and none of them
can fix it.

**The trap worth naming, because it looks like a fix and is not:** setting
`moduleResolution: "Bundler"` inside the generating package turns its own
typecheck green and moves nothing for its consumers. A recipe that stops at
"give the package a tsconfig" produces exactly that — a green gate over a
broken import graph.

**The shape:** `tsup` bundles the generated entry point to one ESM file plus
declarations; `package.json` points `exports`, `main` and `types` at `dist/`;
`dist/` is gitignored while the **generated sources stay committed**, because
those are the reviewable artefact and the bundle is not. `turbo`'s
`dependsOn: ["^build"]` then gets consumers the built output for free.

**Also learned, and cheap to miss:** the runtime the generated client imports
(`@hey-api/client-fetch` here) is not added by the generator. It has to be a
declared dependency, and nothing catches its absence until a consumer runs —
a typecheck passes, the import resolves through the workspace's hoisted
`node_modules`, and it fails only in a clean install.

## `backend` — the shell

**Recipe carries:**

- A single configuration class that is **the only reader of `process.env`**,
  with a `required()` helper that throws on a missing value. Failing loudly at
  boot is the point: a server that starts with half its configuration missing
  fails later, further away, and looks like a different bug.
- URI versioning under a global prefix, so a controller declaring `version: '1'`
  serves `/api/v1/...`.
- `express-openapi-validator` mounted against the spec package's document, with
  `validateSecurity: false` — authentication is a framework guard's job, and
  letting the validator reject first turns a 401 into a 500 and hides which
  layer refused.

**Learned here:** two things the plan did not anticipate, and both bite on the
first run.

1. `import 'reflect-metadata'` must be the first line of the entry point.
   Without it dependency injection silently does not work.
2. The validator rejects by throwing a **plain object** shaped
   `{ status, message }`, not a framework exception. The default exception
   filter reads the status only off its own exception type, so every validator
   rejection — a 400 on a bad body, a 404 on an undeclared route — surfaces as
   an unhandled 500. A global filter that reads the status off either shape is
   required, and its body must match whatever error schema the contract
   declares (RFC 9457 `application/problem+json` here) or the first client to
   read an error gets a shape the contract does not describe.

### The error filter, and the rule it must carry

The recipe cannot ship a filter — the error schema is the consumer's contract —
but it must ship the **invariant**, because a filter written without it is
wrong in a way that passes review and every obvious test:

> A **4xx** may carry the message: it describes what the caller did wrong, and
> the caller already knows it. A **5xx** never does: it describes what broke
> inside, and the caller has no business seeing it.

The defect that produced this rule is worth repeating verbatim, because the
shape recurs. The filter was written for the validator, which throws a plain
object `{ status, message }`, and it detected that shape by asking whether the
value has a string `message`. A plain `Error` satisfies that test identically —
so a filter aimed at one narrow source silently took on every other, and the
distinction between "our message, meant for the client" and "someone else's
message that happens to be a string" existed nowhere in the types.

Both halves failed together, and that is the part to design against: the same
exception was **exposed to an untrusted client** and **invisible in the log**,
because replacing the framework's default filter also removed its logging. A
fix that only suppresses the leak trades one failure for the other.

So the recipe's test requirement is two assertions, not one: the 5xx body does
not contain the thrown message, **and** the logger received it. A test that
checks only the body passes on a filter that has gone silent.

## `backend`, continued — the schema

**Recipe carries:**

- Prisma over Postgres, with the ORM's CLI and client **exact-pinned to the
  same version**. Not a caret on either.
- Whatever the sync design needs on every synchronised table: here `version`,
  `fieldTs`, `seq`, `deletedAt`.

**Consumer decides:** the entities, the relations, the retention rules.

**Learned here — three, and each is a different shape of trap:**

1. **An ORM cannot always express what the design needs.** One sequence shared
   by every synchronised table has no declarative form in Prisma, so the SQL is
   hand-written into the migration. That is fine, and it creates a standing
   hazard: the schema does not know the default exists, so a later migration
   touching those models can generate SQL that drops it. Silently — nothing
   fails at migration time, nothing fails at boot, and the column starts coming
   back null. The recipe's instruction is to write the warning **in both
   places**, the schema and the migration, and to read the generated SQL of
   every later migration touching those models.

2. **Verify the hand-written part with a query that has an expected answer.**
   "Remember to append the SQL" is an instruction someone can follow and not
   notice it failed. `SELECT nextval(...), nextval(...)` returning two
   consecutive numbers is a check that cannot be passed by accident. This
   mattered because the symptom of the omission appears two tasks later, in
   correct-looking code, as a cursor that never advances.

3. **Pin an ORM's CLI and client to the same exact version.** They ship a
   binary protocol between them, so a version range says "any of these is
   compatible" about a pair for which that is simply untrue. The drift does
   not fail the build or the typecheck — it fails at runtime. The tell is an
   **asymmetry inside one file**: one of the pair exact, the other a range.

**Also worth the recipe:** an applied migration is immutable. Commentary goes
beside it, not inside it — editing applied SQL desyncs the migration tool's
stored checksum, and the repair is a manual write to its bookkeeping table.

## The rules module, and the layer that persists it

**Recipe carries** the shape, not the rules: a pure module holding the decisions,
imported by a persistence layer that owns the database and nothing else.

**Learned here, and each cost a review round:**

1. **A rules module wrapped in a per-item transaction must never throw.** If it
   can, one malformed item fails the whole batch, the caller retries the same
   batch, and a client that retries by default is stuck forever behind its own
   bad item. Write "never throws for any object input" into the module's doc
   comment as an invariant, state what it excludes, and then check every
   property access, every `new Date`, every `Object.keys` against it. The
   invariant held only in someone's head is the one that breaks.
2. **A contract's type union and its wire schema are different documents.** A
   TypeScript discriminated union says each variant requires its own fields; one
   flat schema with four common `required` entries says something much weaker,
   and **the validator believes the schema**. Split by discriminator with
   `oneOf` or the type is decoration.
3. **`additionalProperties: false` on every request body.** JSON Schema defaults
   to open, so a schema with a full `required` list looks strict and accepts any
   extra field. That is the road to mass assignment, and it looks closed.
4. **Guard protocol-owned columns by an explicit list, not by key order.** An
   object spread that happens to place literals after a computed key protects
   some fields by accident; the accident survives until someone reorders the
   lines, and then nothing fails.
5. **Split database errors by whether a retry could succeed, not by exception
   class.** Those are orthogonal: a constraint violation and a type error live
   in different classes and both mean "retrying will not help"; a timeout and a
   deadlock share a class with the constraint violation and both mean "retrying
   will". Getting this backwards either fails a whole batch on bad data, or
   turns a transient blip into a permanent refusal the person is shown and the
   client discards. Keep a named set of retryable codes with the criterion
   written beside it, and **apply the criterion to the whole vocabulary**, not
   only to the codes someone named.

## The web shell, once it serves its first POST

Two defects that are invisible until the first real POST exists, and both were
found a task late:

- **A body parser must be mounted before the OpenAPI validator.** A framework
  that registers its own parser at application init puts it *after* anything
  added with `app.use`, so every POST arrives with no body and the validator
  answers 400. Disable the built-in parser and mount the parser explicitly,
  first.
- **Declare a `default` error response on every operation.** With response
  validation on, a status with no schema makes the validator throw *inside* the
  response, after the error filter has already run — so the client gets a broken
  answer exactly when something is already wrong.

Also: the body limit and the contract's own maximum must agree, in both
directions. A limit below the contract rejects legal requests; a limit raised
for one route raises it for the unauthenticated ones too, so bound the fields
themselves in the contract rather than trusting the transport limit.

## Authentication

**Recipe carries:** identical answers for an unknown account and a wrong secret,
constant-time comparison with the length check that `timingSafeEqual` requires,
and a guard that takes the identity from the token and from nothing a request
can influence.

**Learned here:** "identical" includes **time**. Answering an unknown address
without doing the key-derivation work makes the two paths differ by two orders
of magnitude, which enumerates every account on the instance with a stopwatch
and no statistics. The fix is to do the same work on the not-found path against
a fixed dummy salt and hash of the same lengths. A review that checks only the
message and the status will record this property as satisfied.

And: **do the key derivation asynchronously.** A synchronous KDF on an
unauthenticated endpoint is a denial-of-service amplifier on the very server
whose job is answering requests.

## Tests, across all of it

One rule earned repeatedly: **a test that passes with and without the code it
covers is worse than no test**, because it reads as coverage. The only way to
know is to break the code and watch the test fail. This caught a vacuous
assertion at the moment of writing once, and a round later three times.

Its corollary for a suite: **strengthening a test is changing a test**, and
deserves the same proof. A positive control added in the wrong place can make
the assertion true for a legitimate reason and silently stop measuring.

And the operational half, which cost nothing to check and would have cost
everything to miss: **make sure the suite actually runs in CI**. A workflow
written when the repository held one kind of test does not widen itself as
workspaces appear, and a green pipeline that runs a tenth of the tests looks
exactly like a green pipeline.

And the half after that one, found by the very job the paragraph above added,
on its first run: **a suite that runs is not yet a suite that runs from a clean
checkout.** The backend typechecked and passed 83 tests on every developer
machine and failed instantly in CI, because `prisma generate` was wired to
nothing. `prisma migrate deploy` — the command a CI job reaches for, since
`migrate dev` is interactive — applies migrations and does *not* generate the
client, while `migrate dev` does. So a client generated once during development
sat in `node_modules` and made the repository look buildable for as long as
nobody started from zero.

The failure does not read as a missing artefact. Against a stub `@prisma/client`
the ORM's types quietly degrade: the `Prisma` namespace loses
`PrismaClientKnownRequestError` and `TransactionIsolationLevel`, transaction
callbacks take an implicit `any`, and the spec files that import the client
throw during collection and are reported as `(0 test)` — a count that is
neither a pass nor a failure and scrolls past as neither.

**Recipe carries:** the generator runs from the package's own `postinstall`, not
from a CI step. A CI step fixes the pipeline and leaves a fresh clone broken;
`postinstall` fixes the pipeline, the fresh clone and the image build in one
line. The general rule the recipe is really carrying: **every generated artefact
the build reads must be produced by something the install runs**, because the
machine that has it will never tell you it is missing.

The same job's next red run made the point from the other side. Typecheck was
clean, and 26 of 83 tests failed on `Environment variable not found:
DATABASE_URL` — a variable the workflow sets on the job and every step can see.
**turbo runs each task in a filtered environment**, so a variable reaches the
task only if the task declares it. The suite passed under `pnpm --filter` and
failed under `turbo run` with the identical environment, and CI runs the latter.

**Recipe carries:** declare a task's variables on the task, not in `globalEnv`.
`env` is part of the cache key, which is right for the task that reads the
database and wrong for `build` and `typecheck`, which would then miss cache on
every change to a connection string they never touch.

Together the two failures are one lesson worth more than either: **a green run
on a developer machine tests the machine as much as the code.** Both defects
were invisible to every local command and instant in a clean environment, and
both were found by the first honest CI run rather than by review.

## Read-modify-write, and the test that looks like it covers it

The single worst defect on this branch survived eight per-task reviews and was
found only by the whole-branch one. The sync service read a row, let a pure
function compute the new row, and wrote **every column back** — inside a
transaction on PostgreSQL's default READ COMMITTED, with no row lock. Two
concurrent updates to *different fields of one row* therefore lost one of them,
39 times out of 40.

What makes it worth a section rather than a line: the loser's per-field
timestamp was clobbered along with its value, so the row ended up holding the
**new timestamp against the old value**. Last-write-wins is the mechanism that
is supposed to repair exactly this, and it cannot repair a row whose timestamp
lies. The client had been told `applied`, so it would never retry.

**Recipe carries:** whenever a handler reads a row, computes from it and writes
it back, the read needs `SELECT … FOR UPDATE` in the same transaction. Two
alternatives were weighed and both lose. Raising the isolation level to
`REPEATABLE READ` turns an ordinary concurrent edit — the case the design
promises is conflict-free — into a serialisation failure the client must retry.
Narrowing the `UPDATE` to the changed column repairs the timestamp but not the
version counter, and leaves the comparison itself running against a stale
snapshot, so it fixes precisely what the reproduction demonstrated and nothing
it did not.

**And the test lesson, which generalises past this stack:** the plan's Review
Focus had *named this field pair*. A test existed. It exercised two operations
arriving **out of order, sequentially** — and passed. Out-of-order sequential
arrival is not concurrency, and a test of it reads exactly like coverage of
concurrency while proving nothing about it. The replacement is staged rather
than raced: one client pauses inside its transaction immediately after the read,
the other is released from its first statement, which makes the interleaving
deterministic instead of timing-dependent. It was verified in both directions —
five of five failures with the lock removed, ten of ten passes with it — because
a concurrency test that has never been watched failing is the least trustworthy
kind of test there is.

## `core`, continued — lint, format, and why there are two tsconfigs

**Recipe carries:**

- Two tsconfigs per package, not one: `tsconfig.json` covering **everything**
  for `typecheck` and for type-aware lint, and `tsconfig.build.json` excluding
  specs for the emit. One config cannot do both jobs, and the failure is silent
  in the direction that matters.
- ESLint flat config at the workspace root, `typescript-eslint`
  `recommendedTypeChecked` with `projectService`.
- Prettier, with a `.prettierignore` covering generated code and the lockfile.
  The style values themselves are the consumer's, below — the recipe carries
  that Prettier is configured and what it is kept away from, not how wide the
  lines are.
- A `lint` turbo task declaring `dependsOn: ["^build"]`.
- `Lint` as its own CI check, separate from the test job and needing no
  database.

**Consumer decides:** the print width, the rule set beyond
`recommendedTypeChecked`, whether Markdown is formatted at all.

**Learned here:** three things, each of which would have been guessed wrong.

The two tsconfigs are not tidiness. `apps/backend` and `apps/cli` each had a
single `tsconfig.json` that excluded `*.spec.ts` so the build would not emit
them — which meant `pnpm typecheck` never looked at a spec file either. Six
type errors were sitting in spec files, none of them failing anything. Adding
lint surfaced them, and the fix is structural: the excluding config is the
build's, and typecheck and lint get the one that sees everything.

`dependsOn: ["^build"]` on the `lint` task looks like over-ordering until the
first run. Type-aware rules resolve types through the project graph, so linting
`apps/backend` needs `@todoer/specs`'s `dist/` to exist; without the dependency
the lint passes on a machine with a warm build and fails on CI, which is the
worst available ordering of those two outcomes.

**Prettier was kept away from Markdown**, deliberately. Turned loose on the
tree it rewrote the ADRs — reflowing prose whose line breaks were chosen. The
recipe should say so rather than leave the next project to discover it by
diffing seventeen decision records. The reformat itself lands in a commit of
its own whose SHA goes into `.git-blame-ignore-revs`, so `git blame` keeps
pointing at the author of the line rather than at the formatter.

## `ci` — the gates, and what a gate has to refuse

**Recipe carries:**

- The end-to-end proof script runs in CI against a **real** backend and a real
  database, not against mocks.
- The proof script has an `sh` shebang and stays POSIX.
- The test setup refuses to run against a database whose name does not end in
  `_test`, and prints the two commands that create one.
- Gates are separate checks with separate names, so a red one names its own
  cause.

**Consumer decides:** the runner, the service containers, how the database is
provisioned.

**Learned here:** the database guard is not defensive programming, it is a
repair. The DB-backed specs truncate six tables in `beforeEach` with no regard
for what is in them, and they destroyed the development database once before
the guard existed. Any recipe that ships truncating specs must ship the guard
in the same module, because the gap between the two is exactly one afternoon of
someone's data.

The POSIX rule has a specific cost attached: `set -o pipefail` is not POSIX and
`dash` rejected it outright until 0.5.12. A proof script with an `sh` shebang
and a bash-ism is a script that passes on the author's machine and fails on the
runner, and the failure looks like the thing being proved is broken.

## `backend`, continued — write ordering, and the errors a batch job may not raise

**Recipe carries:**

- Every write transaction takes a per-user advisory lock as its **first**
  statement — in Postgres, `pg_advisory_xact_lock(1, hashtext(user_id))`.
- A refused write is logged at **warn**, not error. A refusal is the system
  working.
- A batch job that processes users keeps going when one of them fails, and
  names the user in the error.
- The body parser is registered before the OpenAPI validator middleware.

**Consumer decides:** the lock's key shape, the retention window, the schedule.

**Learned here:** the lock is the answer to a race the design had already
written down and the code had not closed — two overlapping writes of one user
let a pull skip a row permanently, because the cursor is not linearizable
(ADR 0016, superseded by ADR 0017). It is worth the recipe carrying as a
default rather than as an option, because the client outbox that arrives one
module later makes overlapping writes routine rather than rare.

The deadlock test is the part worth copying. A concurrency test that has never
been watched failing is the least trustworthy kind of test there is, so the
lock-order case is staged rather than raced: one client pauses inside its
transaction immediately after the read, the other is released from its first
statement, and the interleaving becomes deterministic instead of
timing-dependent. It was then verified in both directions — five of five
failures with the lock removed, ten of ten passes with it.

The body-parser ordering is a Nest trap with a wide blast radius: Nest
registers its own parser inside `listen()`, which runs after every `app.use()`,
so an OpenAPI validator registered the obvious way reads an undefined body and
rejects **every** POST with a 400. It presents as "the contract is wrong" and
it is not.

## `specs`, continued — the contract moves first, and only what exists is scripted

**Recipe carries:**

- The route changes in `openapi.yaml` before it changes in the backend, because
  `express-openapi-validator` rejects drift at runtime — a mismatch surfaces as
  a 400 nobody expected, not as a failing test.
- `pnpm spec:validate && pnpm spec:codegen`, and the generated artefacts land in
  their own commit.

**Consumer decides:** the generator, whether a bundle step exists at all.

**Learned here:** the recipe must not carry a pipeline step the consumer has no
script for. `todoer`'s documentation described `pnpm spec:validate && pnpm
spec:bundle && pnpm spec:codegen` — copied from `course_shelf`, where
`spec:bundle` is real — and `todoer` defines no such script. It was corrected
after someone ran the documented line and got a missing-script error, which is
the cheap version of this failure; the expensive version is a recipe that tells
a new project to run three commands of which one has never existed.

## `cli` — the module `course_shelf` does not have

**Recipe carries:**

- Configuration is read and validated in **one** place, at startup, and the
  process refuses to start rather than failing at the first use.
- Exit codes are part of the interface: a caller must be able to tell from the
  code alone whether to retry, to fix its input, or to stop.
- Argument parsing treats everything after the positional as content — a `-h`
  inside a task title is a title, not a request for help.
- The local store is SQLite, holding both a replica of the server's rows and an
  outbox of operations not yet acknowledged; reads present the outbox
  **overlaid** on the replica, so a queued change is visible immediately.
- Unknown identifiers in the overlay are guarded, because the outbox can name a
  row the replica has never seen.

**Consumer decides:** the argument parser, the output format, the Node floor.

**Learned here:** the Node floor is a real constraint and belongs in the recipe
as a minimum rather than a pin — `todoer` requires **Node 24.15** for the
built-in SQLite module, which is what removes the native dependency that would
otherwise make the CLI the hardest thing in the workspace to install. That is
D12's rule exercised: the recipe says "Node 24.15+, because `node:sqlite`", not
"Node 24.15.0".

The overlay is the part a recipe has to explain rather than just prescribe. A
CLI that shows the server's rows is wrong the moment it queues an operation,
because the user's own last action is the one thing missing from the screen.
Overlaying costs an unknown-id guard on every read path, and the guard is not
optional: the outbox can create a row the replica has never seen.

## Feedback into layer 1 — the task spec outgrew the template

Not recipe material, recorded here because it was found here and nothing else
is tracking it.

`project-skeleton` ships `specs/tasks/templates/feature.md`: goal, acceptance,
spec diff, codegen impact, sub-steps. `todoer` outgrew it within a week and
replaced it with a task **spec** — numbered functional requirements each
tracing to a design question or an ADR, given/when/then scenarios, an explicit
edge-case list, and a definition of done whose success criteria are numbered
and individually checkable, with steps that cite the requirement they satisfy
and checkpoints between them.

The difference in practice: the old template says what to build, the new one
says what would prove it was built. Every requirement in the pruning task
carries the design question it came from, which means the reviewer can check
the task against the design rather than against the author's memory of it.

This belongs in `shipyard`'s `task-stack` skill and in the skeleton's template,
and it is a phase-1 or phase-2 change, not a phase-4 one.

---

*Appended after each task of the plans under `docs/plans/` in the `todoer`
repository — the walking skeleton first, then plan B1 (client outbox) and
plan B2 (pruning and snapshot). Current through `todoer` commit `5d25f20`,
2026-09-26; the CLI outbox wave was still in flight on `feat/cli-outbox` when
these lines were written.*
