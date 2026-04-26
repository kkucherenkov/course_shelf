-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "positionSeconds" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "percent" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_progress_userId_idx" ON "lesson_progress"("userId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");
