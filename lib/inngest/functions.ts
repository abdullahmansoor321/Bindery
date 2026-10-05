import { inngest } from "./client";
import { chunkText } from "@/utils/chunking";
import { generateEmbedding } from "@/utils/embedding";
import { prisma } from "@/lib/prisma";
 
export const embedPageOnSave = inngest.createFunction(
  {
    id: "embed-page-on-save",
    triggers: [{ event: "page/content.saved" }],
  },
  async ({ event, step }) => {
    // workspaceId comes from the real caller (updatePageContent)
    // and will be used later for page_chunks writes.
    const { pageId, workspaceId, text } = event.data;

    const chunks = await step.run("chunk-text", async () => {
      return chunkText(text);
    });

    const embeddings = await step.run("generate-embeddings", async () => {
      const results = [];

      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);

        results.push({
          chunk,
          embedding,
        });
      }

      return results;
    });

    // Intentionally stops here for now.
    // The next phase will replace this with page_chunks database writes.
    console.log(
      `Embedded ${embeddings.length} chunks for page ${pageId} in workspace ${workspaceId}`
    );

    // 4.6 — the actual persistence step, replacing the old console.log.
    await step.run("persist-chunks", async () => {
      await prisma.$transaction(async (tx) => {
        // Delete old chunks FIRST, not append — an edited page must
        // never end up with a mix of stale and current chunks. This
        // is the typed Prisma API working fine, since deleteMany
        // never touches the vector column at all.
        await tx.page_chunks.deleteMany({ where: { page_id: pageId } });
 
        // Insert new chunks one at a time via raw SQL — required
        // specifically because of the vector column (see brainmap
        // above). $executeRaw's tagged-template syntax still safely
        // parameterizes every value here, same injection protection
        // as the typed API gives everywhere else in this app.
        for (let i = 0; i < embeddings.length; i++) {
          const { chunk, embedding } = embeddings[i];
 
          // Postgres's vector type expects a literal string shaped
          // like "[0.1,0.2,0.3,...]" — this is just formatting our
          // JS number array into that exact text form.
          const vectorLiteral = `[${embedding.join(",")}]`;
 
          await tx.$executeRaw`
            INSERT INTO page_chunks (id, page_id, workspace_id, content, embedding, chunk_index, created_at)
            VALUES (
              gen_random_uuid(),
              ${pageId}::uuid,
              ${workspaceId}::uuid,
              ${chunk},
              ${vectorLiteral}::vector,
              ${i},
              now()
            )
          `;
        }
      });
    });
 
    return { pageId, workspaceId, chunkCount: embeddings.length };
  }
);
 
