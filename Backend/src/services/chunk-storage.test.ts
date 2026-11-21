import "dotenv/config";
import prisma from "../config/prisma";
import supabase from "../config/supabase";
import { processPdfDocument } from "./document-processing.service";
import { generateEmbedding } from "./embedding.service";
import { storeDocumentChunks } from "./chunk-storage.service";

const testChunkStorage = async () => {
  try {
    // 1. Find the latest uploaded document
    const document = await prisma.document.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!document) {
      throw new Error("No documents found");
    }

    console.log("Processing:", document.name);

    // 2. Download PDF from Supabase
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME ?? "documents")
      .download(document.storagePath);

    if (error || !data) {
      throw new Error(error?.message ?? "PDF download failed");
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // 3. Extract text and generate chunks
    const processed = await processPdfDocument(buffer);

    console.log("Total chunks:", processed.chunks.length);

    // 4. Generate embeddings
    const embeddings: number[][] = [];

    for (let i = 0; i < processed.chunks.length; i++) {
      const embedding = await generateEmbedding(processed.chunks[i]);

      embeddings.push(embedding);

      console.log(`Generated embedding ${i + 1}/${processed.chunks.length}`);
    }

    // 5. Store chunks and embeddings in PostgreSQL
    await storeDocumentChunks(
      document.id,
      processed.chunks,
      embeddings,
    );

    console.log("Successfully stored all chunks and embeddings!");
  } catch (error) {
    console.error("Chunk storage test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
};

testChunkStorage();