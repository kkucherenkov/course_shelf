-- Drops the Better Auth `phoneNumber` plugin surface (GitHub #157). The plugin
-- was residue from the "Appointments" booking-app template this repo was
-- scaffolded from; Course Shelf is a self-hosted course library and authenticates
-- with email + password only. Web never had phone auth and the mobile half is
-- removed alongside this migration.
--
-- The plugin's schema (better-auth/dist/plugins/phone-number/schema.mjs) declares
-- ONLY these two columns on "user" — it owns no table of its own. Its OTP codes
-- are written into the CORE "verification" table via
-- `internalAdapter.createVerificationValue`, so that table MUST survive: email
-- verification and password reset (web forgot.vue / reset.vue) depend on it.

-- Stale phone OTP rows in the shared "verification" table. The plugin stores them
-- under an identifier that is the bare E.164 phone number, optionally suffixed
-- with '-request-password-reset'. The `^\+[0-9]{6,15}` anchor cannot match an
-- email-verification identifier (those contain '@') nor a password-reset token
-- (those are random alphanumerics and never start with '+'), so this deletes
-- phone OTPs and nothing else. Rows are TTL'd anyway; this just avoids leaving
-- unreachable data behind.
DELETE FROM "verification"
WHERE "identifier" ~ '^\+[0-9]{6,15}(-request-password-reset)?$';

DROP INDEX IF EXISTS "user_phoneNumber_key";

ALTER TABLE "user"
  DROP COLUMN IF EXISTS "phoneNumber",
  DROP COLUMN IF EXISTS "phoneNumberVerified";
