
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from the environment");
}

export const generateEmbedding = async (
  text: string,
): Promise<number[]> => {
  if (!text.trim()) {
    throw new Error("Text cannot be empty");
  }

  // Load the ESM SDK dynamically to avoid the CommonJS import error.
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({ apiKey });

  const startTime = Date.now();
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  console.log(`Gemini embedding time: ${Date.now() - startTime}ms`);

  const values = response.embeddings?.[0]?.values;

  if (!values || values.length === 0) {
    throw new Error("Gemini returned an empty embedding");
  }

  return values;
};
