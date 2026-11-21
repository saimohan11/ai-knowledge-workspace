
import { generateEmbedding } from "./embedding.service";

const main = async () => {
  const text =
    "The annual inflation rate reached 7.5% in April 2022.";

  console.log("Generating embedding...");

  const embedding = await generateEmbedding(text);

  console.log("Embedding generated successfully!");
  console.log("Vector dimensions:", embedding.length);
  console.log("First 5 values:", embedding.slice(0, 5));
};

main().catch((error: unknown) => {
  console.error("Embedding test failed:", error);
  process.exitCode = 1;
});
