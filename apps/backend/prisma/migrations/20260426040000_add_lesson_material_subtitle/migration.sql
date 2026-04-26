-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('doc', 'note', 'image', 'slide');

-- CreateTable
CREATE TABLE "lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "mtime" TIMESTAMP(3) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtitle" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "subtitle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_courseId_sectionId_idx" ON "lesson"("courseId", "sectionId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "lesson_sectionId_position_key" ON "lesson"("sectionId", "position");

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtitle" ADD CONSTRAINT "subtitle_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
