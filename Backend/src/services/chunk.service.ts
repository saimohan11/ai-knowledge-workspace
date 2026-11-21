
interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export const splitTextIntoChunks = (
  text: string,
  options: ChunkOptions = {},
): string[] => {
  const chunkSize = options.chunkSize ?? 1000;
  const overlap = options.overlap ?? 200;

  if (chunkSize <= 0) {
    throw new Error("Chunk size must be greater than zero");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error(
      "Overlap must be non-negative and smaller than chunk size",
    );
  }

  const normalizedText = text.trim().replace(/\s+/g, " ");

  if (!normalizedText) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalizedText.length) {
    let end = Math.min(start + chunkSize, normalizedText.length);

    // Prefer a word boundary without making the chunk too short.
    if (end < normalizedText.length) {
      const spaceIndex = normalizedText.lastIndexOf(" ", end);

      if (spaceIndex > start + chunkSize * 0.7) {
        end = spaceIndex;
      }
    }

    const chunk = normalizedText.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end === normalizedText.length) {
      break;
    }

    // Guarantee forward progress while preserving the requested overlap.
    let nextStart = end - overlap;

    // Move to the next word boundary if we're inside a word.
    const nextSpace = normalizedText.indexOf(" ", nextStart);

    if (
      nextStart > start &&
      normalizedText[nextStart] !== " " &&
      nextSpace !== -1 &&
      nextSpace < end
    ) {
      nextStart = nextSpace + 1;
    }

    start = Math.max(start + 1, nextStart);
  }

  return chunks;
};
