
import "dotenv/config";

const listAvailableModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.list();

  for await (const model of response) {
    console.log({
      name: model.name,
      supportedActions: model.supportedActions,
    });
  }
};

listAvailableModels().catch((error) => {
  console.error("Failed to list Gemini models:", error);
});
