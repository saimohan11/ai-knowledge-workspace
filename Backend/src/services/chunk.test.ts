
import { splitTextIntoChunks } from "./chunk.service";

const sampleText = `
Inflation increased during April 2022.
Energy prices contributed significantly to inflation.
Food prices also increased during this period.
The annual inflation rate reached 7.5%.
The previous month's rate was 7.4%.
`;

const chunks = splitTextIntoChunks(sampleText, {
  chunkSize: 100,
  overlap: 20,
});

console.log("Total chunks:", chunks.length);

chunks.forEach((chunk, index) => {
  console.log(`\nChunk ${index + 1}:`);
  console.log(chunk);
  console.log("Length:", chunk.length);
});


console.log("\n--- Edge case tests ---");

console.log(
  "Empty text:",
  splitTextIntoChunks(" ").length === 0 ? "PASS" : "FAIL",
);

console.log(
  "Small text:",
  splitTextIntoChunks("Hello world", {
    chunkSize: 100,
    overlap: 20,
  }).length === 1
    ? "PASS"
    : "FAIL",
);

try {
  splitTextIntoChunks("Hello world", {
    chunkSize: 100,
    overlap: 100,
  });
  console.log("Invalid overlap: FAIL");
} catch {
  console.log("Invalid overlap: PASS");
}
