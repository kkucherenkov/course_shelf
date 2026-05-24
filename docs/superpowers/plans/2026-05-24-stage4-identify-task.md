# Stage 4 — Identify Task with Per-Field Merge Policy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-reviewed `IdentifyTask` flow that takes a scraped metadata fragment (chosen from Stage 2 `scrape-preview`), applies a per-field merge policy against the existing course, and writes the merged result through the Stage 1 write path.

**Architecture:** New `identify` domain slice in the catalog bounded context: an `IdentifyTask` aggregate persisted in a new `identify_task` table (jsonb `scrapedFragment` + `mergePolicy`), a pure `computeMergedPatch` merge function, three CQRS commands (run/apply/discard), two queries (list/get), and one admin controller with five routes. Apply resolves raw names to entities via the existing `MetadataLinker` and writes via `UpdateCourseMetadataCommand` — no new write path. Two domain events (`IdentifyTaskProposed`/`IdentifyTaskApplied`) are published via `EventBus` for audit (no subscriber in this stage).

**Tech Stack:** NestJS 11 + `@nestjs/cqrs`, Prisma 7 (PostgreSQL), Vitest, OpenAPI 3.1 (spec-first → generated `@app/api-client-ts` / `@app/api-client-dart`).

**Design doc:** `docs/superpowers/specs/2026-05-24-stage4-identify-task-design.md`

**Working directory for all backend paths:** `apps/backend/`

---

## Conventions used throughout (read once)

- **Domain errors:** extend `DomainError` / `NotFound` from `src/shared/domain-error.ts`. The global `HttpExceptionFilter` maps them to RFC 9457 — never throw `HttpException` in handlers.
- **Aggregate shape:** mirror `domain/instructor/instructor.ts` — `private constructor`, `static create(props)` (validates, defaults clock via `now?: Date`), `static reconstitute(props)` (no validation, used by the Prisma adapter), getters, mutators.
- **Repository port:** interface + `Symbol` token, mirror `domain/instructor/instructor.repository.ts`.
- **Handler:** `@CommandHandler` / `@QueryHandler`, constructor-inject ports by token via `@Inject(...)`. Publish events with `EventBus` like `src/modules/learning/application/commands/record-progress.handler.ts:116`.
- **Controller:** mirror `catalog-scrape-admin.controller.ts` — `@UseGuards(AdminGuard)`, `@Controller({ path: 'admin', version: '1' })`, dispatch via `CommandBus`/`QueryBus`, no logic. Actor comes from `@Session() session: SessionContext` → `session.user` (`{ id, role }`), like `courses.controller.ts:151`.
- **Tests:** Vitest. Mock repos as `{ method: vi.fn() }` cast to the port type (see `upsert-instructor.handler.spec.ts`).
- **Run a single backend test:** `pnpm --filter @app/backend test -- <path>`.
- **`CourseLevel`** (`domain/course/course.ts:36`) and **`CourseJsonLevel`** (`domain/scan/course-json.schema.ts:53`) are the identical union `'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all_levels'` — assignable both ways.
- **`MetadataLinker`** (`application/scan/metadata-linker.ts`) already exposes: `upsertInstructorsByName(names: readonly string[]): Promise<InstructorRef[]>`, `upsertStudioByName(name: string): Promise<StudioRef | null>`, `upsertTagsByName(names: readonly string[]): Promise<TagRef[]>`. Reuse it for entity resolution.

---

## File Structure

**Create (domain):**

- `src/modules/catalog/domain/identify/merge-policy.ts` — `MergeMode`, `MergePolicy`, `defaultMergePolicy()`, `parseMergePolicy()`
- `src/modules/catalog/domain/identify/merge.ts` — `CurrentCourseView`, `EffectivePatch`, `computeMergedPatch()`
- `src/modules/catalog/domain/identify/identify-task.ts` — `IdentifyTask` aggregate + `IdentifyTaskStatus`
- `src/modules/catalog/domain/identify/identify-task.errors.ts` — `IdentifyTaskNotFoundError`, `IdentifyTaskNotPendingError`
- `src/modules/catalog/domain/identify/identify-task.events.ts` — `IdentifyTaskProposed`, `IdentifyTaskApplied`
- `src/modules/catalog/domain/identify/identify-task.repository.ts` — port + `IDENTIFY_TASK_REPOSITORY`

**Create (infra):**

- `src/modules/catalog/infra/prisma-identify-task.repository.ts`

**Create (application):**

- `src/modules/catalog/application/commands/run-identify-task.{command,handler}.ts`
- `src/modules/catalog/application/commands/apply-identify-result.{command,handler}.ts`
- `src/modules/catalog/application/commands/discard-identify-task.{command,handler}.ts`
- `src/modules/catalog/application/queries/list-identify-tasks.{query,handler}.ts`
- `src/modules/catalog/application/queries/get-identify-task.{query,handler}.ts`
- `src/modules/catalog/identify.dto.ts` — `toIdentifyTaskDto()` mapper

**Create (http):**

- `src/modules/catalog/identify-admin.controller.ts`

**Modify:**

- `apps/backend/prisma/schema.prisma` — add `IdentifyTaskStatus` enum, `IdentifyTask` model, `Course.identifyTasks` back-relation
- `packages/specs/openapi/openapi.yaml` — new schemas + 5 routes
- `src/modules/catalog/catalog.module.ts` — register controller + providers

**Tests:** colocated `*.spec.ts` next to each created `.ts` (except `*.command.ts`/`*.query.ts`/`*.events.ts` plain data objects and the DTO mapper, which are covered through handler/controller specs).

---

## Task 1: Prisma schema + migration

**Files:**

- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Add the enum and model**

After the `ExternalId` model (around `prisma/schema.prisma:238`), add:

```prisma
enum IdentifyTaskStatus {
  proposed
  applied
  discarded
}

model IdentifyTask {
  id              String             @id @default(cuid())
  courseId        String
  status          IdentifyTaskStatus @default(proposed)
  source          String
  sourceUrl       String?
  scrapedFragment Json
  mergePolicy     Json
  createdAt       DateTime           @default(now())
  completedAt     DateTime?
  course          Course             @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([courseId, status])
  @@map("identify_task")
}
```

- [ ] **Step 2: Add the back-relation on Course**

Find the `Course` model. Add this line alongside its other relation fields (e.g. near `externalIds`/instructor relations):

```prisma
  identifyTasks IdentifyTask[]
```

- [ ] **Step 3: Ensure Postgres is up, then create the migration**

Run: `docker ps --format '{{.Names}}'` — confirm the postgres container is listed. If not: `docker compose -f docker/compose.yml up -d postgres`.

Run: `pnpm --filter @app/backend exec prisma migrate dev --name add_identify_task`
Expected: a new `prisma/migrations/<timestamp>_add_identify_task/migration.sql` is created, applied, and `prisma generate` regenerates the client. Output ends with "Your database is now in sync with your schema."

- [ ] **Step 4: Verify the generated SQL**

Run: `cat apps/backend/prisma/migrations/*_add_identify_task/migration.sql`
Expected: `CREATE TYPE "IdentifyTaskStatus"`, `CREATE TABLE "identify_task"` with the columns above, an index on `(courseId, status)`, and a foreign key to `course` with `ON DELETE CASCADE`.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations
git commit -m "feat(catalog): add identify_task table + IdentifyTaskStatus enum"
```

---

## Task 2: MergePolicy value object

**Files:**

- Create: `src/modules/catalog/domain/identify/merge-policy.ts`
- Test: `src/modules/catalog/domain/identify/merge-policy.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { defaultMergePolicy, parseMergePolicy, MERGE_POLICY_FIELDS } from './merge-policy';

