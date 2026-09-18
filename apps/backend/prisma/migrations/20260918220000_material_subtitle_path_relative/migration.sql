-- Data-only migration, no schema change.
--
-- "material"."path" and "subtitle"."path" were written absolute by the scan
-- walk (run-scan.handler.ts pushed `m.path` / `subtitlePath`, the raw paths
-- FsAdapter.walk produces — the same source `lesson.videoPath` was written
-- from before #554) while every reader already treated them as
-- library-relative. Strip each row's own library's `rootPath` prefix via its
-- lesson -> section -> course -> library chain, matching exactly what
-- `LibraryRelativePath.from()` now enforces at every write site (tuxedo 174).
-- Same disease as 20260915120000_lesson_video_path_relative, one join hop
-- further down because material/subtitle hang off lesson rather than being
-- the lesson row itself.
--
-- Idempotent: the WHERE clause only touches rows that still start with
-- `<rootPath>/`, so running this twice (or against a library already
-- storing relative paths) is a no-op the second time.
--
-- The prefix check is a `left()` equality, not `LIKE rootPath || '/%'`:
-- LIKE treats `_` (and `%`) in the pattern as wildcards, and `rootPath` is an
-- arbitrary filesystem path — `_` shows up in real directory names. A
-- library rooted at `/mnt/my_courses` would falsely match a lesson under
-- `/mnt/myXcourses/...` (any single character in that position), and
-- `substring` would then strip the wrong number of characters and write
-- garbage into `path` silently. `left(...) = rootPath || '/'` is a literal
-- comparison — no character in `rootPath` is ever interpreted as a pattern.
UPDATE "material" AS m
SET "path" = substring(m."path" from length(lib."rootPath") + 2)
FROM "lesson" AS l
JOIN "section" AS s ON s."id" = l."sectionId"
JOIN "course" AS c ON c."id" = s."courseId"
JOIN "library" AS lib ON lib."id" = c."libraryId"
WHERE m."lessonId" = l."id"
  AND left(m."path", length(lib."rootPath") + 1) = lib."rootPath" || '/';

UPDATE "subtitle" AS sub
SET "path" = substring(sub."path" from length(lib."rootPath") + 2)
FROM "lesson" AS l
JOIN "section" AS s ON s."id" = l."sectionId"
JOIN "course" AS c ON c."id" = s."courseId"
JOIN "library" AS lib ON lib."id" = c."libraryId"
WHERE sub."lessonId" = l."id"
  AND left(sub."path", length(lib."rootPath") + 1) = lib."rootPath" || '/';
