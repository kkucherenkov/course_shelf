-- Better Auth `admin` plugin + our `additionalFields` (auth.service.ts) declare
-- columns that were never reflected in the User/Session tables. The runtime
-- `databaseHooks.user.create.before` hook writes `role: 'ADMIN'` on first sign-up
-- and Prisma rejected the create with `Unknown argument 'role'`. This migration
-- catches the schema up.

ALTER TABLE "user"
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER',
  ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "banReason" TEXT,
  ADD COLUMN "banExpires" TIMESTAMP(3),
  ADD COLUMN "displayName" TEXT;

ALTER TABLE "session"
  ADD COLUMN "impersonatedBy" TEXT;
