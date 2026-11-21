
import { extractPdfText } from "./pdf.service";
import { splitTextIntoChunks } from "./chunk.service";
import { generateEmbedding } from "./embedding.service";
import { storeDocumentChunks } from "./chunk-storage.service";

export interface ProcessedDocument {
  text: string;
  totalPages: number;
  chunks: string[];
}

// Existing usage: extraction and chunking only.
export function processPdfDocument(
  buffer: Buffer,
): Promise<ProcessedDocument>;

// New usage: complete ingestion pipeline.
export function processPdfDocument(
  documentId: string,
  buffer: Buffer,
): Promise<ProcessedDocument>;

// Implementation supporting both usages.
export async function processPdfDocument(
  documentIdOrBuffer: string | Buffer,
  optionalBuffer?: Buffer,
): Promise<ProcessedDocument> {
  const documentId =
    typeof documentIdOrBuffer === "string"
      ? documentIdOrBuffer
      : undefined;

  const buffer =
    typeof documentIdOrBuffer === "string"
      ? optionalBuffer
      : documentIdOrBuffer;

  if (!buffer) {
    throw new Error("PDF buffer is required");
  }

  // Step 1: Extract PDF text.
  const { text, totalPages } = await extractPdfText(buffer);

  // Step 2: Split text into chunks.
  const chunks = splitTextIntoChunks(text);

  if (chunks.length === 0) {
    throw new Error("No text chunks could be generated from the PDF.");
  }

  // Step 3: Generate embeddings and store chunks
  // only when a document ID is provided.
  if (documentId) {
    const embeddings: number[][] = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      embeddings.push(embedding);
    }

    await storeDocumentChunks(
      documentId,
      chunks,
      embeddings,
    );
  }

  // Step 4: Return processing results.
  return {
    text,
    totalPages,
    chunks,
  };
}
