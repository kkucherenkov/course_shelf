-- CreateTable
CREATE TABLE "course_progress_read_model" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "lessonsTotal" INTEGER NOT NULL DEFAULT 0,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenLessonId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_progress_read_model_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "course_progress_read_model_userId_courseId_key" ON "course_progress_read_model"("userId", "courseId");

-- CreateIndex
CREATE INDEX "course_progress_read_model_userId_lastSeenAt_idx" ON "course_progress_read_model" ("userId", "lastSeenAt" DESC);
