import { PDFParse } from "pdf-parse";

export const extractPdfText = async (
     buffer: Buffer,
): Promise<{ text: string; totalPages: number }> => {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

    try {
        const result = await parser.getText();
        const text = result.text.trim();
        if(!text) {
            throw new Error (
                "No text found in PDF. The PDF may contain scanned images.",
            );
        }
        return {
            text,
            totalPages: result.total,
        };
    } finally {
        await parser.destroy();
    }
};