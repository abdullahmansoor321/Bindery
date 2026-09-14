
import "dotenv/config";

import { retrieveRelevantChunks } from "@/utils/retrieval";

async function main() {
  const results = await retrieveRelevantChunks(
    "04ecf1b6-5771-446a-b981-35608d465823",
    "In my Bindery RAG system, a user asks: ‘Why did my deployment fail?’ Explain the complete journey of this question from the moment it enters retrieveRelevantChunks() until the relevant chunks are ready to be sent to Gemini. Specifically explain what happens to the query embedding, how pgvector calculates distance, how workspaceId, ORDER BY, LIMIT, and the 0.6 threshold affect the result, and give me a concrete example with 5 chunks and distances",
    5
  );

  console.log(`Found ${results.length} relevant chunks:`);

  results.forEach((r) => {
    console.log(
      `  page ${r.page_id} | distance ${r.distance.toFixed(3)} | "${r.content.slice(0, 60)}..."`
    );
  });
}

main().catch(console.error);