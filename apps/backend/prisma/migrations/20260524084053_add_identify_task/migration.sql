-- CreateEnum
CREATE TYPE "IdentifyTaskStatus" AS ENUM ('proposed', 'applied', 'discarded');

-- CreateTable
CREATE TABLE "identify_task" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "IdentifyTaskStatus" NOT NULL DEFAULT 'proposed',
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "scrapedFragment" JSONB NOT NULL,
    "mergePolicy" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "identify_task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identify_task_courseId_status_idx" ON "identify_task"("courseId", "status");

-- AddForeignKey
ALTER TABLE "identify_task" ADD CONSTRAINT "identify_task_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
