
import prisma from "../config/prisma";

const EMBEDDING_DIMENSIONS = 3072;

export const storeDocumentChunks = async (
  documentId: string,
  chunks: string[],
  embeddings: number[][],
): Promise<void> => {
  // Validate input before database operations.
  if (!documentId) {
    throw new Error("Document ID is required");
  }

  if (chunks.length === 0) {
    throw new Error("No chunks provided");
  }

  if (chunks.length !== embeddings.length) {
    throw new Error("Chunks and embeddings count do not match");
  }

  for (let i = 0; i < embeddings.length; i++) {
    if (embeddings[i].length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimensions at chunk ${i}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    // Remove previous chunks so the document can be reprocessed.
    await tx.documentChunk.deleteMany({
      where: { documentId },
    });

    // Insert new chunks and their embeddings.
    for (let i = 0; i < chunks.length; i++) {
      const documentChunk = await tx.documentChunk.create({
        data: {
          content: chunks[i],
          chunkIndex: i,
          documentId,
        },
      });

      const vectorString = `[${embeddings[i].join(",")}]`;

      await tx.$executeRaw`
        UPDATE "ai_workspace"."DocumentChunk"
        SET "embedding" = ${vectorString}::"ai_workspace".vector
        WHERE "id" = ${documentChunk.id}
      `;
    }
  });
};
