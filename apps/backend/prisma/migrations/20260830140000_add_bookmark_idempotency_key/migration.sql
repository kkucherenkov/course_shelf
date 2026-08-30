-- AlterTable: nullable retry key for POST /lessons/{id}/bookmarks (#285)
ALTER TABLE "bookmark" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex: Postgres treats each NULL as distinct, so bookmarks created
-- without a key (including every pre-existing row) never collide with each
-- other on this constraint.
CREATE UNIQUE INDEX "bookmark_uq_bookmark_idempotency" ON "bookmark"("userId", "lessonId", "idempotencyKey");
