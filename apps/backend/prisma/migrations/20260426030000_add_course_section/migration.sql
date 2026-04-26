-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_libraryId_idx" ON "course"("libraryId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "course_libraryId_slug_key" ON "course"("libraryId", "slug");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "section_courseId_position_key" ON "section"("courseId", "position");

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
