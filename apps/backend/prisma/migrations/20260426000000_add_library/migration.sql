-- CreateTable
CREATE TABLE "library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rootPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_rootPath_key" ON "library"("rootPath");
