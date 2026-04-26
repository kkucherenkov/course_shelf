-- Migration: add_bookmark (E09-F02-S01)
-- Per-user, per-lesson timestamped bookmarks.

CREATE TABLE "bookmark" (
    "id"              TEXT         NOT NULL,
    "userId"          TEXT         NOT NULL,
    "lessonId"        TEXT         NOT NULL,
    "positionSeconds" INTEGER      NOT NULL,
    "label"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmark_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookmark_userId_lessonId_idx" ON "bookmark"("userId", "lessonId");
CREATE INDEX "bookmark_userId_id_idx"       ON "bookmark"("userId", "id");
