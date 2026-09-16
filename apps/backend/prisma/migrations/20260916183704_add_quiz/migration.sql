-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('proposed', 'applied', 'discarded');

-- CreateTable
CREATE TABLE "quiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "QuizStatus" NOT NULL DEFAULT 'proposed',
    "modelFilename" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "quiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_lessonId_status_idx" ON "quiz"("lessonId", "status");

-- CreateIndex
CREATE INDEX "quiz_courseId_status_idx" ON "quiz"("courseId", "status");
