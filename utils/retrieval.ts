import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embedding";

// This threshold is a starting guess, not a tuned value — Phase 6's
// retrieval-accuracy evaluation (BRD §13, ≥80% target) is where this
// actually gets measured and adjusted. Cosine distance ranges roughly
// 0 (identical) to 2 (opposite) for normalized vectors. The current
// threshold is a broad starting value and must be validated against real
// retrieval examples before it is treated as tuned.
const SIMILARITY_DISTANCE_THRESHOLD = 0.9;

export type RetrievedChunk = {
  id: string;
  page_id: string;
  content: string;
  distance: number;
};

export async function retrieveRelevantChunks(
  workspaceId: string,
  query: string,
  topN = 8
): Promise<RetrievedChunk[]> {
  // Same embedding function used when pages were indexed — this has
  // to be the identical model, or the resulting vectors simply
  // wouldn't be comparable to each other at all.
  const queryEmbedding = await generateEmbedding(query);
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  // $queryRaw (not $executeRaw) because we need rows returned, not
  // just a write executed. Raw SQL is required here for the same
  // reason as the insert step: embedding is an Unsupported type in
  // Prisma's typed client, so any operation actually touching the
  // vector column — including comparing against it — has to be raw.
  //
  // WHERE workspace_id = ... filters directly on the denormalized
  // column (no join through pages needed) — this is the actual
  // tenant-isolation enforcement for AI search, FR-4.1, and it's why
  // that denormalization decision was made back in the schema design.
  //
  // The <=> operator is pgvector's cosine distance. ORDER BY the same
  // expression used in WHERE/SELECT lets Postgres use the HNSW index
  // we created rather than a full table scan — worth confirming later
  // with EXPLAIN ANALYZE, per the AI plan doc.
  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT id, page_id, content, embedding <=> ${vectorLiteral}::vector AS distance
    FROM page_chunks
    WHERE workspace_id = ${workspaceId}::uuid
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${topN}
  `;

  // Threshold filtering happens here, in plain code, after the query —
  // keeps the SQL simple and makes this number easy to find and tune
  // later without touching the query itself.
  return results.filter((r) => r.distance < SIMILARITY_DISTANCE_THRESHOLD);
}