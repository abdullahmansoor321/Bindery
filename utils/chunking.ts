// Pure function — no database, no AI model, no side effects. This is
// deliberately isolated so it can be tested with a plain string before
// it's ever wired to a real page's content (Step 4.1 of the AI plan).

const CHUNK_SIZE_WORDS = 100; // approximation of ~500 tokens
const OVERLAP_WORDS = 50; // approximation of ~50 tokens

/**
 * Convert Tiptap HTML into plain text suitable for chunking/embedding.
 *
 * Why this exists: page content is stored as HTML (`{ html }`) so the
 * editors and readers can render formatting, but embedding HTML directly
 * is actively harmful to retrieval:
 *
 *   1. Tag fragments like `<p>` and `</strong>` become part of what the
 *      embedding model encodes. `<p>` appears on every page, so it pulls
 *      all pages' vectors toward each other and reduces the ability to
 *      tell one page from another.
 *   2. Chunking splits on whitespace, so a tag can be split across a
 *      chunk boundary — `<stro` in one chunk, `ng>` in the next.
 *   3. Raw tags would be shown to the LLM as "context", diluting the
 *      grounded prompt with markup instead of prose.
 *
 * So: HTML for display, plain text for retrieval. The DB keeps the HTML;
 * only the embedding path sees the stripped version.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";

  return (
    html
      // Drop every tag (attributes included) and leave a single space so
      // adjacent words don't run together — "<p>A</p><p>B</p>" must become
      // "A B", never "AB". Tags are replaced rather than deleted for
      // exactly that reason: "<b>Bold</b>text" should not become
      // "Boldtext".
      .replace(/<[^>]*>/g, " ")
      // Common named entities. HTML parsers decode these before an editor
      // ever sees them, but content can arrive without that pass.
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      // Any remaining numeric character reference (e.g. &#8217;). This
      // must run AFTER &amp; above, otherwise "&amp;#39;" would decode to
      // "&#39;" and be turned into an apostrophe a second time.
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&amp;/g, "&")
      // Collapse the whitespace runs the tag replacement created. Note
      // chunkText() also splits on /\s+/, so newline-vs-space here makes
      // no difference downstream — normalising is correct, not lossy.
      .replace(/\s+/g, " ")
      .trim()
  );
}

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