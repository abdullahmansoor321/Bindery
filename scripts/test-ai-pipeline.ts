import { chunkText } from "@/utils/chunking";
import { generateEmbedding } from "@/utils/embedding";

async function main() {
  const text = Array.from(
    { length: 1200 },
    (_, i) => `word${i}`
  ).join(" ");

  console.log("Step 1: Chunking document...");

  const chunks = chunkText(text);

  console.log("Number of chunks:", chunks.length);

  console.log("\nStep 2: Generating embeddings...");

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);

    console.log(
      `Chunk ${i}: ${chunks[i].split(/\s+/).length} words → ${embedding.length} dimensions`
    );
  }

  console.log("\nAI pipeline test completed successfully.");
}

main().catch(console.error);