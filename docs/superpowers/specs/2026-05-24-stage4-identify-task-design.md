# courseShelf — Stage 4: Identify task с per-field merge policy (design)

- Date: 2026-05-24
- Branch (base): builds on Stage 2 (`#209`, scraper port + scrape-preview) и Stage 1 (`#208`, Stash-style модель + upsert/set CQRS)
- Roadmap source: `~/.claude/plans/memoized-chasing-nest.md` § "Roadmap — Stages 2–6", Stage 4 paragraph
- Status: approved (design phase)
- Note: **Stage 3 (scraper_source / community-DB connector) пропущен** по решению — Stage 4 не зависит от него (использует скрейперы Stage 2 как источник фрагмента).

## Context

Stage 1 заложил модель данных и write-путь: aggregates `Instructor`/`Studio`/`Tag`, расширенный `Course` (poster, level, language, releaseDate, rating, externalIds), нормализованную `ExternalId` с `@@unique([source, externalId])`, CQRS `UpdateCourseMetadataCommand` + upsert/set-команды, и `MetadataLinker` — scan-layer хелпер, конвертирующий сырые display-имена в персистентные сущности (`upsertInstructorsByName` / `upsertStudioByName` / `upsertTagsByName`). `MetadataLinker` явно помечен «No domain events are emitted here (deferred to Stage 4)».

Stage 2 ввёл скрейперы: порт `Scraper`, registry, три адаптера и `POST /admin/courses/{id}/scrape-preview`, который возвращает `ScrapeCandidate[]` (сырые `ScrapedCourseFragment`) и **ничего не пишет**. Entity resolution и persist были осознанно отложены до Stage 4.

Stage 4 замыкает цепочку: вводит aggregate `IdentifyTask`, per-field `MergePolicy` и admin-подтверждаемую запись смерженного результата в `Course`. Это первая стадия, которая **пишет** данные из внешних источников — через admin review, а не автоматически.

## Подтверждённые решения (brainstorm 2026-05-24)

- **Scope:** сужено — backend-only, per-course (не batch по библиотеке). Stage 3 пропущен.
- **Fragment source: preview-then-commit.** Админ сначала `scrape-preview`, выбирает кандидата, и POST-ит готовый `fragment` в `/identify`. `RunIdentifyTask` скрейпер не зовёт — принимает уже выбранный fragment. Развязывает scraping от identify, ложится на существующий preview-флоу.
- **Default mergePolicy: `merge` везде.** Никогда не разрушает существующие данные (scalars — fill-if-empty, arrays — union). Админ повышает до `overwrite` точечно при apply.
- **`discard`-endpoint оставляем** — без него proposed-задачи копятся; review-flow Stage 5 его ждёт.
- **Apply диспатчит `UpdateCourseMetadataCommand`** — переиспользует валидацию и atomic-save Stage 1, не дублирует write-логику.
- **Только события** — `IdentifyTaskProposed`/`IdentifyTaskApplied` публикуются через EventBus для audit; конкретный sink (audit-log таблица) — future, в Stage 4 не делаем.

## Scope

**В Stage 4 (backend-only):**

- Domain: `identify-task.ts` (aggregate), `identify-task.repository.ts` (порт + токен), `merge-policy.ts` (VO + дефолт + валидация), `merge.ts` (чистая `computeMergedPatch`), `identify-task.errors.ts`, `identify-task.events.ts`.
- Infra: `prisma-identify-task.repository.ts` (jsonb ↔ VO).
- Application commands: `RunIdentifyTaskCommand`, `ApplyIdentifyResultCommand`, `DiscardIdentifyTaskCommand` + handlers.
- Application queries: `ListIdentifyTasksQuery`, `GetIdentifyTaskQuery` + handlers.
- HTTP: `identify-admin.controller.ts` — 5 routes, AdminGuard.
- DB: таблица `identify_task` + Prisma enum `IdentifyTaskStatus` + миграция.
- Spec-first: openapi.yaml + regen ts/dart (отдельный коммит).

**НЕ в Stage 4 (YAGNI):**

- Admin UI / disambiguation-экраны (Stage 5).
- Batch-identify по всей библиотеке — per-course только.
- `scraper_source` / community-DB / GraphQL connector (Stage 3 — пропущен).
- Тяжёлый audit-sink — только опубликованные события.
- Изменения `scrape-preview` — остаётся как в Stage 2.

## Flow (preview-then-commit)

