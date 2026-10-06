import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Globe, Clock, ArrowRight } from "lucide-react";

export default async function PublicPageView({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  const page = await prisma.pages.findFirst({
    where: { id: pageId, is_public: true },
    include: {
      workspaces: { select: { name: true } },
    },
  });

  if (!page) {
    notFound();
  }

  // Resolve content from JSONB — supports both the legacy { text } shape
  // (saved before Tiptap) and the current { html } shape. Reading only
  // .text here is what made newly-published pages render blank: new saves
  // have no "text" key at all, so the lookup fell through to "".
  const rawContent = page.content as Record<string, unknown> | null;
  const contentHtml =
    typeof rawContent?.html === "string"
      ? rawContent.html
      : typeof rawContent?.text === "string"
      ? rawContent.text
          .split("\n")
          .map((line: string) => (line.trim() ? `<p>${line}</p>` : "<p></p>"))
          .join("")
      : "";

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Public Page Minimal Header */}
      <header className="h-16 border-b border-[#EAE5DC] bg-white/80 backdrop-blur-sm px-6 sm:px-12 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Logo size="sm" href="/" />
          <span className="text-[#A3AAA3]">/</span>
          <span className="text-xs font-serif font-semibold text-[#1F2421] truncate max-w-[160px]">
            {page.workspaces.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="public" size="sm">
            <Globe className="w-3 h-3 mr-1 inline" />
            Public View
          </Badge>

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#143325] text-[#FAF8F5] text-xs font-semibold hover:bg-[#204D39] transition-colors shadow-2xs"
          >
            <span>Open in Bindery</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Document Reader */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-12 space-y-8">
        <div className="space-y-3 pb-6 border-b border-[#EAE5DC]">
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#1F2421] leading-tight tracking-tight">
            {page.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-[#6B6E6B]">
            <span>Published from {page.workspaces.name}</span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {new Date(page.updated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <article
          className="prose max-w-none text-[#1F2421] text-base sm:text-lg leading-[1.8] font-sans"
          dangerouslySetInnerHTML={{
            __html:
              contentHtml ||
              '<p class="text-sm text-[#A3AAA3] italic">This public document currently has no written content.</p>',
          }}
        />
      </main>

      {/* Public Footer */}
      <footer className="py-8 border-t border-[#EAE5DC] text-center text-xs text-[#6B6E6B] space-y-2">
        <Logo size="sm" showWordmark={false} href="/" className="justify-center" />
        <p>Curated and published on <Link href="/" className="font-semibold text-[#143325] hover:underline">Bindery</Link></p>
      </footer>
    </div>
  );
}