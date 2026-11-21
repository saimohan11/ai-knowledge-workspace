
import "dotenv/config";
import prisma from "../config/prisma";
import supabase from "../config/supabase";
import { processPdfDocument } from "./document-processing.service";
import { generateEmbedding } from "./embedding.service";

const main = async () => {
  try {
    const document = await prisma.document.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!document) {
      throw new Error("No uploaded documents found.");
    }

    console.log("Processing:", document.name);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME ?? "documents")
      .download(document.storagePath);

    if (error || !data) {
      throw new Error(error?.message ?? "PDF download failed.");
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const result = await processPdfDocument(buffer);

    console.log("Total chunks:", result.chunks.length);

    const embeddedChunks: {
      text: string;
      embedding: number[];
    }[] = [];

    for (const [index, chunk] of result.chunks.entries()) {
      console.log(`Generating embedding ${index + 1}/${result.chunks.length}`);

      const embedding = await generateEmbedding(chunk);

      embeddedChunks.push({
        text: chunk,
        embedding,
      });
    }

    console.log("\nEmbedding generation completed!");
    console.log("Total embedded chunks:", embeddedChunks.length);
    console.log(
      "Dimensions of first embedding:",
      embeddedChunks[0]?.embedding.length,
    );
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error("Document embedding test failed:", error);
  process.exitCode = 1;
});
