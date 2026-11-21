CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "ai_workspace"."DocumentChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "ai_workspace"."DocumentChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "ai_workspace"."DocumentChunk"("documentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "ai_workspace"."DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ai_workspace"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_workspace"."DocumentChunk"
ADD COLUMN "embedding" vector(3072);