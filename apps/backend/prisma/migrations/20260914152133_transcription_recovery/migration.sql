-- AlterEnum
ALTER TYPE "TranscriptionStatus" ADD VALUE 'interrupted';

-- AlterTable
ALTER TABLE "transcription" ADD COLUMN     "bootId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "transcription_status_idx" ON "transcription"("status");