describe('merge-policy', () => {
  it('defaultMergePolicy sets every field to "merge"', () => {
    const policy = defaultMergePolicy();
    for (const field of MERGE_POLICY_FIELDS) {
      expect(policy[field]).toBe('merge');
    }
  });

  it('parseMergePolicy fills missing fields with "merge" and keeps valid overrides', () => {
    const policy = parseMergePolicy({ title: 'overwrite', tags: 'ignore' });
    expect(policy.title).toBe('overwrite');
    expect(policy.tags).toBe('ignore');
    expect(policy.description).toBe('merge');
  });

  it('parseMergePolicy rejects an invalid mode', () => {
    expect(() => parseMergePolicy({ title: 'bogus' })).toThrow(/invalid merge mode/i);
  });

  it('parseMergePolicy returns the default when given undefined', () => {
    expect(parseMergePolicy(undefined)).toEqual(defaultMergePolicy());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/domain/identify/merge-policy.spec.ts`
Expected: FAIL — cannot find module `./merge-policy`.

- [ ] **Step 3: Write the implementation**

```ts
/**
 * WHY this file exists:
 * MergePolicy declares, per scraped field, how Stage 4 reconciles the scraped
 * value with the existing course value: `merge` (fill-if-empty for scalars,
 * union for arrays), `overwrite` (replace), or `ignore` (no-op). The default is
 * `merge` everywhere — the safest choice, never destroying curated data.
 *
 * parseMergePolicy validates an untrusted partial (from the HTTP request body
 * or a persisted jsonb column) and fills any absent field with `merge`.
 */
import { InvariantViolation } from '../../../../shared/domain-error';

export type MergeMode = 'merge' | 'overwrite' | 'ignore';

export const MERGE_POLICY_FIELDS = [
  'title',
  'description',
  'level',
  'language',
  'posterUrl',
  'releaseDate',
  'ratingAverage',
  'ratingCount',
  'instructors',
  'studios',
  'tags',
  'externalIds',
] as const;

export type MergePolicyField = (typeof MERGE_POLICY_FIELDS)[number];

export type MergePolicy = Record<MergePolicyField, MergeMode>;

const VALID_MODES: ReadonlySet<string> = new Set<MergeMode>(['merge', 'overwrite', 'ignore']);

/** All fields default to `merge` — never destroys existing data. */
export function defaultMergePolicy(): MergePolicy {
  return Object.fromEntries(MERGE_POLICY_FIELDS.map((f) => [f, 'merge'])) as MergePolicy;
}

/**
 * Validate an untrusted partial policy. Unknown keys are ignored; absent fields
 * fall back to `merge`. Throws InvariantViolation (422) on an invalid mode.
 */
export function parseMergePolicy(raw: Partial<Record<string, unknown>> | undefined): MergePolicy {
  const policy = defaultMergePolicy();
  if (raw === undefined || raw === null) return policy;
  for (const field of MERGE_POLICY_FIELDS) {
    const value = raw[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !VALID_MODES.has(value)) {
      throw new InvariantViolation(
        `invalid merge mode for "${field}": ${JSON.stringify(value)}`,
        'identify-invalid-merge-mode',
      );
    }
    policy[field] = value as MergeMode;
  }
  return policy;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/domain/identify/merge-policy.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/catalog/domain/identify/merge-policy.ts src/modules/catalog/domain/identify/merge-policy.spec.ts
git commit -m "feat(catalog): MergePolicy value object + parse/default"
```

---

## Task 3: Pure merge function

**Files:**

- Create: `src/modules/catalog/domain/identify/merge.ts`
- Test: `src/modules/catalog/domain/identify/merge.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { computeMergedPatch, type CurrentCourseView } from './merge';
import { defaultMergePolicy } from './merge-policy';

import type { ScrapedCourseFragment } from '../scraper/scraper.types';

function makeCurrent(overrides: Partial<CurrentCourseView> = {}): CurrentCourseView {
  return {
    title: 'Existing Title',
    description: undefined,
    level: undefined,
    language: undefined,
    posterUrl: undefined,
    releaseDate: undefined,
    ratingAverage: undefined,
    ratingCount: undefined,
    instructors: [],
    studios: [],
    tags: [],
    externalIds: [],
    ...overrides,
  };
}

describe('computeMergedPatch', () => {
  it('merge fills an empty scalar but leaves a present one untouched', () => {
    const current = makeCurrent({ description: undefined, title: 'Keep Me' });
    const fragment: ScrapedCourseFragment = { title: 'Scraped Title', description: 'Scraped Desc' };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.description).toBe('Scraped Desc'); // was empty → filled
    expect(patch.title).toBeUndefined(); // already present → omitted
  });

  it('overwrite replaces a present scalar', () => {
    const current = makeCurrent({ title: 'Old' });
    const fragment: ScrapedCourseFragment = { title: 'New' };
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      title: 'overwrite',
    });
    expect(patch.title).toBe('New');
  });

  it('ignore omits the field even when scraped has a value', () => {
    const current = makeCurrent();
    const fragment: ScrapedCourseFragment = { description: 'X' };
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      description: 'ignore',
    });
    expect(patch.description).toBeUndefined();
  });

  it('merge unions instructor names by slug, appending only new ones', () => {
    const current = makeCurrent({ instructors: [{ displayName: 'Jane Doe' }] });
    const fragment: ScrapedCourseFragment = { instructorNames: ['Jane Doe', 'John Roe'] };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.instructorNames).toEqual(['Jane Doe', 'John Roe']);
  });

  it('overwrite arrays replace with scraped names', () => {
    const current = makeCurrent({ tags: [{ displayName: 'old' }] });
    const fragment: ScrapedCourseFragment = { tags: ['new'] };
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      tags: 'overwrite',
    });
    expect(patch.tagNames).toEqual(['new']);
  });

  it('merge unions externalIds by (source, externalId)', () => {
    const current = makeCurrent({ externalIds: [{ source: 'a', externalId: '1' }] });
    const fragment: ScrapedCourseFragment = {
      externalIds: [
        { source: 'a', externalId: '1' },
        { source: 'b', externalId: '2' },
      ],
    };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.externalIds).toEqual([
      { source: 'a', externalId: '1' },
      { source: 'b', externalId: '2' },
    ]);
  });

  it('does not clear an array when scraped provides nothing (even on overwrite)', () => {
    const current = makeCurrent({ tags: [{ displayName: 'keep' }] });
    const fragment: ScrapedCourseFragment = {};
    const patch = computeMergedPatch(current, fragment, {
      ...defaultMergePolicy(),
      tags: 'overwrite',
    });
    expect(patch.tagNames).toBeUndefined();
  });

  it('maps studioName (single) into studioNames union', () => {
    const current = makeCurrent({ studios: [] });
    const fragment: ScrapedCourseFragment = { studioName: 'Acme' };
    const patch = computeMergedPatch(current, fragment, defaultMergePolicy());
    expect(patch.studioNames).toEqual(['Acme']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/domain/identify/merge.spec.ts`
Expected: FAIL — cannot find module `./merge`.

- [ ] **Step 3: Write the implementation**

```ts
/**
 * WHY this file exists:
 * computeMergedPatch is the pure heart of Stage 4 identify: given the current
 * course (as a minimal read-only view), a scraped fragment, and a per-field
 * MergePolicy, it produces an EffectivePatch describing exactly what should be
 * written. It performs NO I/O — entity-name resolution (names → ids) is the
 * caller's job (ApplyIdentifyResultHandler via MetadataLinker), keeping this
 * function trivially unit-testable.
 *
 * Field semantics:
 *   scalar  merge     → fill only if current is empty
 *   scalar  overwrite → replace, but only when the fragment has a value
 *   array   merge     → union (entities by slug, externalIds by source+externalId)
 *   array   overwrite → replace with scraped, but only when scraped is non-empty
 *   *       ignore    → field omitted from the patch entirely
 *
 * Omitted fields are simply absent from EffectivePatch — the caller maps
 * "present key" → write, "absent key" → leave unchanged. Arrays are never
 * cleared from an empty scrape (overwrite with nothing is a no-op, not a wipe).
 */
import { slugify } from '../shared-vo/entity-slug';

import type { CourseLevel } from '../course/course';
import type { ExternalIdRef } from '../shared-vo/external-id-ref';
import type { ScrapedCourseFragment } from '../scraper/scraper.types';
import type { MergeMode, MergePolicy } from './merge-policy';

/** Minimal read-only projection of the current Course needed to merge. Course satisfies this structurally. */
export interface CurrentCourseView {
  readonly title: string;
  readonly description?: string;
  readonly level?: CourseLevel;
  readonly language?: string;
  readonly posterUrl?: string;
  readonly releaseDate?: Date;
  readonly ratingAverage?: number;
  readonly ratingCount?: number;
  readonly instructors: readonly { readonly displayName: string }[];
  readonly studios: readonly { readonly displayName: string }[];
  readonly tags: readonly { readonly displayName: string }[];
  readonly externalIds: readonly ExternalIdRef[];
}

/** What to write. Absent key = leave unchanged. Names are unresolved (caller resolves to ids). */
export interface EffectivePatch {
  title?: string;
  description?: string;
  level?: CourseLevel;
  language?: string;
  posterUrl?: string;
  releaseDate?: string; // ISO date string from the fragment; caller parses to Date
  ratingAverage?: number;
  ratingCount?: number;
  externalIds?: ExternalIdRef[];
  instructorNames?: string[];
  studioNames?: string[];
  tagNames?: string[];
}

function pickScalar<T>(
  currentEmpty: boolean,
  scraped: T | undefined,
  mode: MergeMode,
): T | undefined {
  if (mode === 'ignore' || scraped === undefined) return undefined;
  if (mode === 'overwrite' || currentEmpty) return scraped;
  return undefined; // merge + current present → keep current (omit)
}

function isEmptyString(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

function mergeNames(
  currentNames: readonly string[],
  scrapedNames: readonly string[],
  mode: MergeMode,
): string[] | undefined {
  if (mode === 'ignore' || scrapedNames.length === 0) return undefined;
  if (mode === 'overwrite') return [...scrapedNames];
  const seen = new Set(currentNames.map((n) => slugify(n)));
  const union = [...currentNames];
  for (const name of scrapedNames) {
    const key = slugify(name);
    if (!seen.has(key)) {
      seen.add(key);
      union.push(name);
    }
  }
  return union;
}

function mergeExternalIds(
  current: readonly ExternalIdRef[],
  scraped: readonly ExternalIdRef[],
  mode: MergeMode,
): ExternalIdRef[] | undefined {
  if (mode === 'ignore' || scraped.length === 0) return undefined;
  if (mode === 'overwrite') return [...scraped];
  const key = (r: ExternalIdRef): string => `${r.source}::${r.externalId}`;
  const seen = new Set(current.map(key));
  const union = [...current];
  for (const ref of scraped) {
    if (!seen.has(key(ref))) {
      seen.add(key(ref));
      union.push(ref);
    }
  }
  return union;
}

export function computeMergedPatch(
  current: CurrentCourseView,
  fragment: ScrapedCourseFragment,
  policy: MergePolicy,
): EffectivePatch {
  const patch: EffectivePatch = {};

  const title = pickScalar(isEmptyString(current.title), fragment.title, policy.title);
  if (title !== undefined) patch.title = title;

  const description = pickScalar(
    isEmptyString(current.description),
    fragment.description,
    policy.description,
  );
  if (description !== undefined) patch.description = description;

  const level = pickScalar(current.level === undefined, fragment.level, policy.level);
  if (level !== undefined) patch.level = level;

  const language = pickScalar(isEmptyString(current.language), fragment.language, policy.language);
  if (language !== undefined) patch.language = language;

  const posterUrl = pickScalar(
    isEmptyString(current.posterUrl),
    fragment.posterUrl,
    policy.posterUrl,
  );
  if (posterUrl !== undefined) patch.posterUrl = posterUrl;

  const releaseDate = pickScalar(
    current.releaseDate === undefined,
    fragment.releaseDate,
    policy.releaseDate,
  );
  if (releaseDate !== undefined) patch.releaseDate = releaseDate;

  const ratingAverage = pickScalar(
    current.ratingAverage === undefined,
    fragment.ratingAverage,
    policy.ratingAverage,
  );
  if (ratingAverage !== undefined) patch.ratingAverage = ratingAverage;

  const ratingCount = pickScalar(
    current.ratingCount === undefined,
    fragment.ratingCount,
    policy.ratingCount,
  );
  if (ratingCount !== undefined) patch.ratingCount = ratingCount;

  const instructorNames = mergeNames(
    current.instructors.map((i) => i.displayName),
    fragment.instructorNames ?? [],
    policy.instructors,
  );
  if (instructorNames !== undefined) patch.instructorNames = instructorNames;

  const studioNames = mergeNames(
    current.studios.map((s) => s.displayName),
    fragment.studioName ? [fragment.studioName] : [],
    policy.studios,
  );
  if (studioNames !== undefined) patch.studioNames = studioNames;

  const tagNames = mergeNames(
    current.tags.map((t) => t.displayName),
    fragment.tags ?? [],
    policy.tags,
  );
  if (tagNames !== undefined) patch.tagNames = tagNames;

  const externalIds = mergeExternalIds(
    current.externalIds,
    fragment.externalIds ?? [],
    policy.externalIds,
  );
  if (externalIds !== undefined) patch.externalIds = externalIds;

  return patch;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/domain/identify/merge.spec.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/catalog/domain/identify/merge.ts src/modules/catalog/domain/identify/merge.spec.ts
git commit -m "feat(catalog): pure computeMergedPatch merge function"
```

---

## Task 4: IdentifyTask aggregate + errors + events

**Files:**

- Create: `src/modules/catalog/domain/identify/identify-task.errors.ts`
- Create: `src/modules/catalog/domain/identify/identify-task.events.ts`
- Create: `src/modules/catalog/domain/identify/identify-task.ts`
- Test: `src/modules/catalog/domain/identify/identify-task.spec.ts`

- [ ] **Step 1: Write the errors file**

```ts
/**
 * WHY this file exists:
 * Domain errors for the IdentifyTask aggregate, mapped to RFC 9457 by the global
 * filter. NotFound (404) for a missing task; a 409 conflict when a caller tries
 * to apply/discard a task that is no longer in the `proposed` state.
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

export class IdentifyTaskNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Identify task "${id}" does not exist.`, 'identify-task-not-found');
    this.name = 'IdentifyTaskNotFoundError';
  }
}

/** Thrown when apply/discard is attempted on a task that is not in `proposed` state. */
export class IdentifyTaskNotPendingError extends DomainError {
  constructor(id: string, status: string) {
    super({
      code: 'identify-task-not-pending',
      status: 409,
      title: 'Identify task not pending',
      detail: `Identify task "${id}" is "${status}" and can no longer be applied or discarded.`,
    });
    this.name = 'IdentifyTaskNotPendingError';
  }
}
```

- [ ] **Step 2: Write the events file**

```ts
/**
 * WHY this file exists:
 * Audit domain events for the identify flow. Plain classes (no decorator) —
 * published via Nest's EventBus by the command handlers. No subscriber ships in
 * Stage 4; a concrete audit sink is a future follow-up. They exist now so the
 * publication points are wired and stable.
 */
export class IdentifyTaskProposed {
  constructor(
    readonly taskId: string,
    readonly courseId: string,
    readonly source: string,
    readonly proposedAt: Date,
  ) {}
}

export class IdentifyTaskApplied {
  constructor(
    readonly taskId: string,
    readonly courseId: string,
    readonly actorId: string,
    readonly appliedAt: Date,
  ) {}
}
```

- [ ] **Step 3: Write the failing aggregate test**

```ts
import { describe, expect, it } from 'vitest';

import { IdentifyTask } from './identify-task';
import { IdentifyTaskNotPendingError } from './identify-task.errors';
import { defaultMergePolicy } from './merge-policy';

function make(): IdentifyTask {
  return IdentifyTask.create({
    id: 'task-1',
    courseId: 'course-1',
    source: 'youtube',
    scrapedFragment: { title: 'X' },
    mergePolicy: defaultMergePolicy(),
    now: new Date('2026-05-24T00:00:00.000Z'),
  });
}

describe('IdentifyTask', () => {
  it('create starts in proposed with no completedAt', () => {
    const task = make();
    expect(task.status).toBe('proposed');
    expect(task.completedAt).toBeUndefined();
  });

  it('markApplied transitions to applied, records policy + completedAt', () => {
    const task = make();
    const policy = { ...defaultMergePolicy(), title: 'overwrite' as const };
    const at = new Date('2026-05-25T00:00:00.000Z');
    task.markApplied(policy, at);
    expect(task.status).toBe('applied');
    expect(task.completedAt).toBe(at);
    expect(task.mergePolicy.title).toBe('overwrite');
  });

  it('markDiscarded transitions to discarded', () => {
    const task = make();
    task.markDiscarded(new Date());
    expect(task.status).toBe('discarded');
  });

  it('throws IdentifyTaskNotPendingError when applying twice', () => {
    const task = make();
    task.markApplied(defaultMergePolicy(), new Date());
    expect(() => task.markApplied(defaultMergePolicy(), new Date())).toThrow(
      IdentifyTaskNotPendingError,
    );
  });

  it('throws IdentifyTaskNotPendingError when discarding an applied task', () => {
    const task = make();
    task.markApplied(defaultMergePolicy(), new Date());
    expect(() => task.markDiscarded(new Date())).toThrow(IdentifyTaskNotPendingError);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/domain/identify/identify-task.spec.ts`
Expected: FAIL — cannot find module `./identify-task`.

- [ ] **Step 5: Write the aggregate**

```ts
/**
 * WHY this file exists:
 * IdentifyTask is the aggregate root for one admin-reviewed enrichment proposal.
 * It owns the status lifecycle (proposed → applied | discarded) and rejects
 * transitions out of a non-proposed state. The scraped fragment and the merge
 * policy are carried as plain data (persisted as jsonb). markApplied records the
 * policy actually used so the row is a faithful audit trail.
 */
import { IdentifyTaskNotPendingError } from './identify-task.errors';

import type { ScrapedCourseFragment } from '../scraper/scraper.types';
import type { MergePolicy } from './merge-policy';

export type IdentifyTaskStatus = 'proposed' | 'applied' | 'discarded';

export interface IdentifyTaskProps {
  readonly id: string;
  readonly courseId: string;
  readonly status: IdentifyTaskStatus;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly scrapedFragment: ScrapedCourseFragment;
  readonly mergePolicy: MergePolicy;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

export class IdentifyTask {
  readonly id: string;
  readonly courseId: string;
  readonly source: string;
  readonly sourceUrl: string | undefined;
  readonly scrapedFragment: ScrapedCourseFragment;
  readonly createdAt: Date;
  private _status: IdentifyTaskStatus;
  private _mergePolicy: MergePolicy;
  private _completedAt: Date | undefined;

  private constructor(props: IdentifyTaskProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.source = props.source;
    this.sourceUrl = props.sourceUrl;
    this.scrapedFragment = props.scrapedFragment;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._mergePolicy = props.mergePolicy;
    this._completedAt = props.completedAt;
  }

  get status(): IdentifyTaskStatus {
    return this._status;
  }

  get mergePolicy(): MergePolicy {
    return this._mergePolicy;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  static create(props: {
    id: string;
    courseId: string;
    source: string;
    sourceUrl?: string;
    scrapedFragment: ScrapedCourseFragment;
    mergePolicy: MergePolicy;
    now?: Date;
  }): IdentifyTask {
    const now = props.now ?? new Date();
    return new IdentifyTask({
      id: props.id,
      courseId: props.courseId,
      status: 'proposed',
      source: props.source,
      sourceUrl: props.sourceUrl,
      scrapedFragment: props.scrapedFragment,
      mergePolicy: props.mergePolicy,
      createdAt: now,
    });
  }

  static reconstitute(props: IdentifyTaskProps): IdentifyTask {
    return new IdentifyTask(props);
  }

  /** Record the policy actually applied and complete the task. */
  markApplied(finalPolicy: MergePolicy, now: Date): void {
    this.assertPending();
    this._mergePolicy = finalPolicy;
    this._status = 'applied';
    this._completedAt = now;
  }

  markDiscarded(now: Date): void {
    this.assertPending();
    this._status = 'discarded';
    this._completedAt = now;
  }

  private assertPending(): void {
    if (this._status !== 'proposed') {
      throw new IdentifyTaskNotPendingError(this.id, this._status);
    }
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/domain/identify/identify-task.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/modules/catalog/domain/identify/identify-task.ts src/modules/catalog/domain/identify/identify-task.errors.ts src/modules/catalog/domain/identify/identify-task.events.ts src/modules/catalog/domain/identify/identify-task.spec.ts
git commit -m "feat(catalog): IdentifyTask aggregate + errors + events"
```

---

## Task 5: Repository port

**Files:**

- Create: `src/modules/catalog/domain/identify/identify-task.repository.ts`

(No spec — interface only; covered through handler/adapter specs.)

- [ ] **Step 1: Write the port**

```ts
/**
 * WHY this file exists:
 * Port (interface + Symbol token) for IdentifyTask persistence. The application
 * layer depends only on this; PrismaIdentifyTaskRepository implements it and is
 * bound by the token in CatalogModule.
 *
 *   Token:   IDENTIFY_TASK_REPOSITORY
 *   Port:    IdentifyTaskRepository
 *   Adapter: PrismaIdentifyTaskRepository (infra/prisma-identify-task.repository.ts)
 */
import type { IdentifyTask, IdentifyTaskStatus } from './identify-task';

export const IDENTIFY_TASK_REPOSITORY = Symbol('IDENTIFY_TASK_REPOSITORY');

export interface IdentifyTaskRepository {
  /** Insert or update the task row (jsonb fragment + policy serialized). */
  save(task: IdentifyTask): Promise<void>;

  /** Return the task by id, or null when not found. */
  findById(id: string): Promise<IdentifyTask | null>;

  /**
   * List tasks newest-first, optionally narrowed by status and/or courseId.
   * Both filters are AND-combined when present.
   */
  findMany(filter: { status?: IdentifyTaskStatus; courseId?: string }): Promise<IdentifyTask[]>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/catalog/domain/identify/identify-task.repository.ts
git commit -m "feat(catalog): IdentifyTaskRepository port + token"
```

---

## Task 6: Prisma repository adapter

**Files:**

- Create: `src/modules/catalog/infra/prisma-identify-task.repository.ts`
- Test: `src/modules/catalog/infra/prisma-identify-task.repository.spec.ts`

The adapter mirrors the structure of the other adapters in `infra/` (constructor-inject `PrismaService`). Check an existing one (e.g. `infra/prisma-instructor.repository.ts`) for the exact `PrismaService` import path and injection style before writing — match it.

- [ ] **Step 1: Write the failing test**

This test verifies the pure mapping logic (`toDomain`) without a live DB by exporting and exercising it. Place `toDomain` as a module-private function and test it through a thin exported helper.

```ts
import { describe, expect, it } from 'vitest';

import { identifyTaskRowToDomain } from './prisma-identify-task.repository';
import { defaultMergePolicy } from '../domain/identify/merge-policy';

describe('identifyTaskRowToDomain', () => {
  it('reconstitutes an aggregate from a row, preserving jsonb fields', () => {
    const task = identifyTaskRowToDomain({
      id: 'task-1',
      courseId: 'course-1',
      status: 'proposed',
      source: 'youtube',
      sourceUrl: null,
      scrapedFragment: { title: 'X', tags: ['a'] },
      mergePolicy: defaultMergePolicy(),
      createdAt: new Date('2026-05-24T00:00:00.000Z'),
      completedAt: null,
    });
    expect(task.id).toBe('task-1');
    expect(task.status).toBe('proposed');
    expect(task.scrapedFragment.title).toBe('X');
    expect(task.sourceUrl).toBeUndefined();
    expect(task.completedAt).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/prisma-identify-task.repository.spec.ts`
Expected: FAIL — `identifyTaskRowToDomain` not exported.

- [ ] **Step 3: Write the adapter**

```ts
/**
 * WHY this file exists:
 * Prisma adapter implementing IdentifyTaskRepository. The jsonb columns
 * (scrapedFragment, mergePolicy) round-trip as plain objects; on read they are
 * cast back to their domain types (the DB is the source of truth, written only
 * by this app). identifyTaskRowToDomain is exported for unit testing the mapping.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { IdentifyTask } from '../domain/identify/identify-task';

import type { IdentifyTaskStatus } from '../domain/identify/identify-task';
import type { IdentifyTaskRepository } from '../domain/identify/identify-task.repository';
import type { MergePolicy } from '../domain/identify/merge-policy';
import type { ScrapedCourseFragment } from '../domain/scraper/scraper.types';

interface IdentifyTaskRow {
  id: string;
  courseId: string;
  status: string;
  source: string;
  sourceUrl: string | null;
  scrapedFragment: unknown;
  mergePolicy: unknown;
  createdAt: Date;
  completedAt: Date | null;
}

export function identifyTaskRowToDomain(row: IdentifyTaskRow): IdentifyTask {
  return IdentifyTask.reconstitute({
    id: row.id,
    courseId: row.courseId,
    status: row.status as IdentifyTaskStatus,
    source: row.source,
    sourceUrl: row.sourceUrl ?? undefined,
    scrapedFragment: row.scrapedFragment as ScrapedCourseFragment,
    mergePolicy: row.mergePolicy as MergePolicy,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  });
}

@Injectable()
export class PrismaIdentifyTaskRepository implements IdentifyTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(task: IdentifyTask): Promise<void> {
    const data = {
      courseId: task.courseId,
      status: task.status,
      source: task.source,
      sourceUrl: task.sourceUrl ?? null,
      scrapedFragment: task.scrapedFragment as object,
      mergePolicy: task.mergePolicy as object,
      completedAt: task.completedAt ?? null,
    };
    await this.prisma.identifyTask.upsert({
      where: { id: task.id },
      create: { id: task.id, createdAt: task.createdAt, ...data },
      update: data,
    });
  }

  async findById(id: string): Promise<IdentifyTask | null> {
    const row = await this.prisma.identifyTask.findUnique({ where: { id } });
    return row ? identifyTaskRowToDomain(row) : null;
  }

  async findMany(filter: {
    status?: IdentifyTaskStatus;
    courseId?: string;
  }): Promise<IdentifyTask[]> {
    const rows = await this.prisma.identifyTask.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.courseId ? { courseId: filter.courseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(identifyTaskRowToDomain);
  }
}
```

> If `PrismaService` lives at a different path, fix the import to match the sibling adapters. The `prisma.identifyTask` delegate exists after Task 1's `prisma generate`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/infra/prisma-identify-task.repository.spec.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/modules/catalog/infra/prisma-identify-task.repository.ts src/modules/catalog/infra/prisma-identify-task.repository.spec.ts
git commit -m "feat(catalog): PrismaIdentifyTaskRepository adapter"
```

---

## Task 7: OpenAPI spec + codegen

**Files:**

- Modify: `packages/specs/openapi/openapi.yaml`

This task lands in **two commits**: the spec edit, then the regenerated client artifacts (per the repo's spec-first rule).

- [ ] **Step 1: Add the component schemas**

In `packages/specs/openapi/openapi.yaml`, under `components.schemas` (alphabetically near the existing `Identify`/`Scrape` schemas), add:

```yaml
MergeMode:
  type: string
  enum: [merge, overwrite, ignore]
  description: >-
    How one field reconciles scraped vs existing values. `merge` fills empty
    scalars / unions arrays; `overwrite` replaces; `ignore` leaves unchanged.
  example: merge

MergePolicyDto:
  type: object
  description: Per-field merge mode. Any omitted field defaults to `merge`.
  properties:
    title: { $ref: '#/components/schemas/MergeMode' }
    description: { $ref: '#/components/schemas/MergeMode' }
    level: { $ref: '#/components/schemas/MergeMode' }
    language: { $ref: '#/components/schemas/MergeMode' }
    posterUrl: { $ref: '#/components/schemas/MergeMode' }
    releaseDate: { $ref: '#/components/schemas/MergeMode' }
    ratingAverage: { $ref: '#/components/schemas/MergeMode' }
    ratingCount: { $ref: '#/components/schemas/MergeMode' }
    instructors: { $ref: '#/components/schemas/MergeMode' }
    studios: { $ref: '#/components/schemas/MergeMode' }
    tags: { $ref: '#/components/schemas/MergeMode' }
    externalIds: { $ref: '#/components/schemas/MergeMode' }

IdentifyTaskStatus:
  type: string
  enum: [proposed, applied, discarded]
  description: Lifecycle state of an identify task.
  example: proposed

IdentifyTaskDto:
  type: object
  required: [id, courseId, status, source, scrapedFragment, mergePolicy, createdAt]
  description: An admin-reviewed metadata enrichment proposal for a course.
  properties:
    id: { type: string, example: 'clx123' }
    courseId: { type: string, example: 'clc456' }
    status: { $ref: '#/components/schemas/IdentifyTaskStatus' }
    source:
      type: string
      description: Label of the scraper/source that produced the fragment.
      example: youtube
    sourceUrl:
      type: string
      format: uri
      description: URL the fragment was scraped from, if any.
    scrapedFragment: { $ref: '#/components/schemas/ScrapedCourseFragmentDto' }
    mergePolicy: { $ref: '#/components/schemas/MergePolicyDto' }
    createdAt: { type: string, format: date-time }
    completedAt: { type: string, format: date-time }

IdentifyTaskListDto:
  type: object
  required: [tasks]
  description: Identify tasks, newest first.
  properties:
    tasks:
      type: array
      items: { $ref: '#/components/schemas/IdentifyTaskDto' }

RunIdentifyRequest:
  type: object
  required: [fragment, source]
  description: >-
    Create an identify proposal from a chosen scrape candidate. The fragment
    is typically one of the candidates returned by scrape-preview.
  properties:
    fragment: { $ref: '#/components/schemas/ScrapedCourseFragmentDto' }
    source:
      type: string
      description: Label of the source/scraper this fragment came from.
      example: youtube
    sourceUrl:
      type: string
      format: uri
    mergePolicy:
      allOf: [{ $ref: '#/components/schemas/MergePolicyDto' }]
      description: Optional initial policy. Defaults to `merge` for every field.

ApplyIdentifyRequest:
  type: object
  description: Apply a proposed identify task, optionally overriding its merge policy.
  properties:
    mergePolicy:
      allOf: [{ $ref: '#/components/schemas/MergePolicyDto' }]
      description: Overrides the policy stored on the task when present.
```

- [ ] **Step 2: Add the paths**

Under `paths`, after the existing `/api/v1/admin/courses/{id}/scrape-preview` block, add the identify route on courses:

```yaml
/api/v1/admin/courses/{id}/identify:
  post:
    operationId: runIdentifyTask
    summary: Create an identify proposal for a course
    description: >-
      Persists a chosen scraped fragment as a `proposed` IdentifyTask. Nothing
      is written to the course until the task is applied. Requires admin role.
    tags: [admin, Identify]
    security: [{ bearerAuth: [] }]
    parameters:
      - { name: id, in: path, required: true, schema: { type: string } }
    requestBody:
      required: true
      content:
        application/json:
          schema: { $ref: '#/components/schemas/RunIdentifyRequest' }
    responses:
      '201':
        description: The created identify task
        content:
          application/json:
            schema: { $ref: '#/components/schemas/IdentifyTaskDto' }
      '401': { $ref: '#/components/responses/Unauthorized' }
      '403': { $ref: '#/components/responses/Forbidden' }
      '404': { $ref: '#/components/responses/NotFound' }

/api/v1/admin/identify-tasks:
  get:
    operationId: listIdentifyTasks
    summary: List identify tasks
    tags: [admin, Identify]
    security: [{ bearerAuth: [] }]
    parameters:
      - name: status
        in: query
        required: false
        schema: { $ref: '#/components/schemas/IdentifyTaskStatus' }
      - name: courseId
        in: query
        required: false
        schema: { type: string }
    responses:
      '200':
        description: Matching identify tasks
        content:
          application/json:
            schema: { $ref: '#/components/schemas/IdentifyTaskListDto' }
      '401': { $ref: '#/components/responses/Unauthorized' }
      '403': { $ref: '#/components/responses/Forbidden' }

/api/v1/admin/identify-tasks/{id}:
  get:
    operationId: getIdentifyTask
    summary: Get one identify task
    tags: [admin, Identify]
    security: [{ bearerAuth: [] }]
    parameters:
      - { name: id, in: path, required: true, schema: { type: string } }
    responses:
      '200':
        description: The identify task
        content:
          application/json:
            schema: { $ref: '#/components/schemas/IdentifyTaskDto' }
      '401': { $ref: '#/components/responses/Unauthorized' }
      '403': { $ref: '#/components/responses/Forbidden' }
      '404': { $ref: '#/components/responses/NotFound' }

/api/v1/admin/identify-tasks/{id}/apply:
  post:
    operationId: applyIdentifyResult
    summary: Apply a proposed identify task to its course
    description: >-
      Merges the scraped fragment into the course per the (optionally
      overridden) merge policy, resolving names to entities. Requires admin role.
    tags: [admin, Identify]
    security: [{ bearerAuth: [] }]
    parameters:
      - { name: id, in: path, required: true, schema: { type: string } }
    requestBody:
      required: false
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApplyIdentifyRequest' }
    responses:
      '200':
        description: The applied identify task
        content:
          application/json:
            schema: { $ref: '#/components/schemas/IdentifyTaskDto' }
      '401': { $ref: '#/components/responses/Unauthorized' }
      '403': { $ref: '#/components/responses/Forbidden' }
      '404': { $ref: '#/components/responses/NotFound' }
      '409':
        description: Task is not in the proposed state
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }

/api/v1/admin/identify-tasks/{id}/discard:
  post:
    operationId: discardIdentifyTask
    summary: Discard a proposed identify task
    tags: [admin, Identify]
    security: [{ bearerAuth: [] }]
    parameters:
      - { name: id, in: path, required: true, schema: { type: string } }
    responses:
      '200':
        description: The discarded identify task
        content:
          application/json:
            schema: { $ref: '#/components/schemas/IdentifyTaskDto' }
      '401': { $ref: '#/components/responses/Unauthorized' }
      '403': { $ref: '#/components/responses/Forbidden' }
      '404': { $ref: '#/components/responses/NotFound' }
      '409':
        description: Task is not in the proposed state
        content:
          application/problem+json:
            schema: { $ref: '#/components/schemas/Problem' }
```

> **Before writing**, grep the file for the reusable response refs: `grep -n "Unauthorized:\|Forbidden:\|NotFound:" packages/specs/openapi/openapi.yaml`. If `components.responses.Unauthorized/Forbidden/NotFound` do **not** exist, replace each `$ref` with the inline `401/403/404` problem-response block already used by the scrape-preview path (copy from `openapi.yaml:1160-1180`). Do not invent refs that aren't defined.

- [ ] **Step 3: Validate, bundle, and codegen**

Run: `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
Expected: validation passes; bundle + codegen complete with no errors. Generated files under `packages/api-client-ts/src/generated/` and `packages/api-client-dart/lib/generated/` change to include `IdentifyTaskDto`, `MergePolicyDto`, `MergeMode`, `RunIdentifyRequest`, `ApplyIdentifyRequest`, `IdentifyTaskListDto`, `IdentifyTaskStatus`.

- [ ] **Step 4: Confirm the new types export**

Run: `grep -rn "IdentifyTaskDto\|RunIdentifyRequest" packages/api-client-ts/src/generated/ | head`
Expected: matches in the generated types file.

- [ ] **Step 5: Commit the spec, then the artifacts (two commits)**

```bash
git add packages/specs/openapi/openapi.yaml
git commit -m "feat(specs): identify-task admin routes + merge-policy schemas"
git add packages/api-client-ts packages/api-client-dart
git commit -m "chore(codegen): regenerate clients for identify-task routes"
```

---

## Task 8: RunIdentifyTask command + handler

**Files:**

- Create: `src/modules/catalog/application/commands/run-identify-task.command.ts`
- Create: `src/modules/catalog/application/commands/run-identify-task.handler.ts`
- Test: `src/modules/catalog/application/commands/run-identify-task.handler.spec.ts`
- Create: `src/modules/catalog/identify.dto.ts`

- [ ] **Step 1: Write the command + DTO mapper**

`run-identify-task.command.ts`:

```ts
/**
 * WHY this file exists:
 * Inputs for creating an identify proposal. The fragment is already chosen by
 * the admin (preview-then-commit) — the handler does not invoke any scraper.
 */
import type { ScrapedCourseFragment } from '../../domain/scraper/scraper.types';
import type { MergePolicy } from '../../domain/identify/merge-policy';

export class RunIdentifyTaskCommand {
  constructor(
    public readonly courseId: string,
    public readonly source: string,
    public readonly sourceUrl: string | undefined,
    public readonly fragment: ScrapedCourseFragment,
    public readonly mergePolicy: MergePolicy,
  ) {}
}
```

`identify.dto.ts`:

```ts
/**
 * WHY this file exists:
 * Maps the IdentifyTask aggregate to its OpenAPI DTO. Dates serialize to ISO
 * strings; jsonb fragment/policy pass through unchanged (their domain shapes
 * already match the generated DTO shapes).
 */
import type { IdentifyTask } from './domain/identify/identify-task';
import type { IdentifyTaskDto } from '@app/api-client-ts';

export function toIdentifyTaskDto(task: IdentifyTask): IdentifyTaskDto {
  return {
    id: task.id,
    courseId: task.courseId,
    status: task.status,
    source: task.source,
    ...(task.sourceUrl !== undefined ? { sourceUrl: task.sourceUrl } : {}),
    scrapedFragment: task.scrapedFragment,
    mergePolicy: task.mergePolicy,
    createdAt: task.createdAt.toISOString(),
    ...(task.completedAt !== undefined ? { completedAt: task.completedAt.toISOString() } : {}),
  };
}
```

> If the generated `IdentifyTaskDto` types `scrapedFragment`/`mergePolicy` more strictly than the domain types, add a narrow cast (`task.scrapedFragment as IdentifyTaskDto['scrapedFragment']`) rather than `any`.

- [ ] **Step 2: Write the failing handler test**

```ts
import { describe, expect, it, vi } from 'vitest';

import { RunIdentifyTaskCommand } from './run-identify-task.command';
import { RunIdentifyTaskHandler } from './run-identify-task.handler';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IdentifyTaskProposed } from '../../domain/identify/identify-task.events';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { EventBus } from '@nestjs/cqrs';

function makeDeps() {
  const courseRepo = { findById: vi.fn() } as unknown as CourseRepository;
  const taskRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
  } as IdentifyTaskRepository;
  const eventBus = { publish: vi.fn() } as unknown as EventBus;
  return { courseRepo, taskRepo, eventBus };
}

describe('RunIdentifyTaskHandler', () => {
  it('throws CourseNotFoundError when the course does not exist', async () => {
    const { courseRepo, taskRepo, eventBus } = makeDeps();
    vi.mocked(courseRepo.findById).mockResolvedValue(null);
    const handler = new RunIdentifyTaskHandler(courseRepo, taskRepo, eventBus);

    await expect(
      handler.execute(
        new RunIdentifyTaskCommand(
          'missing',
          'youtube',
          undefined,
          { title: 'X' },
          defaultMergePolicy(),
        ),
      ),
    ).rejects.toBeInstanceOf(CourseNotFoundError);
    expect(taskRepo.save).not.toHaveBeenCalled();
  });

  it('persists a proposed task and publishes IdentifyTaskProposed', async () => {
    const { courseRepo, taskRepo, eventBus } = makeDeps();
    vi.mocked(courseRepo.findById).mockResolvedValue({ id: 'c1' } as never);
    const handler = new RunIdentifyTaskHandler(courseRepo, taskRepo, eventBus);

    const dto = await handler.execute(
      new RunIdentifyTaskCommand(
        'c1',
        'youtube',
        'https://x.test',
        { title: 'X' },
        defaultMergePolicy(),
      ),
    );

    expect(taskRepo.save).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(IdentifyTaskProposed));
    expect(dto.status).toBe('proposed');
    expect(dto.courseId).toBe('c1');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/run-identify-task.handler.spec.ts`
Expected: FAIL — cannot find module `./run-identify-task.handler`.

- [ ] **Step 4: Write the handler**

```ts
/**
 * WHY this file exists:
 * Creates an IdentifyTask proposal from an already-chosen scraped fragment
 * (preview-then-commit — no scraper is invoked here). Verifies the target course
 * exists, persists the task as `proposed`, and publishes IdentifyTaskProposed.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskProposed } from '../../domain/identify/identify-task.events';
import { toIdentifyTaskDto } from '../../identify.dto';

import { RunIdentifyTaskCommand } from './run-identify-task.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@CommandHandler(RunIdentifyTaskCommand)
export class RunIdentifyTaskHandler implements ICommandHandler<
  RunIdentifyTaskCommand,
  IdentifyTaskDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(IDENTIFY_TASK_REPOSITORY) private readonly taskRepo: IdentifyTaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RunIdentifyTaskCommand): Promise<IdentifyTaskDto> {
    const course = await this.courseRepo.findById(command.courseId);
    if (!course) throw new CourseNotFoundError(command.courseId);

    const task = IdentifyTask.create({
      id: nanoid(),
      courseId: command.courseId,
      source: command.source,
      sourceUrl: command.sourceUrl,
      scrapedFragment: command.fragment,
      mergePolicy: command.mergePolicy,
    });
    await this.taskRepo.save(task);
    this.eventBus.publish(
      new IdentifyTaskProposed(task.id, task.courseId, task.source, task.createdAt),
    );
    return toIdentifyTaskDto(task);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/run-identify-task.handler.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/catalog/application/commands/run-identify-task.command.ts src/modules/catalog/application/commands/run-identify-task.handler.ts src/modules/catalog/application/commands/run-identify-task.handler.spec.ts src/modules/catalog/identify.dto.ts
git commit -m "feat(catalog): RunIdentifyTask command + handler"
```

---

## Task 9: ApplyIdentifyResult command + handler

**Files:**

- Create: `src/modules/catalog/application/commands/apply-identify-result.command.ts`
- Create: `src/modules/catalog/application/commands/apply-identify-result.handler.ts`
- Test: `src/modules/catalog/application/commands/apply-identify-result.handler.spec.ts`

- [ ] **Step 1: Write the command**

```ts
/**
 * WHY this file exists:
 * Inputs for applying a proposed identify task. mergePolicy, when present,
 * overrides the policy stored on the task. actor is forwarded into the
 * downstream UpdateCourseMetadataCommand.
 */
import type { MergePolicy } from '../../domain/identify/merge-policy';

export class ApplyIdentifyResultCommand {
  constructor(
    public readonly taskId: string,
    public readonly actor: { id: string; role: string },
    public readonly mergePolicy: MergePolicy | undefined,
  ) {}
}
```

- [ ] **Step 2: Write the failing handler test**

```ts
import { describe, expect, it, vi } from 'vitest';

import { ApplyIdentifyResultCommand } from './apply-identify-result.command';
import { ApplyIdentifyResultHandler } from './apply-identify-result.handler';
import { UpdateCourseMetadataCommand } from './update-course-metadata.command';
import { IdentifyTask } from '../../domain/identify/identify-task';
import {
  IdentifyTaskNotFoundError,
  IdentifyTaskNotPendingError,
} from '../../domain/identify/identify-task.errors';
import { IdentifyTaskApplied } from '../../domain/identify/identify-task.events';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { MetadataLinker } from '../scan/metadata-linker';
import type { CommandBus, EventBus } from '@nestjs/cqrs';

const ACTOR = { id: 'admin-1', role: 'admin' };

function makeTask(
  fragment = { instructorNames: ['Jane Doe'], description: 'Scraped' },
): IdentifyTask {
  return IdentifyTask.create({
    id: 'task-1',
    courseId: 'c1',
    source: 'youtube',
    scrapedFragment: fragment,
    mergePolicy: defaultMergePolicy(),
    now: new Date('2026-05-24T00:00:00.000Z'),
  });
}

/** A current course with no description and no instructors (so merge fills them). */
function makeCourse() {
  return {
    title: 'Existing',
    description: undefined,
    level: undefined,
    language: undefined,
    posterUrl: undefined,
    releaseDate: undefined,
    ratingAverage: undefined,
    ratingCount: undefined,
    instructors: [],
    studios: [],
    tags: [],
    externalIds: [],
  };
}

function makeDeps() {
  const taskRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
  } as IdentifyTaskRepository;
  const courseRepo = { findById: vi.fn() } as unknown as CourseRepository;
  const linker = {
    upsertInstructorsByName: vi.fn(async () => [
      { id: 'i1', slug: 'jane-doe', displayName: 'Jane Doe' },
    ]),
    upsertStudioByName: vi.fn(async () => null),
    upsertTagsByName: vi.fn(async () => []),
  } as unknown as MetadataLinker;
  const commandBus = { execute: vi.fn(async () => ({})) } as unknown as CommandBus;
  const eventBus = { publish: vi.fn() } as unknown as EventBus;
  return { taskRepo, courseRepo, linker, commandBus, eventBus };
}

describe('ApplyIdentifyResultHandler', () => {
  it('throws IdentifyTaskNotFoundError when the task is missing', async () => {
    const d = makeDeps();
    vi.mocked(d.taskRepo.findById).mockResolvedValue(null);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );
    await expect(
      handler.execute(new ApplyIdentifyResultCommand('nope', ACTOR, undefined)),
    ).rejects.toBeInstanceOf(IdentifyTaskNotFoundError);
  });

  it('rejects an already-applied task', async () => {
    const d = makeDeps();
    const task = makeTask();
    task.markApplied(defaultMergePolicy(), new Date());
    vi.mocked(d.taskRepo.findById).mockResolvedValue(task);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );
    await expect(
      handler.execute(new ApplyIdentifyResultCommand('task-1', ACTOR, undefined)),
    ).rejects.toBeInstanceOf(IdentifyTaskNotPendingError);
  });

  it('merges, resolves names, dispatches UpdateCourseMetadataCommand, marks applied, emits event', async () => {
    const d = makeDeps();
    vi.mocked(d.taskRepo.findById).mockResolvedValue(makeTask());
    vi.mocked(d.courseRepo.findById).mockResolvedValue(makeCourse() as never);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );

    const dto = await handler.execute(new ApplyIdentifyResultCommand('task-1', ACTOR, undefined));

    // resolved instructor names → ids in the dispatched command
    const dispatched = vi.mocked(d.commandBus.execute).mock
      .calls[0][0] as UpdateCourseMetadataCommand;
    expect(dispatched).toBeInstanceOf(UpdateCourseMetadataCommand);
    expect(dispatched.patch.instructorIds).toEqual(['i1']);
    expect(dispatched.patch.description).toBe('Scraped'); // filled (was empty)
    expect(d.linker.upsertInstructorsByName).toHaveBeenCalledWith(['Jane Doe']);
    expect(d.eventBus.publish).toHaveBeenCalledWith(expect.any(IdentifyTaskApplied));
    expect(d.taskRepo.save).toHaveBeenCalledOnce();
    expect(dto.status).toBe('applied');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/apply-identify-result.handler.spec.ts`
Expected: FAIL — cannot find module `./apply-identify-result.handler`.

- [ ] **Step 4: Write the handler**

```ts
/**
 * WHY this file exists:
 * Applies a proposed IdentifyTask. Computes the merged patch (pure), resolves
 * raw instructor/studio/tag names to entity ids via MetadataLinker, then writes
 * through UpdateCourseMetadataCommand — reusing the Stage 1 atomic write path
 * rather than duplicating it. Finally marks the task applied and publishes
 * IdentifyTaskApplied.
 *
 * Known limitation: the course write and the task-status save are not in one
 * transaction. Re-applying is guarded by the `proposed` invariant, and the merge
 * is idempotent (union / fill-if-empty / replace), so a crash between the two
 * leaves the course updated and the task re-appliable safely.
 */
import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { IdentifyTaskApplied } from '../../domain/identify/identify-task.events';
import { computeMergedPatch } from '../../domain/identify/merge';
import { MetadataLinker } from '../scan/metadata-linker';
import { UpdateCourseMetadataCommand } from './update-course-metadata.command';
import { toIdentifyTaskDto } from '../../identify.dto';

import { ApplyIdentifyResultCommand } from './apply-identify-result.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@CommandHandler(ApplyIdentifyResultCommand)
export class ApplyIdentifyResultHandler implements ICommandHandler<
  ApplyIdentifyResultCommand,
  IdentifyTaskDto
> {
  constructor(
    @Inject(IDENTIFY_TASK_REPOSITORY) private readonly taskRepo: IdentifyTaskRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    private readonly linker: MetadataLinker,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApplyIdentifyResultCommand): Promise<IdentifyTaskDto> {
    const task = await this.taskRepo.findById(command.taskId);
    if (!task) throw new IdentifyTaskNotFoundError(command.taskId);

    const course = await this.courseRepo.findById(task.courseId);
    if (!course) throw new CourseNotFoundError(task.courseId);

    const policy = command.mergePolicy ?? task.mergePolicy;
    const patch = computeMergedPatch(course, task.scrapedFragment, policy);

    const cmdPatch: UpdateCourseMetadataCommand['patch'] = {};
    if (patch.title !== undefined) cmdPatch.title = patch.title;
    if (patch.description !== undefined) cmdPatch.description = patch.description;
    if (patch.level !== undefined) cmdPatch.level = patch.level;
    if (patch.language !== undefined) cmdPatch.language = patch.language;
    if (patch.posterUrl !== undefined) cmdPatch.posterUrl = patch.posterUrl;
    if (patch.releaseDate !== undefined) cmdPatch.releaseDate = new Date(patch.releaseDate);
    if (patch.externalIds !== undefined) cmdPatch.externalIds = patch.externalIds;

    // Rating must be written as a pair; only write when both values are available.
    if (patch.ratingAverage !== undefined || patch.ratingCount !== undefined) {
      const avg = patch.ratingAverage ?? course.ratingAverage;
      const count = patch.ratingCount ?? course.ratingCount;
      if (avg !== undefined && count !== undefined) {
        cmdPatch.ratingAverage = avg;
        cmdPatch.ratingCount = count;
      }
    }

    if (patch.instructorNames !== undefined) {
      const refs = await this.linker.upsertInstructorsByName(patch.instructorNames);
      cmdPatch.instructorIds = refs.map((r) => r.id);
    }
    if (patch.studioNames !== undefined) {
      const ids: string[] = [];
      for (const name of patch.studioNames) {
        const ref = await this.linker.upsertStudioByName(name);
        if (ref) ids.push(ref.id);
      }
      cmdPatch.studioIds = ids;
    }
    if (patch.tagNames !== undefined) {
      const refs = await this.linker.upsertTagsByName(patch.tagNames);
      cmdPatch.tagIds = refs.map((r) => r.id);
    }

    await this.commandBus.execute(
      new UpdateCourseMetadataCommand(task.courseId, command.actor, cmdPatch),
    );

    const now = new Date();
    task.markApplied(policy, now);
    await this.taskRepo.save(task);
    this.eventBus.publish(new IdentifyTaskApplied(task.id, task.courseId, command.actor.id, now));

    return toIdentifyTaskDto(task);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/apply-identify-result.handler.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/catalog/application/commands/apply-identify-result.command.ts src/modules/catalog/application/commands/apply-identify-result.handler.ts src/modules/catalog/application/commands/apply-identify-result.handler.spec.ts
git commit -m "feat(catalog): ApplyIdentifyResult command + handler"
```

---

## Task 10: DiscardIdentifyTask command + handler

**Files:**

- Create: `src/modules/catalog/application/commands/discard-identify-task.command.ts`
- Create: `src/modules/catalog/application/commands/discard-identify-task.handler.ts`
- Test: `src/modules/catalog/application/commands/discard-identify-task.handler.spec.ts`

- [ ] **Step 1: Write the command**

```ts
/** WHY this file exists: input for discarding a proposed identify task. */
export class DiscardIdentifyTaskCommand {
  constructor(public readonly taskId: string) {}
}
```

- [ ] **Step 2: Write the failing handler test**

```ts
import { describe, expect, it, vi } from 'vitest';

import { DiscardIdentifyTaskCommand } from './discard-identify-task.command';
import { DiscardIdentifyTaskHandler } from './discard-identify-task.handler';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';

function makeTask(): IdentifyTask {
  return IdentifyTask.create({
    id: 'task-1',
    courseId: 'c1',
    source: 'youtube',
    scrapedFragment: { title: 'X' },
    mergePolicy: defaultMergePolicy(),
  });
}

describe('DiscardIdentifyTaskHandler', () => {
  it('throws when the task is missing', async () => {
    const repo = { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() } as IdentifyTaskRepository;
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new DiscardIdentifyTaskHandler(repo);
    await expect(handler.execute(new DiscardIdentifyTaskCommand('x'))).rejects.toBeInstanceOf(
      IdentifyTaskNotFoundError,
    );
  });

  it('marks the task discarded and saves', async () => {
    const repo = { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() } as IdentifyTaskRepository;
    vi.mocked(repo.findById).mockResolvedValue(makeTask());
    const handler = new DiscardIdentifyTaskHandler(repo);
    const dto = await handler.execute(new DiscardIdentifyTaskCommand('task-1'));
    expect(dto.status).toBe('discarded');
    expect(repo.save).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/discard-identify-task.handler.spec.ts`
Expected: FAIL — cannot find module `./discard-identify-task.handler`.

- [ ] **Step 4: Write the handler**

```ts
/**
 * WHY this file exists:
 * Discards a proposed IdentifyTask (admin rejects the proposal). The aggregate
 * enforces the proposed-state invariant; this handler just loads, transitions,
 * and saves. No course write, no event (discard is not an audit-worthy mutation
 * of catalog data).
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { toIdentifyTaskDto } from '../../identify.dto';

import { DiscardIdentifyTaskCommand } from './discard-identify-task.command';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@CommandHandler(DiscardIdentifyTaskCommand)
export class DiscardIdentifyTaskHandler implements ICommandHandler<
  DiscardIdentifyTaskCommand,
  IdentifyTaskDto
> {
  constructor(@Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository) {}

  async execute(command: DiscardIdentifyTaskCommand): Promise<IdentifyTaskDto> {
    const task = await this.repo.findById(command.taskId);
    if (!task) throw new IdentifyTaskNotFoundError(command.taskId);
    task.markDiscarded(new Date());
    await this.repo.save(task);
    return toIdentifyTaskDto(task);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/commands/discard-identify-task.handler.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/catalog/application/commands/discard-identify-task.command.ts src/modules/catalog/application/commands/discard-identify-task.handler.ts src/modules/catalog/application/commands/discard-identify-task.handler.spec.ts
git commit -m "feat(catalog): DiscardIdentifyTask command + handler"
```

---

## Task 11: List + Get queries + handlers

**Files:**

- Create: `src/modules/catalog/application/queries/list-identify-tasks.query.ts`
- Create: `src/modules/catalog/application/queries/list-identify-tasks.handler.ts`
- Create: `src/modules/catalog/application/queries/get-identify-task.query.ts`
- Create: `src/modules/catalog/application/queries/get-identify-task.handler.ts`
- Test: `src/modules/catalog/application/queries/identify-task-queries.spec.ts`

- [ ] **Step 1: Write the queries**

`list-identify-tasks.query.ts`:

```ts
/** WHY this file exists: inputs for listing identify tasks with optional filters. */
import type { IdentifyTaskStatus } from '../../domain/identify/identify-task';

export class ListIdentifyTasksQuery {
  constructor(
    public readonly status: IdentifyTaskStatus | undefined,
    public readonly courseId: string | undefined,
  ) {}
}
```

`get-identify-task.query.ts`:

```ts
/** WHY this file exists: input for fetching a single identify task by id. */
export class GetIdentifyTaskQuery {
  constructor(public readonly id: string) {}
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';

import { ListIdentifyTasksQuery } from './list-identify-tasks.query';
import { ListIdentifyTasksHandler } from './list-identify-tasks.handler';
import { GetIdentifyTaskQuery } from './get-identify-task.query';
import { GetIdentifyTaskHandler } from './get-identify-task.handler';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';

function makeTask(id = 'task-1'): IdentifyTask {
  return IdentifyTask.create({
    id,
    courseId: 'c1',
    source: 'youtube',
    scrapedFragment: { title: 'X' },
    mergePolicy: defaultMergePolicy(),
  });
}

function makeRepo(): IdentifyTaskRepository {
  return { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() };
}

describe('identify-task queries', () => {
  it('list maps repo results to a list DTO and forwards filters', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findMany).mockResolvedValue([makeTask()]);
    const handler = new ListIdentifyTasksHandler(repo);
    const dto = await handler.execute(new ListIdentifyTasksQuery('proposed', 'c1'));
    expect(repo.findMany).toHaveBeenCalledWith({ status: 'proposed', courseId: 'c1' });
    expect(dto.tasks).toHaveLength(1);
    expect(dto.tasks[0].id).toBe('task-1');
  });

  it('get returns the DTO when found', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(makeTask('task-9'));
    const handler = new GetIdentifyTaskHandler(repo);
    const dto = await handler.execute(new GetIdentifyTaskQuery('task-9'));
    expect(dto.id).toBe('task-9');
  });

  it('get throws IdentifyTaskNotFoundError when missing', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new GetIdentifyTaskHandler(repo);
    await expect(handler.execute(new GetIdentifyTaskQuery('nope'))).rejects.toBeInstanceOf(
      IdentifyTaskNotFoundError,
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/queries/identify-task-queries.spec.ts`
Expected: FAIL — cannot find the handler modules.

- [ ] **Step 4: Write the handlers**

`list-identify-tasks.handler.ts`:

```ts
/**
 * WHY this file exists:
 * Read-side handler listing identify tasks (newest first) with optional status
 * and courseId filters. Maps aggregates to DTOs; no writes.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { toIdentifyTaskDto } from '../../identify.dto';

import { ListIdentifyTasksQuery } from './list-identify-tasks.query';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskListDto } from '@app/api-client-ts';

@QueryHandler(ListIdentifyTasksQuery)
export class ListIdentifyTasksHandler implements IQueryHandler<
  ListIdentifyTasksQuery,
  IdentifyTaskListDto
> {
  constructor(@Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository) {}

  async execute(query: ListIdentifyTasksQuery): Promise<IdentifyTaskListDto> {
    const tasks = await this.repo.findMany({
      ...(query.status ? { status: query.status } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    });
    return { tasks: tasks.map(toIdentifyTaskDto) };
  }
}
```

`get-identify-task.handler.ts`:

```ts
/**
 * WHY this file exists:
 * Read-side handler fetching one identify task by id. Throws
 * IdentifyTaskNotFoundError (404) when absent.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { toIdentifyTaskDto } from '../../identify.dto';

import { GetIdentifyTaskQuery } from './get-identify-task.query';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@QueryHandler(GetIdentifyTaskQuery)
export class GetIdentifyTaskHandler implements IQueryHandler<
  GetIdentifyTaskQuery,
  IdentifyTaskDto
> {
  constructor(@Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository) {}

  async execute(query: GetIdentifyTaskQuery): Promise<IdentifyTaskDto> {
    const task = await this.repo.findById(query.id);
    if (!task) throw new IdentifyTaskNotFoundError(query.id);
    return toIdentifyTaskDto(task);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/application/queries/identify-task-queries.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/catalog/application/queries/list-identify-tasks.query.ts src/modules/catalog/application/queries/list-identify-tasks.handler.ts src/modules/catalog/application/queries/get-identify-task.query.ts src/modules/catalog/application/queries/get-identify-task.handler.ts src/modules/catalog/application/queries/identify-task-queries.spec.ts
git commit -m "feat(catalog): list + get identify-task queries"
```

---

## Task 12: Admin controller

**Files:**

- Create: `src/modules/catalog/identify-admin.controller.ts`
- Test: `src/modules/catalog/identify-admin.controller.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';

import { IdentifyAdminController } from './identify-admin.controller';
import { RunIdentifyTaskCommand } from './application/commands/run-identify-task.command';
import { ApplyIdentifyResultCommand } from './application/commands/apply-identify-result.command';
import { DiscardIdentifyTaskCommand } from './application/commands/discard-identify-task.command';
import { ListIdentifyTasksQuery } from './application/queries/list-identify-tasks.query';
import { GetIdentifyTaskQuery } from './application/queries/get-identify-task.query';

import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { SessionContext } from '../../common/auth/decorators';

const SESSION = { user: { id: 'admin-1', role: 'admin' } } as unknown as SessionContext;

function buses(result: unknown) {
  const commandBus = { execute: vi.fn(async () => result) } as unknown as CommandBus;
  const queryBus = { execute: vi.fn(async () => result) } as unknown as QueryBus;
  return { commandBus, queryBus };
}

describe('IdentifyAdminController', () => {
  it('POST courses/:id/identify dispatches RunIdentifyTaskCommand with the default merge policy', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.runIdentify('c1', { fragment: { title: 'X' }, source: 'youtube' });
    const cmd = vi.mocked(commandBus.execute).mock.calls[0][0] as RunIdentifyTaskCommand;
    expect(cmd).toBeInstanceOf(RunIdentifyTaskCommand);
    expect(cmd.courseId).toBe('c1');
    expect(cmd.mergePolicy.title).toBe('merge'); // default applied
  });

  it('POST identify-tasks/:id/apply forwards actor + optional policy', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.applyIdentify('t1', { mergePolicy: { title: 'overwrite' } }, SESSION);
    const cmd = vi.mocked(commandBus.execute).mock.calls[0][0] as ApplyIdentifyResultCommand;
    expect(cmd).toBeInstanceOf(ApplyIdentifyResultCommand);
    expect(cmd.actor.id).toBe('admin-1');
    expect(cmd.mergePolicy?.title).toBe('overwrite');
  });

  it('POST identify-tasks/:id/discard dispatches DiscardIdentifyTaskCommand', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.discardIdentify('t1');
    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(DiscardIdentifyTaskCommand));
  });

  it('GET identify-tasks forwards status + courseId filters', async () => {
    const { commandBus, queryBus } = buses({ tasks: [] });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.listIdentify('proposed', 'c1');
    const q = vi.mocked(queryBus.execute).mock.calls[0][0] as ListIdentifyTasksQuery;
    expect(q).toBeInstanceOf(ListIdentifyTasksQuery);
    expect(q.status).toBe('proposed');
    expect(q.courseId).toBe('c1');
  });

  it('GET identify-tasks/:id dispatches GetIdentifyTaskQuery', async () => {
    const { commandBus, queryBus } = buses({ id: 't1' });
    const controller = new IdentifyAdminController(commandBus, queryBus);
    await controller.getIdentify('t1');
    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetIdentifyTaskQuery));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/identify-admin.controller.spec.ts`
Expected: FAIL — cannot find module `./identify-admin.controller`.

- [ ] **Step 3: Write the controller**

```ts
/**
 * WHY this file exists:
 * Admin-only HTTP entry point for the identify subsystem (Stage 4). Composition
 * only — parses the body into a validated MergePolicy, dispatches the CQRS
 * command/query, returns the OpenAPI-shaped DTO. Domain errors become RFC 9457
 * via the global filter. AdminGuard protects every route; actor comes from the
 * session for the apply audit trail.
 *
 *   POST /api/v1/admin/courses/{id}/identify           → create proposal (201)
 *   GET  /api/v1/admin/identify-tasks?status=&courseId= → list
 *   GET  /api/v1/admin/identify-tasks/{id}             → get one
 *   POST /api/v1/admin/identify-tasks/{id}/apply       → apply (200)
 *   POST /api/v1/admin/identify-tasks/{id}/discard     → discard (200)
 */
import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { parseMergePolicy } from './domain/identify/merge-policy';
import { RunIdentifyTaskCommand } from './application/commands/run-identify-task.command';
import { ApplyIdentifyResultCommand } from './application/commands/apply-identify-result.command';
import { DiscardIdentifyTaskCommand } from './application/commands/discard-identify-task.command';
import { ListIdentifyTasksQuery } from './application/queries/list-identify-tasks.query';
import { GetIdentifyTaskQuery } from './application/queries/get-identify-task.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { IdentifyTaskStatus } from './domain/identify/identify-task';
import type { ScrapedCourseFragment } from './domain/scraper/scraper.types';
import type {
  ApplyIdentifyRequest,
  IdentifyTaskDto,
  IdentifyTaskListDto,
  RunIdentifyRequest,
} from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class IdentifyAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** POST /api/v1/admin/courses/:id/identify */
  @Post('courses/:id/identify')
  @HttpCode(201)
  async runIdentify(
    @Param('id') id: string,
    @Body() body: RunIdentifyRequest,
  ): Promise<IdentifyTaskDto> {
    const policy = parseMergePolicy(body.mergePolicy ?? undefined);
    return this.commandBus.execute<RunIdentifyTaskCommand, IdentifyTaskDto>(
      new RunIdentifyTaskCommand(
        id,
        body.source,
        body.sourceUrl ?? undefined,
        body.fragment as ScrapedCourseFragment,
        policy,
      ),
    );
  }

  /** GET /api/v1/admin/identify-tasks?status=&courseId= */
  @Get('identify-tasks')
  async listIdentify(
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
  ): Promise<IdentifyTaskListDto> {
    return this.queryBus.execute<ListIdentifyTasksQuery, IdentifyTaskListDto>(
      new ListIdentifyTasksQuery(status as IdentifyTaskStatus | undefined, courseId),
    );
  }

  /** GET /api/v1/admin/identify-tasks/:id */
  @Get('identify-tasks/:id')
  async getIdentify(@Param('id') id: string): Promise<IdentifyTaskDto> {
    return this.queryBus.execute<GetIdentifyTaskQuery, IdentifyTaskDto>(
      new GetIdentifyTaskQuery(id),
    );
  }

  /** POST /api/v1/admin/identify-tasks/:id/apply */
  @Post('identify-tasks/:id/apply')
  @HttpCode(200)
  async applyIdentify(
    @Param('id') id: string,
    @Body() body: ApplyIdentifyRequest,
    @Session() session: SessionContext,
  ): Promise<IdentifyTaskDto> {
    const policy = body?.mergePolicy ? parseMergePolicy(body.mergePolicy) : undefined;
    return this.commandBus.execute<ApplyIdentifyResultCommand, IdentifyTaskDto>(
      new ApplyIdentifyResultCommand(id, session.user, policy),
    );
  }

  /** POST /api/v1/admin/identify-tasks/:id/discard */
  @Post('identify-tasks/:id/discard')
  @HttpCode(200)
  async discardIdentify(@Param('id') id: string): Promise<IdentifyTaskDto> {
    return this.commandBus.execute<DiscardIdentifyTaskCommand, IdentifyTaskDto>(
      new DiscardIdentifyTaskCommand(id),
    );
  }
}
```

> The test calls `applyIdentify('t1', {...}, SESSION)` with the body before the session — keep the parameter order `(@Param, @Body, @Session)` exactly as written so the spec matches the signature.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test -- src/modules/catalog/identify-admin.controller.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/catalog/identify-admin.controller.ts src/modules/catalog/identify-admin.controller.spec.ts
git commit -m "feat(catalog): IdentifyAdminController — 5 admin routes"
```

---

## Task 13: Module wiring + full gate sweep + bookkeeping

**Files:**

- Modify: `src/modules/catalog/catalog.module.ts`
- Modify: `specs/tasks/active.md`, `specs/tasks/done.md`

- [ ] **Step 1: Register the controller, providers, and repository binding**

In `catalog.module.ts`:

1. Add imports near the other handler imports (around line 88):

```ts
import { RunIdentifyTaskHandler } from './application/commands/run-identify-task.handler';
import { ApplyIdentifyResultHandler } from './application/commands/apply-identify-result.handler';
import { DiscardIdentifyTaskHandler } from './application/commands/discard-identify-task.handler';
import { ListIdentifyTasksHandler } from './application/queries/list-identify-tasks.handler';
import { GetIdentifyTaskHandler } from './application/queries/get-identify-task.handler';
import { IdentifyAdminController } from './identify-admin.controller';
import { IDENTIFY_TASK_REPOSITORY } from './domain/identify/identify-task.repository';
import { PrismaIdentifyTaskRepository } from './infra/prisma-identify-task.repository';
```

2. Add `IdentifyAdminController` to the `controllers` array (after `CatalogScrapeAdminController`).

3. Add the five handlers to the `providers` array (after `ScrapeCourseHandler` / its registry block):

```ts
    RunIdentifyTaskHandler,
    ApplyIdentifyResultHandler,
    DiscardIdentifyTaskHandler,
    ListIdentifyTasksHandler,
    GetIdentifyTaskHandler,
```

4. Add the repository binding alongside the other `{ provide: …_REPOSITORY, useClass: … }` lines (near line 198):

```ts
    { provide: IDENTIFY_TASK_REPOSITORY, useClass: PrismaIdentifyTaskRepository },
```

> `MetadataLinker` is already a provider in this module (used by RunScan), so `ApplyIdentifyResultHandler` can inject it. `CommandBus`/`EventBus`/`QueryBus` are provided by the imported `CqrsModule`. No extra wiring needed.

- [ ] **Step 2: Run the full backend test suite**

Run: `pnpm --filter @app/backend test`
Expected: all suites pass (the Stage 2 baseline was 1499 passed / 2 skipped; this adds new passing specs). If any DI resolution test for `CatalogModule` exists, it must still pass with the new providers.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @app/backend exec tsc --noEmit`
Expected: no errors.

Run: `pnpm --filter @app/backend lint --fix`
Expected: clean (pre-existing `boundaries` deprecation warnings are acceptable, matching the Stage 2 baseline).

- [ ] **Step 4: Confirm no spec drift**

Run: `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`
Run: `git status --porcelain packages/api-client-ts packages/api-client-dart`
Expected: no output (clean) — the artifacts were already committed in Task 7. If anything changed, commit it as `chore(codegen): …` before proceeding.

- [ ] **Step 5: Format**

Run: `pnpm format`
Expected: writes any formatting fixes; review with `git diff --stat`.

- [ ] **Step 6: Update the task stack**

Move the active entry to the top of `specs/tasks/done.md` with the PR link (follow the template/format already used in `done.md` — see the Stage 2 entry `T-2026-05-23-002`), then reset `specs/tasks/active.md` to the "no active tasks" placeholder.

- [ ] **Step 7: Commit**

```bash
git add src/modules/catalog/catalog.module.ts specs/tasks/active.md specs/tasks/done.md
git commit -m "feat(catalog): wire identify-task module + archive Stage 4 task"
```

---

## Final verification (before opening the PR)

- [ ] `pnpm --filter @app/backend test` — green
- [ ] `pnpm --filter @app/backend exec tsc --noEmit` — clean
- [ ] `pnpm --filter @app/backend lint` — clean (only pre-existing `boundaries` warnings)
- [ ] `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen` then `git status` — no drift
- [ ] Manual smoke (optional, requires docker stack): create a course, `POST /api/v1/admin/courses/{id}/scrape-preview`, take a candidate's `fragment`, `POST .../identify`, then `POST .../identify-tasks/{taskId}/apply`, and confirm `GET /api/v1/courses/{id}` reflects the merged metadata.

---

## Notes for the implementer

- **Why apply reuses `UpdateCourseMetadataCommand`:** it already validates entity ids, enforces slug uniqueness, and lands the whole patch in one `repo.save`. Duplicating that write logic in the apply handler would drift. The merge computation (pure) plus name→id resolution (MetadataLinker) is the only new logic.
- **Why names, not ids, flow out of `computeMergedPatch`:** the scraped fragment carries raw names; resolution requires I/O (find-or-create), which must stay out of the pure function. The handler resolves immediately before dispatching.
- **Rating is a pair:** `UpdateCourseMetadataHandler.setRating` expects average + count together. The apply handler only writes rating when both final values exist (see Task 9 Step 4).
- **No transaction across course-write + task-save:** acceptable per the design (idempotent merge + `proposed` invariant). Documented in the handler header — do not "fix" it by inventing a cross-aggregate transaction.
- **Do not edit** `packages/api-client-*/src/generated/` by hand — only via `pnpm spec:codegen` (Task 7).
