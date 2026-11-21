import "dotenv/config";
import prisma from "../config/prisma";
import { searchSimilarChunks } from "./semantic-search.service";
import { generateAnswer } from "./generation.service";

const testRAG = async () => {
  try {
    const document = await prisma.document.findFirst({
      where: { name: "docky.pdf" },
    });

    if (!document) {
      throw new Error("docky.pdf not found");
    }

    const question = "What was the inflation rate in April 2022?";

    console.log("User Question:", question);

    // Step 1: Retrieve relevant document chunks
    const results = await searchSimilarChunks(
      question,
      document.id,
      3,
    );

    console.log("\nRetrieved chunks:", results.length);

    // Step 2: Extract chunk content
    const context = results.map((result) => result.content);

    // Step 3: Generate answer using Gemini
    const answer = await generateAnswer({
      question,
      context,
    });

    console.log("\nAI Generated Answer:");
    console.log(answer);
  } catch (error) {
    console.error("RAG test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
};

testRAG();