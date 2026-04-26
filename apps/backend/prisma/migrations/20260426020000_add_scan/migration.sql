-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('running', 'succeeded', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "scan" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "filesScanned" INTEGER NOT NULL DEFAULT 0,
    "filesAdded" INTEGER NOT NULL DEFAULT 0,
    "filesUpdated" INTEGER NOT NULL DEFAULT 0,
    "coursesDiscovered" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_error" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "scan_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovered_file" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mtime" TIMESTAMP(3) NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "discovered_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scan_libraryId_status_idx" ON "scan"("libraryId", "status");

-- CreateIndex
CREATE INDEX "scan_libraryId_startedAt_idx" ON "scan"("libraryId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "discovered_file_scanId_path_key" ON "discovered_file"("scanId", "path");

-- AddForeignKey
ALTER TABLE "scan_error" ADD CONSTRAINT "scan_error_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovered_file" ADD CONSTRAINT "discovered_file_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
