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
UPDATE "lesson" AS l
SET "videoPath" = substring(l."videoPath" from length(lib."rootPath") + 2)
FROM "section" AS s
JOIN "course" AS c ON c."id" = s."courseId"
JOIN "library" AS lib ON lib."id" = c."libraryId"
WHERE l."sectionId" = s."id"
  AND l."videoPath" LIKE (lib."rootPath" || '/%');
