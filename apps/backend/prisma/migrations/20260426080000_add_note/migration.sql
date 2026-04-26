-- Migration: add_note (E09-F02-S02)
-- Per-user, per-lesson Markdown note; exactly one row per (userId, lessonId).

CREATE TABLE "note" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "lessonId"  TEXT         NOT NULL,
    "body"      TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "note_userId_lessonId_key" ON "note"("userId", "lessonId");
CREATE INDEX "note_userId_idx" ON "note"("userId");
