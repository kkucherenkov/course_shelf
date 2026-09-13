-- AlterTable: widen size columns from Int (int4, caps at 2147483647 bytes /
-- ~2GB) to BigInt (int8). A real video file on the maintainer's library is
-- 3129930702 bytes, which overflowed "lesson"."sizeBytes" and
-- "discovered_file"."size" during a real scan (tuxedo 118) — the resulting
-- Prisma "value out of range" error aborted scanRepo.save() inside the same
-- transaction that also persists scan_error_record rows, so the run's
-- accumulated errors were rolled back with it and the scan stayed at
-- status=running forever.
ALTER TABLE "lesson" ALTER COLUMN "sizeBytes" TYPE BIGINT;
ALTER TABLE "discovered_file" ALTER COLUMN "size" TYPE BIGINT;
