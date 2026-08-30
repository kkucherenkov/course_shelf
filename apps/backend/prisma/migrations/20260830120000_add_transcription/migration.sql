-- CreateEnum
CREATE TYPE "TranscriptOrigin" AS ENUM ('sidecar', 'generated');

-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('running', 'succeeded', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "transcript" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "origin" "TranscriptOrigin" NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "sourceMtime" TIMESTAMP(3) NOT NULL,
    "sourceSize" INTEGER NOT NULL,
    "derivedPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_cue" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "transcript_cue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcription" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "status" "TranscriptionStatus" NOT NULL,
    "force" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "lessonsTotal" INTEGER NOT NULL DEFAULT 0,
    "lessonsSkipped" INTEGER NOT NULL DEFAULT 0,
    "lessonsTranscribed" INTEGER NOT NULL DEFAULT 0,
    "lessonsFailed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "transcription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcription_error" (
    "id" TEXT NOT NULL,
    "transcriptionId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "transcription_error_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transcript_lessonId_language_key" ON "transcript"("lessonId", "language");

-- CreateIndex
CREATE INDEX "transcript_cue_transcriptId_startMs_idx" ON "transcript_cue"("transcriptId", "startMs");

-- CreateIndex
CREATE INDEX "transcription_libraryId_status_idx" ON "transcription"("libraryId", "status");

-- CreateIndex
CREATE INDEX "transcription_libraryId_startedAt_idx" ON "transcription"("libraryId", "startedAt");

-- AddForeignKey
ALTER TABLE "transcript_cue" ADD CONSTRAINT "transcript_cue_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcription_error" ADD CONSTRAINT "transcription_error_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "transcription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
