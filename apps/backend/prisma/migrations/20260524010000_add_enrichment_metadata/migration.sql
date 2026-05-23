-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert', 'all_levels');

-- CreateEnum
CREATE TYPE "ExternalIdEntityType" AS ENUM ('course', 'instructor', 'studio', 'tag');

-- AlterTable: add new nullable columns to course
ALTER TABLE "course" ADD COLUMN "posterUrl" TEXT;
ALTER TABLE "course" ADD COLUMN "posterStoragePath" TEXT;
ALTER TABLE "course" ADD COLUMN "level" "CourseLevel";
ALTER TABLE "course" ADD COLUMN "language" TEXT;
ALTER TABLE "course" ADD COLUMN "releaseDate" TIMESTAMP(3);
ALTER TABLE "course" ADD COLUMN "sourceUpdatedAt" TIMESTAMP(3);
ALTER TABLE "course" ADD COLUMN "ratingAverage" DECIMAL(3,2);
ALTER TABLE "course" ADD COLUMN "ratingCount" INTEGER;

-- CreateTable
CREATE TABLE "instructor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_id" (
    "id" TEXT NOT NULL,
    "entityType" "ExternalIdEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_id_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_instructor" (
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_instructor_pkey" PRIMARY KEY ("courseId","instructorId")
);

-- CreateTable
CREATE TABLE "course_studio" (
    "courseId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,

    CONSTRAINT "course_studio_pkey" PRIMARY KEY ("courseId","studioId")
);

-- CreateTable
CREATE TABLE "course_tag" (
    "courseId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "course_tag_pkey" PRIMARY KEY ("courseId","tagId")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "instructor_slug_key" ON "instructor"("slug");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "studio_slug_key" ON "studio"("slug");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "external_id_source_externalId_key" ON "external_id"("source", "externalId");

-- CreateIndex
CREATE INDEX "instructor_displayName_idx" ON "instructor"("displayName");

-- CreateIndex
CREATE INDEX "studio_displayName_idx" ON "studio"("displayName");

-- CreateIndex
CREATE INDEX "tag_category_idx" ON "tag"("category");

-- CreateIndex
CREATE INDEX "external_id_entityType_entityId_idx" ON "external_id"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "course_instructor_instructorId_idx" ON "course_instructor"("instructorId");

-- CreateIndex
CREATE INDEX "course_studio_studioId_idx" ON "course_studio"("studioId");

-- CreateIndex
CREATE INDEX "course_tag_tagId_idx" ON "course_tag"("tagId");

-- AddForeignKey
ALTER TABLE "course_instructor" ADD CONSTRAINT "course_instructor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructor" ADD CONSTRAINT "course_instructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_studio" ADD CONSTRAINT "course_studio_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_studio" ADD CONSTRAINT "course_studio_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tag" ADD CONSTRAINT "course_tag_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tag" ADD CONSTRAINT "course_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
