-- CreateIndex
CREATE INDEX "course_title_idx" ON "course" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "lesson_title_idx" ON "lesson" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "section_title_idx" ON "section" USING GIN ("title" gin_trgm_ops);
