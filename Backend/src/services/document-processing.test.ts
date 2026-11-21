
import "dotenv/config";
import prisma from "../config/prisma";
import supabase from "../config/supabase";
import { processPdfDocument } from "./document-processing.service";

const main = async () => {
  try {
    // Find the first uploaded document.
    const document = await prisma.document.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!document) {
      throw new Error("No uploaded documents found in the database.");
    }

    console.log("Processing:", document.name);

    // Download the PDF from Supabase Storage.
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME ?? "documents")
      .download(document.storagePath);

    if (error || !data) {
      throw new Error(error?.message ?? "PDF download failed.");
    }

    // Extract text and generate chunks.
    const buffer = Buffer.from(await data.arrayBuffer());
    const result = await processPdfDocument(buffer);

    console.log("Total pages:", result.totalPages);
    console.log("Total characters:", result.text.length);
    console.log("Total chunks:", result.chunks.length);

    result.chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1} (${chunk.length} characters):`);
      console.log(chunk);
    });
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error("Document processing failed:", error);
  process.exitCode = 1;
});
