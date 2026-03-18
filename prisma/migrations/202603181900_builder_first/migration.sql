-- CreateEnum
CREATE TYPE "GameBuildSource" AS ENUM ('UPLOAD', 'BUILDER');

-- CreateEnum
CREATE TYPE "BuilderProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BuilderMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- AlterTable
ALTER TABLE "Game"
ADD COLUMN "buildSource" "GameBuildSource" NOT NULL DEFAULT 'UPLOAD',
ADD COLUMN "sourceProjectId" TEXT;

-- CreateTable
CREATE TABLE "BuilderProject" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "templateKey" TEXT NOT NULL,
    "status" "BuilderProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT NOT NULL DEFAULT 'ARCADE',
    "tags" TEXT NOT NULL DEFAULT '',
    "supportsMobile" BOOLEAN NOT NULL DEFAULT true,
    "mobileOrientation" "MobileOrientation" NOT NULL DEFAULT 'BOTH',
    "thumbnail" TEXT,
    "currentRevisionId" TEXT,
    "publishedRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderRevision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "actionKey" TEXT,
    "summary" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "snapshot" JSONB,
    "previewUrl" TEXT NOT NULL,
    "artifactUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuilderRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderMessage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revisionId" TEXT,
    "role" "BuilderMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuilderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_sourceProjectId_key" ON "Game"("sourceProjectId");

-- CreateIndex
CREATE INDEX "BuilderProject_ownerId_updatedAt_idx" ON "BuilderProject"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "BuilderProject_status_updatedAt_idx" ON "BuilderProject"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "BuilderRevision_projectId_createdAt_idx" ON "BuilderRevision"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "BuilderMessage_projectId_createdAt_idx" ON "BuilderMessage"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES "BuilderProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderProject" ADD CONSTRAINT "BuilderProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderProject" ADD CONSTRAINT "BuilderProject_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "BuilderRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderProject" ADD CONSTRAINT "BuilderProject_publishedRevisionId_fkey" FOREIGN KEY ("publishedRevisionId") REFERENCES "BuilderRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderRevision" ADD CONSTRAINT "BuilderRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BuilderProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderMessage" ADD CONSTRAINT "BuilderMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BuilderProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderMessage" ADD CONSTRAINT "BuilderMessage_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "BuilderRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
