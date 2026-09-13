-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "transcript_cue_text_idx" ON "transcript_cue" USING GIN ("text" gin_trgm_ops);

-- NOTE: `prisma migrate dev --create-only` also emitted an unrelated
-- `RenameIndex` for `bookmark`'s idempotency-key constraint here. That is a
-- pre-existing drift between schema.prisma's `@@unique(..., name: ...)` (which
-- names the client-API field, not the DB object — `map:` would do that) and
-- the DB index name a hand-written earlier migration actually gave it. It
-- predates this change and is out of scope for it, so it is deliberately not
-- included — see PR discussion for T-2026-09-13-e27-transcript-search.
