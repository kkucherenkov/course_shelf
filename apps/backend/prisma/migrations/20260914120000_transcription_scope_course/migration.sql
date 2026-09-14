-- AlterTable: nullable scope columns for E32-F02-S01's scoped transcription.
-- Absent (NULL) for every pre-existing row and every future library-wide run;
-- set only when a run was started via POST /courses/{id}/transcription.
ALTER TABLE "transcription" ADD COLUMN "scopeCourseId" TEXT;
ALTER TABLE "transcription" ADD COLUMN "scopeCourseName" TEXT;
