-- Section gains the library-relative path of the folder it was scanned from.
--
-- The scan used to match a folder to its section by TITLE, and two sibling
-- folders can share one: `27. Enemy AI` and `38. Enemy AI` both parse to the
-- label "Enemy AI". Measured on the maintainer's library, three sections held
-- 79 lessons that belong to six folders. The path is what is actually unique,
-- so it becomes the key the scan matches on.
--
-- Nullable with no backfill, deliberately. The column cannot be derived in
-- SQL: the value is the folder a rescan resolves under the new
-- "more-than-one-video" rule (domain/scan/section-folder.ts), which needs the
-- file tree, not the database. Existing rows keep NULL and the scan falls back
-- to matching them by title, exactly as it did before; the first force-resync
-- of a course fills its sections in.
ALTER TABLE "section" ADD COLUMN "sourcePath" TEXT;

-- Partial by construction: Postgres treats NULLs as distinct in a unique
-- index, so every pre-existing row (and every flat course's synthetic
-- "Lessons" section, which has no folder behind it) is exempt while two real
-- folders of one course still cannot claim the same path.
CREATE UNIQUE INDEX "uq_section_course_source_path" ON "section"("courseId", "sourcePath");
