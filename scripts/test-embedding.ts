import { generateEmbedding } from "@/utils/embedding";

async function main() {
  console.log("Generating embedding...");

  const text = "Bindery is a platform for processing documents with AI.";

  const embedding = await generateEmbedding(text);

  console.log("Embedding generated.");
  console.log("Number of values:", embedding.length);
  console.log("First 5 values:", embedding.slice(0, 5));
}

main().catch(console.error);