```
1. admin → POST /admin/courses/{id}/scrape-preview        (Stage 2, без изменений) → candidates[]
2. admin выбирает candidate
3. admin → POST /admin/courses/{id}/identify { fragment, source, sourceUrl? }
        → RunIdentifyTask: IdentifyTask{status:proposed, scrapedFragment, mergePolicy: request.mergePolicy ?? default(merge везде)}
        → emit IdentifyTaskProposed → IdentifyTaskDto (current + scraped для diff в UI)
4a. admin → POST /admin/identify-tasks/{id}/apply { mergePolicy? }   (override дефолта)
        → ApplyIdentifyResult: computeMergedPatch(current, scraped, policy)
        → resolve names через MetadataLinker → dispatch UpdateCourseMetadataCommand
        → status:applied + completedAt → emit IdentifyTaskApplied
4b. admin → POST /admin/identify-tasks/{id}/discard → status:discarded + completedAt
```

## Данные

```prisma
enum IdentifyTaskStatus { proposed applied discarded }

model IdentifyTask {
  id              String             @id @default(cuid())
  courseId        String
  status          IdentifyTaskStatus @default(proposed)
  source          String                              // метка-источник (scraper id, напр. "youtube")
  sourceUrl       String?
  scrapedFragment Json                                // ScrapedCourseFragment (Stage 2 shape)
  mergePolicy     Json                                // MergePolicy; default = merge везде
  createdAt       DateTime           @default(now())
  completedAt     DateTime?
  course          Course             @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([courseId, status])
  @@map("identify_task")
}
```

`Course` получает обратную relation-сторону `identifyTasks IdentifyTask[]` (без новых колонок Course). Миграция аддитивная.

## MergePolicy + семантика merge

Поля policy = поля `ScrapedCourseFragment`:

- **Scalars:** `title`, `description`, `level`, `language`, `posterUrl`, `releaseDate`, `ratingAverage`, `ratingCount`.
- **Arrays:** `instructors` (↔ `instructorNames`), `studios` (↔ `studioName`), `tags`, `externalIds`.

Каждое поле: `merge | overwrite | ignore`.

| Policy      | Scalar                                           | Array                                                              |
| ----------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `merge`     | fill-if-empty (scraped только если current пуст) | union (entities — по slug; externalIds — по `(source,externalId)`) |
| `overwrite` | replace на scraped                               | replace на scraped                                                 |
| `ignore`    | no-op (поле не входит в patch)                   | no-op                                                              |

`ratingAverage`/`ratingCount` трактуются как пара (как в `UpdateCourseMetadataHandler.setRating`).

`computeMergedPatch(current: Course, fragment: ScrapedCourseFragment, policy: MergePolicy) → EffectivePatch` — чистая функция, без I/O. Для entity-массивов union считается **по slug на уровне имён/refs** (current refs + slugify(scraped names)); сам upsert в сущности (получение id) делается уже после, в handler-е, через `MetadataLinker`. Поля с `ignore` в `EffectivePatch` отсутствуют (а не `undefined`-внутри) — чтобы apply-патч их не трогал.

## Компоненты

| Слой   | Файл                                                              | Роль                                                                    |
| ------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| domain | `domain/identify/identify-task.ts`                                | aggregate (create / apply / discard, инварианты статуса)                |
| domain | `domain/identify/identify-task.repository.ts`                     | порт + `IDENTIFY_TASK_REPOSITORY` токен                                 |
| domain | `domain/identify/merge-policy.ts`                                 | `MergePolicy` VO + `defaultMergePolicy()` + валидация                   |
| domain | `domain/identify/merge.ts`                                        | чистая `computeMergedPatch`                                             |
| domain | `domain/identify/identify-task.errors.ts`                         | `IdentifyTaskNotFoundError`, `IdentifyTaskNotPendingError` (→ RFC 9457) |
| domain | `domain/identify/identify-task.events.ts`                         | `IdentifyTaskProposed`, `IdentifyTaskApplied` (plain классы)            |
| infra  | `infra/persistence/prisma-identify-task.repository.ts`            | Prisma-адаптер (jsonb ↔ VO)                                             |
| app    | `application/commands/run-identify-task.{command,handler}.ts`     | создаёт proposal + событие                                              |
| app    | `application/commands/apply-identify-result.{command,handler}.ts` | merge → resolve → write + событие                                       |
| app    | `application/commands/discard-identify-task.{command,handler}.ts` | status:discarded                                                        |
| app    | `application/queries/list-identify-tasks.{query,handler}.ts`      | фильтр по status / courseId                                             |
| app    | `application/queries/get-identify-task.{query,handler}.ts`        | один task + diff-проекция                                               |
| http   | `identify-admin.controller.ts`                                    | 5 endpoints, AdminGuard                                                 |

## Apply-путь (переиспользование Stage 1)

`ApplyIdentifyResultHandler`:

