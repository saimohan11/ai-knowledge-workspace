import prisma from "../config/prisma";
import { generateEmbedding } from "./embedding.service";

interface SearchResult {
  content: string;
  chunkIndex: number;
  documentId: string;
  similarity: number;
}

export const searchSimilarChunks = async (
  query: string,
  documentId: string,
  topK: number = 3,
): Promise<SearchResult[]> => {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty");
  }

  if (topK <= 0 || !Number.isInteger(topK)) {
    throw new Error("topK must be a positive integer");
  }

  // 1. Generate embedding for the user's question
  const queryEmbedding = await generateEmbedding(query);

  if (queryEmbedding.length !== 3072) {
    throw new Error("Invalid query embedding dimensions");
  }

  // 2. Convert embedding into pgvector format
  const vectorString = `[${queryEmbedding.join(",")}]`;

  // 3. Search for the most similar chunks
  const results = await prisma.$queryRaw<SearchResult[]>`
  SELECT
    "content",
    "chunkIndex",
    "documentId",
    1 - (
      "embedding" OPERATOR(ai_workspace.<=>)
      ${vectorString}::"ai_workspace".vector
    ) AS "similarity"
  FROM "ai_workspace"."DocumentChunk"
  WHERE "documentId" = ${documentId}
    AND "embedding" IS NOT NULL
  ORDER BY
    "embedding" OPERATOR(ai_workspace.<=>)
    ${vectorString}::"ai_workspace".vector
  LIMIT ${topK}
`;

  return results;
};