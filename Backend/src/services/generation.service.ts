
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

interface GenerateAnswerOptions {
  question: string;
  context: string[];
}

export const generateAnswer = async ({
  question,
  context,
}: GenerateAnswerOptions): Promise<string> => {
  if (!question.trim()) {
    throw new Error("Question cannot be empty");
  }

  if (context.length === 0) {
    throw new Error("Context cannot be empty");
  }

  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are a helpful AI assistant that answers questions
based on the provided document context.

Instructions:
1. Answer using only the provided context.
2. Do not make up information.
3. If the answer is not available in the context,
   clearly say that you cannot find the answer.
4. Keep the answer clear and concise.
5. Answer only what the user asks.
6. Do not add unrelated details or statistics.
7. Do not introduce information that is not directly relevant
   to the question.
8. Clearly distinguish annual rates from monthly rates.

Document Context:
${context.map((chunk, index) => `Chunk ${index + 1}:\n${chunk}`).join("\n\n")}

User Question:
${question}

Answer:
`;

  let response;
  const startTime = Date.now();

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: prompt,
  config: {
    temperature: 0.2,
    httpOptions: {
      timeout: 30000,
    },
  },
});

      break;
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? error.status
          : undefined;

      if (
        (status !== 429 && status !== 503) ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      const delay = 1000 * Math.pow(2, attempt - 1);

      console.log(
        `Gemini temporarily unavailable. Retrying in ${delay / 1000}s...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  console.log(
    `Gemini generation time: ${Date.now() - startTime}ms`,
  );

  if (!response) {
    
    throw new Error("Gemini failed to generate a response after retries");
  }

  const answer = response.text?.trim();

  if (!answer) {
    throw new Error("Gemini returned an empty answer");
  }

  return answer;
};