1. Загружает `IdentifyTask` (если нет → `IdentifyTaskNotFoundError`); проверяет `status === proposed` (иначе → `IdentifyTaskNotPendingError`).
2. Загружает `Course` (если нет → `CourseNotFoundError`).
3. `policy = command.mergePolicy ?? task.mergePolicy` (override опционален).
4. `patch = computeMergedPatch(course, task.scrapedFragment, policy)` — финальные scalars + union-имена для массивов.
5. Для `instructors`/`studios`/`tags` (если поле в patch): `MetadataLinker.upsert*ByName(unionNames)` → refs → ids.
6. Диспатчит `UpdateCourseMetadataCommand(courseId, actor, effectivePatch)` — set-replace семантикой пишет уже смерженный результат атомарно (один `repo.save`).
7. `task.markApplied()` → `status:applied`, `completedAt` → save.
8. `EventBus.publish(new IdentifyTaskApplied(task.id, courseId, actor.id, appliedAt))`.

Развязка: merge-вычисление чистое и тестируется без БД; resolve и запись — через уже существующие, протестированные пути Stage 1.

## Доменные события

Plain-классы (паттерн `LessonCompleted`): `IdentifyTaskProposed(taskId, courseId, source, proposedAt)`, `IdentifyTaskApplied(taskId, courseId, actorId, appliedAt)`. Публикуются через `EventBus` в handler-ах. Подписчиков в Stage 4 нет (audit-sink — future); публикация — точка расширения.

## Spec-first

Новые схемы в `openapi.yaml`:

- `MergeMode` enum (`merge`/`overwrite`/`ignore`).
- `MergePolicyDto` — поля как в таблице выше, каждое `MergeMode`.
- `IdentifyTaskStatus` enum.
- `IdentifyTaskDto` — `{id, courseId, status, source, sourceUrl?, scrapedFragment, mergePolicy, createdAt, completedAt?}`.
- `IdentifyTaskListDto` — `{tasks: IdentifyTaskDto[]}`.
- `RunIdentifyRequest` — `{fragment: ScrapedCourseFragment, source, sourceUrl?, mergePolicy?}`.
- `ApplyIdentifyRequest` — `{mergePolicy?}`.

`fragment` переиспользует существующую `ScrapedCourseFragment`-схему из scrape-preview (без дублирования). Routes:

- `POST /api/v1/admin/courses/{id}/identify` → 201 `IdentifyTaskDto`
- `POST /api/v1/admin/identify-tasks/{id}/apply` → 200 `IdentifyTaskDto` (+ обновлённый course доступен через GET course)
- `POST /api/v1/admin/identify-tasks/{id}/discard` → 200 `IdentifyTaskDto`
- `GET /api/v1/admin/identify-tasks?status=&courseId=` → 200 `IdentifyTaskListDto`
- `GET /api/v1/admin/identify-tasks/{id}` → 200 `IdentifyTaskDto`

Затем `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`; артефакты `@app/api-client-ts` + `@app/api-client-dart` — отдельным коммитом.

## Тесты

- `merge.spec.ts` — таблица policy × тип: `merge`/`overwrite`/`ignore` × scalar/array; externalIds union по `(source,externalId)`; fill-if-empty не затирает заполненный scalar.
- `identify-task.spec.ts` — инварианты aggregate: `apply` дважды → `IdentifyTaskNotPendingError`; `discard` proposed → ok; `apply` discarded → error.
- `run-identify-task.handler.spec.ts` — создаёт `proposed` с дефолт-policy + публикует `IdentifyTaskProposed`.
- `apply-identify-result.handler.spec.ts` — merge → resolve (mock MetadataLinker/commandBus) → dispatch `UpdateCourseMetadataCommand` с ожидаемым patch + `IdentifyTaskApplied`.
- `discard-identify-task.handler.spec.ts`.
- `prisma-identify-task.repository.spec.ts` — jsonb round-trip (fragment + policy).
- `identify-admin.controller.spec.ts` — 5 routes + AdminGuard + RFC 9457 на ошибках.
- Gates: backend vitest зелёный, `tsc` clean, ESLint clean, `pnpm spec:validate/bundle/codegen` без drift.

## Открытые follow-ups (не блокируют Stage 4)

- Batch-identify по всей библиотеке (видение Stage 1) — отдельная стадия/задача; модель `identify_task` (per-course) её не блокирует.
- Реальный audit-sink (таблица/лог-подписчик на события) — future.
- Stage 5 Admin UI потребляет `IdentifyTaskDto` (current vs scraped diff, per-field radio merge/overwrite/ignore, Apply).
- Stage 3 (scraper_source) при необходимости встаёт позже без изменения контракта identify — fragment приходит в теле независимо от источника.
