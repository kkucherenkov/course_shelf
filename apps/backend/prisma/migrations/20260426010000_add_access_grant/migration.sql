-- CreateEnum
CREATE TYPE "GrantTargetKind" AS ENUM ('library', 'course');

-- CreateEnum
CREATE TYPE "GrantLevel" AS ENUM ('READ');

-- CreateTable
CREATE TABLE "access_grant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetKind" "GrantTargetKind" NOT NULL,
    "libraryId" TEXT,
    "courseId" TEXT,
    "level" "GrantLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_grant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_grant_userId_idx" ON "access_grant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "access_grant_uq_grant_target" ON "access_grant"("userId", "targetKind", "libraryId", "courseId");
