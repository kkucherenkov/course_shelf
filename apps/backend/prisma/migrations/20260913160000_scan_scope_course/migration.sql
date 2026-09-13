-- AlterTable: nullable scope columns for E32-F01-S02's scoped rescan.
-- Absent (NULL) for every pre-existing row and every future library-wide
-- scan; set only when a scan was started via POST /courses/{id}/rescan.
ALTER TABLE "scan" ADD COLUMN "scopeCourseId" TEXT;
ALTER TABLE "scan" ADD COLUMN "scopeCourseName" TEXT;
