import "dotenv/config";
import prisma from "../config/prisma";
import { searchSimilarChunks } from "./semantic-search.service";

const testSemanticSearch = async () => {
  try {
    const document = await prisma.document.findFirst({
      where: { name: "docky.pdf" },
    });

    if (!document) {
      throw new Error("docky.pdf not found");
    }

    const question = "What was the inflation rate in April 2022?";

    console.log("Question:", question);

    const results = await searchSimilarChunks(
      question,
      document.id,
      3,
    );

    console.log("\nTop matching chunks:");

    results.forEach((result, index) => {
      console.log(`\nResult ${index + 1}`);
      console.log("Chunk index:", result.chunkIndex);
      console.log("Similarity:", Number(result.similarity).toFixed(4));
      console.log("Content:", result.content);
    });
  } catch (error) {
    console.error("Semantic search test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
};

testSemanticSearch();