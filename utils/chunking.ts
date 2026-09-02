// Pure function — no database, no AI model, no side effects. This is
// deliberately isolated so it can be tested with a plain string before
// it's ever wired to a real page's content (Step 4.1 of the AI plan).

const CHUNK_SIZE_WORDS = 4; // approximation of ~500 tokens
const OVERLAP_WORDS = 2; // approximation of ~50 tokens

export function chunkText(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
    const chunkWords = words.slice(start, end);
    chunks.push(chunkWords.join(" "));

    if (end === words.length) {
      break; // reached the end — no more chunks needed
    }

    // Move the start point forward, but pull it back by the overlap
    // amount — this is what makes consecutive chunks share their
    // boundary words instead of cutting cleanly with no shared context.
    start = end - OVERLAP_WORDS;
  }

  return chunks;
}