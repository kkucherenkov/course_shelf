-- Data-only migration, no schema change.
--
-- "lesson"."videoPath" was written absolute by the scan walk
-- (run-scan.handler.ts pushed `videoFile.path`, the raw path FsAdapter.walk
-- produces) while every reader — derived-path.ts, lesson-file-locator.ts,
-- this table's own doc comments — already treated it as library-relative
-- (#554). Strip each lesson's own library's `rootPath` prefix via its
-- section -> course -> library chain, matching exactly what
-- `LibraryRelativePath.from()` now enforces at every write site.
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
-- garbage into `videoPath` silently. `left(...) = rootPath || '/'` is a
-- literal comparison — no character in `rootPath` is ever interpreted as a
-- pattern.
UPDATE "lesson" AS l
SET "videoPath" = substring(l."videoPath" from length(lib."rootPath") + 2)
FROM "section" AS s
JOIN "course" AS c ON c."id" = s."courseId"
JOIN "library" AS lib ON lib."id" = c."libraryId"
WHERE l."sectionId" = s."id"
  AND left(l."videoPath", length(lib."rootPath") + 1) = lib."rootPath" || '/';
